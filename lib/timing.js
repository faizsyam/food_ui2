/**
 * timing.js
 *
 * Pure utility module — no React, no side effects.
 * Calculates order-completion timing from delivery + prep times.
 *
 * Minimum  = delivery_time + max(prep times of items)
 * Maximum  = delivery_time + sum(prep times of items)
 */

function addMinutesToIso(iso, minutes) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function extractPrepTimes(option, menus) {
  if (!option?.items || !Array.isArray(menus)) return [];
  const prepTimes = [];
  for (const item of option.items) {
    const menuItem = menus.find((m) => m.id === item.item_id);
    if (menuItem?.preparation_time_minutes != null) {
      prepTimes.push(menuItem.preparation_time_minutes);
    }
  }
  return prepTimes;
}

function computeRange(deliveryMinutes, prepTimes) {
  if (typeof deliveryMinutes !== 'number' || deliveryMinutes < 0) return null;
  if (prepTimes.length === 0) {
    return { min: deliveryMinutes, max: deliveryMinutes };
  }
  return {
    min: deliveryMinutes + Math.max(...prepTimes),
    max: deliveryMinutes + prepTimes.reduce((a, b) => a + b, 0),
  };
}

export function calculateOptionTiming(option, menus, restaurant) {
  const range = computeRange(restaurant?.delivery_time_minutes ?? 0, extractPrepTimes(option, menus));
  if (!range) return null;
  const now = new Date().toISOString();
  return {
    minMinutes: range.min,
    maxMinutes: range.max,
    minArrival: addMinutesToIso(now, range.min),
    maxArrival: addMinutesToIso(now, range.max),
  };
}

export function calculateSlotTiming(slot, menus) {
  if (!slot) return null;
  const selected =
    (slot.resolvedOptions || []).find((o) => o.option_id === slot.selected_option_id) ||
    slot.resolvedOptions?.[0];
  if (!selected) return null;

  const prepTimes = (selected.resolvedItems || [])
    .map((it) => it.preparation_time_minutes)
    .filter((v) => typeof v === 'number' && v > 0);

  const range = computeRange(selected.restaurant?.delivery_time_minutes ?? 0, prepTimes);
  if (!range) return null;
  return { minMinutes: range.min, maxMinutes: range.max };
}

export function formatTimingRange(minMinutes, maxMinutes) {
  if (minMinutes === maxMinutes) return `${minMinutes} min${minMinutes !== 1 ? 's' : ''}`;
  return `${minMinutes}-${maxMinutes} mins`;
}

export function calculateOrderTiming(orderItems, menus, restaurants) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return [];

  const byRestaurant = {};
  for (const item of orderItems) {
    const rid = item.restaurant_id || item.restaurant?.id;
    if (!rid) continue;
    if (!byRestaurant[rid]) {
      byRestaurant[rid] = {
        items: [],
        restaurant: restaurants.find((r) => r.id === rid),
      };
    }
    byRestaurant[rid].items.push(item);
  }

  const results = [];
  for (const rid of Object.keys(byRestaurant)) {
    const group = byRestaurant[rid];
    const prepTimes = group.items
      .map((it) => {
        const m = menus.find((x) => x.id === it.item_id || x.id === it.id);
        return m?.preparation_time_minutes;
      })
      .filter((v) => typeof v === 'number' && v > 0);

    const range = computeRange(group.restaurant?.delivery_time_minutes ?? 0, prepTimes);
    if (range) {
      results.push({
        restaurant_id: rid,
        restaurant_name: group.restaurant?.name || rid,
        minMinutes: range.min,
        maxMinutes: range.max,
      });
    }
  }
  return results;
}
