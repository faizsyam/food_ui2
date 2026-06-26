/**
 * generate-schema.js
 *
 * Next.js API route that receives a user's natural language request,
 * constructs an AI prompt, calls the LLM, and returns a parsed order schema.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { AGENT_PROMPT } from '../../lib/agentPrompt';

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
  const openIdx = text.indexOf('```');
  if (openIdx === -1) return text.trim(); // no fences at all

  // Find the first newline after the opening fence (start of actual JSON)
  let contentStart = openIdx;
  const firstNl = text.indexOf('\n', openIdx);
  if (firstNl !== -1) {
    contentStart = firstNl + 1;
  }

  // Find the last closing fence ```
  const closeIdx = text.lastIndexOf('```');
  if (closeIdx !== -1 && closeIdx > contentStart) {
    return text.slice(contentStart, closeIdx).trim();
  }
  // Fallback: no closing fence found, grab everything after the opening fence line
  return text.slice(contentStart).trim();
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
    const { request: userRequest } = req.body || {};
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

    // Build the AI prompt
    const systemPrompt = AGENT_PROMPT;
    const userMessage = `
## Restaurants
${JSON.stringify(restaurants, null, 2)}

## Menu Items
${JSON.stringify(menus, null, 2)}

## User Request
${userRequest}
`;

    // Call the AI API via NVIDIA NIM
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'AI API configuration missing (NVIDIA_API_KEY)',
      });
    }

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
        max_tokens: 4096,
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

    // Strip markdown fences and parse JSON
    let parsedSchema;
    let rawForLogging = rawContent;
    try {
      const cleaned = stripMarkdownFences(rawContent);
      parsedSchema = JSON.parse(cleaned);
    } catch (parseError) {
      // Fallback: sometimes the LLM wraps JSON inside other text but still has balance braces
      // Try to find the first '{' and last '}' and extract what's between them
      const firstBrace = rawContent.indexOf('{');
      const lastBrace = rawContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const extracted = rawContent.slice(firstBrace, lastBrace + 1);
          parsedSchema = JSON.parse(extracted);
        } catch (fallbackError) {
          return res.status(502).json({
            error: `Failed to parse AI response: ${fallbackError.message}`,
            debug: rawForLogging.substring(0, 500),
          });
        }
      } else {
        return res.status(502).json({
          error: `Failed to parse AI response: ${parseError.message}`,
          debug: rawForLogging.substring(0, 500),
        });
      }
    }

    // Validate minimum required fields
    if (
      !parsedSchema ||
      typeof parsedSchema !== 'object' ||
      !Array.isArray(parsedSchema.slots) ||
      !parsedSchema.layout ||
      typeof parsedSchema.layout !== 'object'
    ) {
      return res.status(422).json({
        error: 'Invalid schema returned',
      });
    }

    // ── Post-processing ────────────────────────────────────────────────────

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

    // 3. Recompute checkout_ready and blocking_issues
    const blockingCodes =
      Array.isArray(parsedSchema.warnings)
        ? parsedSchema.warnings
            .filter((w) => w.severity === 'blocking')
            .map((w) => w.code)
        : [];

    if (parsedSchema.order_summary) {
      parsedSchema.order_summary.checkout_ready = blockingCodes.length === 0;
      parsedSchema.order_summary.blocking_issues = blockingCodes;
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
