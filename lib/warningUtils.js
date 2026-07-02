/**
 * warningUtils.js
 *
 * Pure utility for classifying warning objects by scope.
 * Takes flat warning array and produces per-scope collections.
 */

// ---------------------------------------------------------------------------
// classifyWarnings
// ---------------------------------------------------------------------------

/**
 * Classify warnings into scopes: global, per-slot, per-item.
 *
 * A warning with no specific slot or item reference is global.
 * A warning tagged with slot IDs is distributed to each of those slots.
 * A warning tagged with item IDs is distributed to each of those items.
 *
 * @param {Array} warnings – list of { code, message, severity, related_slot_ids, related_item_ids }
 * @returns {{ global: Array, bySlot: Record<string,Array>, byItem: Record<string,Array>, anyGlobalBlocking: boolean }}
 */
// Codes that should always stay in the global bucket even if they reference slot IDs.
const GLOBAL_CODES = new Set(['MULTI_RESTAURANT_ORDER', 'MISSING_ADDRESS']);

export function classifyWarnings(warnings) {
  const global = [];
  const bySlot = {};
  const byItem = {};

  if (!Array.isArray(warnings)) {
    return { global, bySlot, byItem, anyGlobalBlocking: false };
  }

  for (const warning of warnings) {
    const slotIds = warning.related_slot_ids || [];
    const itemIds = warning.related_item_ids || [];

    // Explicit global-level codes (cross-order concerns)
    if (warning.code && GLOBAL_CODES.has(warning.code)) {
      global.push(warning);
      continue;
    }

    // Warnings with no specific slot/item reference are global
    if (!slotIds.length && !itemIds.length) {
      global.push(warning);
      continue;
    }

    // Distribute to ALL related slots
    for (const slotId of slotIds) {
      if (!bySlot[slotId]) bySlot[slotId] = [];
      bySlot[slotId].push(warning);
    }

    // Distribute to items
    for (const itemId of itemIds) {
      if (!byItem[itemId]) byItem[itemId] = [];
      byItem[itemId].push(warning);
    }
  }

  const anyGlobalBlocking = global.some((w) => w.severity === 'blocking');

  return { global, bySlot, byItem, anyGlobalBlocking };
}

// ---------------------------------------------------------------------------
// computeMinOrderWarnings – live, reactive
// ---------------------------------------------------------------------------

// Lightweight IDR formatter (no dependency on lib/format to keep this pure)
function fmtIDR(amount) {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compute live min_order warnings from current cart state.
 * Only generates warnings for restaurants where cart subtotal < min_order.
 *
 * @param {Array} orderItems    – live cart items { restaurant_id, unit_price, quantity, ... }
 * @param {Array} restaurants   – full restaurant list
 * @param {object} schema      – current schema (for slot-to-restaurant mapping)
 * @returns {Array}             – live warning objects
 */
export function computeMinOrderWarnings(orderItems, restaurants, schema) {
  const warnings = [];

  // Group cart items by restaurant
  const byRestaurant = {};
  for (const item of orderItems || []) {
    const rid = item.restaurant_id;
    if (!rid) continue;
    if (!byRestaurant[rid]) byRestaurant[rid] = [];
    byRestaurant[rid].push(item);
  }

  for (const [rid, items] of Object.entries(byRestaurant)) {
    const restaurant = (restaurants || []).find((r) => r.id === rid);
    if (!restaurant) continue;
    if (!restaurant.min_order || restaurant.min_order <= 0) continue;

    const subtotal = items.reduce(
      (s, it) => s + (it.line_total || (it.unit_price || 0) * (it.quantity || 1)),
      0
    );

    if (subtotal < restaurant.min_order) {
      // Find which slots order from this restaurant
      const affectedSlotIds = [];
      for (const slot of schema?.slots || []) {
        const opt =
          (slot.resolvedOptions || []).find((o) => o.restaurant?.id === rid) ||
          (slot.options || []).find((o) => o.restaurant_id === rid);
        if (opt) affectedSlotIds.push(slot.slot_id);
      }

      warnings.push({
        code: 'MIN_ORDER_NOT_MET',
        severity: 'info',
        message: `Minimum order Rp ${fmtIDR(restaurant.min_order)} not met for ${restaurant.name}`,
        suggestion: `Need Rp ${fmtIDR(restaurant.min_order - subtotal)} more to reach the minimum`,
        related_slot_ids: [...new Set(affectedSlotIds)],
        related_item_ids: [],
      });
    }
  }

  return warnings;
}
