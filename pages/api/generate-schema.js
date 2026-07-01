/**
 * generate-schema.js
 *
 * Next.js API route that receives a user's natural language request,
 * constructs an AI prompt, calls the LLM, and returns a parsed order schema.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { AGENT_PROMPT } from '../../lib/agentPrompt';
import { REQUIREMENT_GENERATOR_PROMPT } from '../../lib/requirementGeneratorPrompt';
import { filterData } from '../../lib/filterData';

/**
 * Load JSON data from the project's data directory.
 */
function loadData(filename) {
  const filePath = join(process.cwd(), 'data', filename);
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Strip markdown fences from LLM response text, robustly handling:
 * - Leading/trailing ```json or ```
 * - Explanatory text before/after the code block
 * - Trailing content after the closing fence
 * Returns the cleaned text (may still need JSON.parse).
 */
function stripMarkdownFences(text) {
  if (!text) return '';
  // Find first opening fence: either ``` or ```json
  const openIdx = text.indexOf('\x60\x60\x60'); // actual backtick x3
  if (openIdx === -1) return text.trim(); // no fences at all

  // Find the first newline after the opening fence (start of actual JSON)
  let contentStart = openIdx;
  const firstNl = text.indexOf('\n', openIdx);
  if (firstNl !== -1) {
    contentStart = firstNl + 1;
  }

  // Find the last closing fence ```
  const closeIdx = text.lastIndexOf('\x60\x60\x60');
  if (closeIdx !== -1 && closeIdx > contentStart) {
    return text.slice(contentStart, closeIdx).trim();
  }
  // Fallback: no closing fence found, grab everything after the opening fence line
  return text.slice(contentStart).trim();
}

/**
 * Escape literal control characters that appear inside JSON string values.
 * LLMs sometimes output unescaped newlines or tabs inside strings (e.g.
 * notes, highlight_reason). This walks the text, tracks whether it is
 * inside a string, and escapes any control characters found there.
 */
function sanitizeJsonStrings(text) {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      result += char;
      escapeNext = true;
      continue;
    }

    if (char === '"' && !inString) {
      inString = true;
      result += char;
    } else if (char === '"' && inString) {
      inString = false;
      result += char;
    } else if (inString && code >= 0x00 && code <= 0x1f) {
      // Control character inside a string — must be escaped
      if (code === 0x09) result += '\\t';
      else if (code === 0x0a) result += '\\n';
      else if (code === 0x0d) result += '\\r';
      else result += '\\u' + code.toString(16).padStart(4, '0');
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Extract the slice around the error position for debugging.
 */
function getDebugSnippet(text, position, radius = 200) {
  if (!text || position < 0) return text;
  const start = Math.max(0, position - radius);
  let end = Math.min(text.length, position + radius);
  return text.substring(start, end);
}

/**
 * Call the Requirement Generator Agent to extract filter criteria from
 * the user request (optionally with a previous schema for refinement).
 */
async function callRequirementAgent(userRequest, previousSchema, previousFilters, apiKey) {
  let userMessage;

  if (previousSchema && typeof previousSchema === 'object') {
    const parts = [
      '## Previous Order Schema',
      JSON.stringify(previousSchema),
    ];
    if (previousFilters && typeof previousFilters === 'object') {
      parts.push(
        '## Previously Extracted Filters (carry forward unless explicitly changed)',
        JSON.stringify(previousFilters)
      );
    }
    parts.push(
      '',
      '## Refinement Instruction',
      userRequest,
    );
    userMessage = parts.join('\n');
  } else {
    userMessage = [
      '## User Request',
      userRequest,
    ].join('\n');
  }

  try {
    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.6',
        messages: [
          { role: 'system', content: REQUIREMENT_GENERATOR_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    if (!aiResponse.ok) {
      console.warn('[callRequirementAgent] AI API error:', aiResponse.status);
      return getDefaultFilters();
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return getDefaultFilters();
    }

    let cleaned = stripMarkdownFences(rawContent);
    cleaned = sanitizeJsonStrings(cleaned);
    const filters = JSON.parse(cleaned);

    if (!filters || typeof filters !== 'object') {
      return getDefaultFilters();
    }

    return filters;
  } catch (err) {
    console.warn('[callRequirementAgent] Error calling requirement agent:', err.message);
    return getDefaultFilters();
  }
}

function getDefaultFilters() {
  return {
    required_tags: [],
    optional_tags: [],
    excluded_tags: [],
    cuisine: [],
    excluded_cuisines: [],
    categories: [],
    max_price: null,
    max_preparation_time: null,
    max_delivery_time: null,
    max_total_time: null,
    max_delivery_fee: null,
    min_rating: null,
    promo_only: false,
  };
}

/**
 * Main API handler.
 */
export default async function handler(req, res) {
  // Accept POST only
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read request body
    const { request: userRequest, previousSchema } = req.body || {};
    if (!userRequest || typeof userRequest !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "request" field' });
    }

    // Load restaurant and menu data
    let restaurants;
    let menus;
    try {
      restaurants = loadData('restaurants.json');
      menus = loadData('menus.json');
    } catch (loadError) {
      return res.status(500).json({
        error: `Failed to load data files: ${loadError.message}`,
      });
    }

    // --- Stage 1: Requirement Generator Agent ---
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'AI API configuration missing (NVIDIA_API_KEY)',
      });
    }

    const previousFilters =
      previousSchema && previousSchema._requirementFilters
        ? previousSchema._requirementFilters
        : null;
    const filters = await callRequirementAgent(userRequest, previousSchema, previousFilters, apiKey);
    console.log('[generate-schema] Requirement filters:', JSON.stringify(filters));

    const { restaurants: filteredRestaurants, menus: filteredMenus, filteringSkipped } =
      filterData(restaurants, menus, filters);

    if (filteringSkipped) {
      console.warn('[generate-schema] Filtering skipped — fewer than 5 items matched; using full dataset.');
    }

    // Build the AI prompt
    const systemPrompt = AGENT_PROMPT;

    let userMessageParts = [
      '## Restaurants',
      JSON.stringify(filteredRestaurants, null, 2),
      '',
      '## Menu Items',
      JSON.stringify(filteredMenus, null, 2),
      '',
      '## Current timestamp',
      new Date().toISOString(),
      '',
    ];

    if (previousSchema && typeof previousSchema === 'object') {
      userMessageParts = userMessageParts.concat([
        '## Previous Order Schema',
        JSON.stringify(previousSchema),
        '',
        '## Refinement Instruction',
        userRequest,
      ]);
    } else {
      userMessageParts = userMessageParts.concat([
        '## User Request',
        userRequest,
      ]);
    }

    const userMessage = userMessageParts.join('\n');

    // Call the AI API via NVIDIA NIM
    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.6',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return res.status(502).json({
        error: `AI API error: ${aiResponse.status} — ${errorText}`,
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return res.status(502).json({ error: 'AI returned empty response' });
    }

    // Strip markdown fences, sanitise control chars, parse JSON
    let parsedSchema;
    let rawForLogging = rawContent;
    let parseErrorInfo = null;
    try {
      let cleaned = stripMarkdownFences(rawContent);
      cleaned = sanitizeJsonStrings(cleaned);
      parsedSchema = JSON.parse(cleaned);
    } catch (parseError) {
      parseErrorInfo = parseError;
      // Fallback: extract first {...balanced} pair
      let firstBrace = rawContent.indexOf('{');
      let lastBrace = -1;
      let depth = 0;
      for (let i = firstBrace; i < rawContent.length && firstBrace !== -1; i++) {
        if (rawContent[i] === '{') depth++;
        if (rawContent[i] === '}') depth--;
        if (depth === 0) {
          lastBrace = i;
          break;
        }
      }
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          let extracted = rawContent.slice(firstBrace, lastBrace + 1);
          extracted = sanitizeJsonStrings(extracted);
          parsedSchema = JSON.parse(extracted);
          parseErrorInfo = null;
        } catch (fallbackError) {
          const errPos = fallbackError.message.match(/position (\d+)/);
          const pos = errPos ? parseInt(errPos[1], 10) : 0;
          return res.status(502).json({
            error: `Failed to parse AI response: ${fallbackError.message}`,
            debug: getDebugSnippet(rawForLogging, pos, 300),
          });
        }
      } else {
        const errPos = parseError.message.match(/position (\d+)/);
        const pos = errPos ? parseInt(errPos[1], 10) : 0;
        return res.status(502).json({
          error: `Failed to parse AI response: ${parseError.message}`,
          debug: getDebugSnippet(rawForLogging, pos, 300),
        });
      }
    }

    // Validate minimum required fields
    if (
      !parsedSchema ||
      typeof parsedSchema !== 'object' ||
      !Array.isArray(parsedSchema.slots)
    ) {
      return res.status(422).json({
        error: 'Invalid schema returned',
      });
    }

    // -- Post-processing ----------------------------------------------------

    // 1. Address fallback for every slot with a missing address
    const fallbackAddress = 'Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta 10220';
    if (Array.isArray(parsedSchema.slots)) {
      for (const slot of parsedSchema.slots) {
        if (!slot.delivery?.address) {
          slot.delivery = { ...slot.delivery, address: fallbackAddress };
        }
      }
    }

    // 2. Remove MISSING_ADDRESS warnings
    if (Array.isArray(parsedSchema.warnings)) {
      parsedSchema.warnings = parsedSchema.warnings.filter(
        (w) => w?.code !== 'MISSING_ADDRESS'
      );
    }

    // 4. Recalculate timing and meets_min_order for each option based on real data
    if (Array.isArray(parsedSchema.slots)) {
      for (const slot of parsedSchema.slots) {
        if (!Array.isArray(slot.options)) continue;
        for (const option of slot.options) {
          if (!option.restaurant_id || !Array.isArray(option.items)) continue;

          const restaurant = restaurants.find((r) => r.id === option.restaurant_id);
          const prepTimes = [];
          for (const item of option.items) {
            const menuItem = menus.find((m) => m.id === item.item_id);
            if (menuItem?.preparation_time_minutes != null) {
              prepTimes.push(menuItem.preparation_time_minutes);
            }
          }

          if (prepTimes.length > 0 && restaurant?.delivery_time_minutes != null) {
            const minMinutes = restaurant.delivery_time_minutes + Math.max(...prepTimes);
            const now = new Date();
            const minArrival = new Date(now.getTime() + minMinutes * 60000).toISOString();
            option.estimated_arrival = minArrival;
          }

          // Recompute meets_min_order after timing/prep recalculation
          option.meets_min_order = option.subtotal >= (restaurant?.min_order || 0);
        }
      }
    }

    // 5. Re-validate selected_option_id against Option Selection Priority
    // If the originally selected option's meets_min_order flipped to false,
    // or its meets_preferences is false while a sibling has true,
    // auto-reassign to the best qualifying sibling.
    if (Array.isArray(parsedSchema.slots)) {
      for (const slot of parsedSchema.slots) {
        if (!Array.isArray(slot.options) || !slot.selected_option_id) continue;

        const selectedOpt = slot.options.find((o) => o.option_id === slot.selected_option_id);
        if (!selectedOpt) continue;

        let betterSibling = null;
        let reason = '';

        // Priority 1: preference correctness (if selected fails but a sibling passes)
        if (selectedOpt.meets_preferences === false) {
          betterSibling = slot.options.find(
            (o) => o.option_id !== slot.selected_option_id && o.meets_preferences === true
          );
          if (betterSibling) {
            reason = 'to match all stated preferences';
          }
        }

        // Priority 2: meets_min_order (if selected fails but a sibling passes)
        if (!betterSibling && selectedOpt.meets_min_order === false) {
          betterSibling = slot.options.find(
            (o) => o.option_id !== slot.selected_option_id && o.meets_min_order === true
          );
          if (betterSibling) {
            reason = 'to meet minimum order';
          }
        }

        if (betterSibling) {
          const oldLabel = selectedOpt.label || selectedOpt.option_id;
          const newLabel = betterSibling.label || betterSibling.option_id;
          slot.selected_option_id = betterSibling.option_id;
          if (!Array.isArray(parsedSchema.warnings)) parsedSchema.warnings = [];
          parsedSchema.warnings.push({
            code: 'AUTO_REASSIGNED_OPTION',
            message: `Automatically switched ${slot.person?.name || 'this slot'} from "${oldLabel}" to "${newLabel}" ${reason}.`,
            severity: 'info',
            related_slot_ids: [slot.slot_id],
            suggestion: `The original option no longer qualified after recalculation — a better sibling option was chosen instead.`
          });
        }
      }
    }

    // 6. Mirror selected option's estimated_arrival into slot.delivery.estimated_arrival
    if (Array.isArray(parsedSchema.slots)) {
      for (const slot of parsedSchema.slots) {
        if (!slot.selected_option_id || !Array.isArray(slot.options) || !slot.delivery) continue;
        const selectedOpt = slot.options.find((o) => o.option_id === slot.selected_option_id);
        if (selectedOpt?.estimated_arrival) {
          slot.delivery.estimated_arrival = selectedOpt.estimated_arrival;
        }
      }
    }

    // 7. Recompute order_summary from actual post-processed slots after all adjustments.
    // The AI may have computed order_summary before we reassigned selected_option_id
    // or recalculated timing, so we rebuild it from the actual selected options.
    const restaurantMap = new Map();
    let aiGrandTotal = 0;

    if (Array.isArray(parsedSchema.slots)) {
      for (const slot of parsedSchema.slots) {
        if (!slot.selected_option_id || !Array.isArray(slot.options)) continue;
        const opt = slot.options.find((o) => o.option_id === slot.selected_option_id);
        if (!opt) continue;

        const rid = opt.restaurant_id;
        if (!restaurantMap.has(rid)) {
          restaurantMap.set(rid, {
            restaurant_id: rid,
            slot_ids: [],
            items_subtotal: 0,
            delivery_fee: opt.delivery_fee || 0,
            min_order: (restaurants.find((r) => r.id === rid) || {}).min_order || 0,
            meets_min_order: true,
          });
        }
        const entry = restaurantMap.get(rid);
        entry.slot_ids.push(slot.slot_id);
        entry.items_subtotal += opt.subtotal || 0;
        entry.meets_min_order = entry.items_subtotal >= entry.min_order;
        aiGrandTotal += (opt.subtotal || 0) + (opt.delivery_fee || 0);
      }
    }

    const blockingCodes =
      Array.isArray(parsedSchema.warnings)
        ? parsedSchema.warnings
            .filter((w) => w.severity === 'blocking')
            .map((w) => w.code)
        : [];

    // Build or overwrite order_summary to match actual slots
    parsedSchema.order_summary = {
      ...parsedSchema.order_summary,
      restaurant_breakdown: Array.from(restaurantMap.values()).map((e) => ({
        ...e,
        slot_ids: e.slot_ids,
      })),
      grand_total: aiGrandTotal,
      checkout_ready: blockingCodes.length === 0,
      blocking_issues: blockingCodes,
    };

    // Store extracted requirement filters for refinement statekeeping
    if (parsedSchema && typeof parsedSchema === 'object') {
      parsedSchema._requirementFilters = filters;
    }

    // Log the generated schema for debugging
    console.log('[generate-schema] Parsed schema:', JSON.stringify(parsedSchema, null, 2));

    // Return the parsed schema
    return res.status(200).json({ schema: parsedSchema });
  } catch (error) {
    return res.status(500).json({
      error: `Server error: ${error.message || 'Unknown error'}`,
    });
  }
}
