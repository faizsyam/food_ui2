/**
 * resolveSchema.js
 *
 * Pure utility module — no React, no side effects.
 * Translates raw order schema JSON into enriched data for the UI layer.
 */

import { calculateOptionTiming } from './timing';

// ---------------------------------------------------------------------------
// resolveSlot
// ---------------------------------------------------------------------------

/**
 * Enrich a single slot with matched restaurant and menu data.
 * Options in each slot are resolved individually.
 * Returns null if any option's restaurant_id or item_id cannot be matched.
 *
 * @param {object} slot       — raw slot from schema.slots
 * @param {Array}  restaurants — full restaurants array
 * @param {Array}  menus      — full menus array
 * @returns {object|null}     — enriched slot or null
 */
function resolveSlot(slot, restaurants, menus) {
  if (!slot || typeof slot !== 'object') return null;
  if (!Array.isArray(slot.options) || slot.options.length === 0) return null;

  const resolvedOptions = [];

  for (const option of slot.options) {
    if (!option || !option.restaurant_id) return null;

    const restaurant = restaurants.find((r) => r.id === option.restaurant_id);
    if (!restaurant) return null;

    const resolvedItems = [];

    for (const item of option.items || []) {
      if (!item || !item.item_id) return null;

      const menuItem = menus.find((m) => m.id === item.item_id);
      if (!menuItem) return null;

      const activeVariant =
        item.variant && Array.isArray(menuItem.variants)
          ? menuItem.variants.find((v) => v.name === item.variant) || null
          : null;

      const basePrice = menuItem.price || 0;
      const hasPromo = !!menuItem.promo;
      const effectiveBasePrice = hasPromo
        ? (menuItem.promo.discounted_price ?? basePrice)
        : basePrice;
      const variantDelta = activeVariant?.price_delta || 0;
      const quantity = item.quantity || 1;

      const lineTotal = (effectiveBasePrice + variantDelta) * quantity;
      const isUnavailable = menuItem.available === false;

      resolvedItems.push({
        ...item,
        ...menuItem,
        promo: menuItem.promo || null,
        activeVariant,
        lineTotal,
        isUnavailable,
      });
    }

    // Calculate timing for this option
    const optionTiming = calculateOptionTiming(option, menus, restaurant);

    resolvedOptions.push({
      ...option,
      restaurant,
      resolvedItems,
      timing: optionTiming,
      meets_min_order: option.meets_min_order,
      meets_preferences: option.meets_preferences,
      deadline_ok: option.deadline_ok,
    });
  }

  const selectedOption = resolvedOptions.find(
    (o) => o.option_id === slot.selected_option_id
  );

  const resolvedItems =
    (selectedOption || resolvedOptions)?.resolvedItems || [];

  // Compute timing for the selected option
  let selectedTiming = null;
  if (selectedOption?.timing) {
    selectedTiming = selectedOption.timing;
  } else if (resolvedOptions[0]?.timing) {
    selectedTiming = resolvedOptions[0].timing;
  }

  return {
    ...slot,
    timing: selectedTiming,
    resolvedOptions,
    resolvedSelectedOption: selectedOption || resolvedOptions[0] || null,
    resolvedItems,
  };
}

// ---------------------------------------------------------------------------
// resolveWarnings
// ---------------------------------------------------------------------------

function resolveWarnings(schema) {
  if (!schema || !Array.isArray(schema.warnings)) {
    return [];
  }

  return [...schema.warnings]
    .map((warning, index) => ({ warning, index }))
    .sort((a, b) => {
      const aMulti = (a.warning?.affected_slot_ids || []).length > 1;
      const bMulti = (b.warning?.affected_slot_ids || []).length > 1;

      if (aMulti && !bMulti) return -1;
      if (!aMulti && bMulti) return 1;
      return a.index - b.index;
    })
    .map(({ warning }) => warning);
}

// ---------------------------------------------------------------------------
// Budget helpers
// ---------------------------------------------------------------------------

function parseBudgetValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;

  let str = value.trim().toLowerCase();
  if (!str) return null;

  str = str.replace(/^rp\.?\s*/i, '').trim();
  if (!str) return null;

  if (/[\d.,]+k$/.test(str)) {
    const num = parseFloat(str.slice(0, -1).replace(/,/g, ''));
    return isNaN(num) ? null : num * 1000;
  }

  const jtMatch = str.match(/^([\d.,]+)(?:jt|juta)$/);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(/,/g, ''));
    return isNaN(num) ? null : num * 1000000;
  }

  const cleaned = str.replace(/[,.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseBudgetLimit(constraints) {
  if (!constraints || typeof constraints !== 'object') return null;

  const budgetKeys = Object.keys(constraints).filter((key) =>
    /budget|limit|max|total/i.test(key)
  );

  for (const key of budgetKeys) {
    const value = constraints[key];
    const parsed = parseBudgetValue(value);
    if (parsed !== null) return parsed;
  }

  return null;
}

// ---------------------------------------------------------------------------
// resolveBudget
// ---------------------------------------------------------------------------

function resolveBudget(schema, resolvedSlots, restaurants) {
  const safeSlots = resolvedSlots || [];

  const slotSubtotals = safeSlots.map((slot) => ({
    slot_id: slot.slot_id || '',
    person_name: slot.person?.name || '',
    subtotal: slot.resolvedSelectedOption?.subtotal || 0,
  }));

  const totalItems = slotSubtotals.reduce((sum, s) => sum + s.subtotal, 0);

  // Sum delivery fees from selected options' restaurants
  const seenRestaurants = new Set();
  let totalDelivery = 0;

  for (const slot of safeSlots) {
    const opt = slot.resolvedSelectedOption;
    if (!opt?.restaurant) continue;
    const rid = opt.restaurant.id;
    if (!rid || seenRestaurants.has(rid)) continue;
    seenRestaurants.add(rid);
    totalDelivery += opt.restaurant.delivery_fee || 0;
  }

  const grandTotal = totalItems + totalDelivery;
  const budgetLimit = parseBudgetLimit(schema?.constraints);

  const isOverBudget = budgetLimit !== null && grandTotal > budgetLimit;
  const isNearBudget =
    budgetLimit !== null &&
 grandTotal > budgetLimit * 0.85;

  return {
    slotSubtotals,
    totalItems,
    totalDelivery,
    grandTotal,
    budgetLimit,
    isOverBudget,
    isNearBudget,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  resolveSlot,
  resolveWarnings,
  resolveBudget,
};
