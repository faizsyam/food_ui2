/**
 * filterData.js
 *
 * Pure utility that filters restaurants and menu items based on extracted
 * requirement filters. Falls back to unfiltered data when fewer than 5
 * menu items survive, so the downstream agent always has a usable dataset.
 */

/**
 * @param {Array} restaurants
 * @param {Array} menus
 * @param {Object} filters
 * @returns {{restaurants: Array, menus: Array, filteringSkipped: boolean}}
 */
export function filterData(restaurants, menus, filters) {
  // Build a map of restaurant delivery times for total-time filtering
  const restaurantDeliveryTimeMap = new Map();
  for (const r of restaurants) {
    restaurantDeliveryTimeMap.set(r.id, r.delivery_time_minutes);
  }

  // --- A. Filter restaurants ---
  const qualifiedRestaurantIds = new Set();

  for (const restaurant of restaurants) {
    let passes = true;

    if (Array.isArray(filters.cuisine) && filters.cuisine.length > 0) {
      if (!filters.cuisine.some((c) => c.toLowerCase() === restaurant.cuisine?.toLowerCase())) {
        passes = false;
      }
    }

    if (passes && Array.isArray(filters.excluded_cuisines) && filters.excluded_cuisines.length > 0) {
      if (filters.excluded_cuisines.some((c) => c.toLowerCase() === restaurant.cuisine?.toLowerCase())) {
        passes = false;
      }
    }

    if (passes && filters.max_delivery_time != null) {
      if (restaurant.delivery_time_minutes > filters.max_delivery_time) {
        passes = false;
      }
    }

    if (passes && filters.max_delivery_fee != null) {
      if (restaurant.delivery_fee > filters.max_delivery_fee) {
        passes = false;
      }
    }

    if (passes && filters.min_rating != null) {
      if (restaurant.rating < filters.min_rating) {
        passes = false;
      }
    }

    if (passes) {
      qualifiedRestaurantIds.add(restaurant.id);
    }
  }

  // --- B. Filter menu items ---
  const filteredMenus = [];
  const activeRestaurantIds = new Set();

  for (const item of menus) {
    if (!qualifiedRestaurantIds.has(item.restaurant_id)) {
      continue;
    }

    if (Array.isArray(filters.excluded_tags) && filters.excluded_tags.length > 0) {
      const itemTags = new Set(item.tags || []);
      if (filters.excluded_tags.some((t) => itemTags.has(t))) {
        continue;
      }
    }

    if (Array.isArray(filters.required_tags) && filters.required_tags.length > 0) {
      const itemTags = new Set(item.tags || []);
      if (!filters.required_tags.some((t) => itemTags.has(t))) {
        continue;
      }
    }

    if (Array.isArray(filters.categories) && filters.categories.length > 0) {
      if (!filters.categories.includes(item.category)) {
        continue;
      }
    }

    if (filters.max_price != null) {
      if (item.price > filters.max_price) {
        continue;
      }
    }

    if (filters.max_preparation_time != null) {
      if (item.preparation_time_minutes > filters.max_preparation_time) {
        continue;
      }
    }

    if (filters.max_total_time != null) {
      const deliveryTime = restaurantDeliveryTimeMap.get(item.restaurant_id) || 0;
      const prepTime = item.preparation_time_minutes || 0;
      if (deliveryTime + prepTime > filters.max_total_time) {
        continue;
      }
    }

    if (filters.promo_only === true && !item.promo) {
      continue;
    }

    filteredMenus.push(item);
    activeRestaurantIds.add(item.restaurant_id);
  }

  // --- C. Final restaurant pass ---
  const filteredRestaurants = restaurants.filter((r) => activeRestaurantIds.has(r.id));

  // --- D. Fallback ---
  // Only skip filtering if zero items matched — the AI needs some data to work with.
  // If we have 1-4 items, that is a valid, intentionally narrow filter. Apply it.
  if (filteredMenus.length === 0) {
    return { restaurants, menus, filteringSkipped: true };
  }

  return { restaurants: filteredRestaurants, menus: filteredMenus, filteringSkipped: false };
}
