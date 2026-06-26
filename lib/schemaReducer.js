/**
 * schemaReducer.js
 *
 * Pure reducer for handling user interactions that modify the enriched schema and order state.
 */

// ---------------------------------------------------------------------------
// Subtotal recalculation
// ---------------------------------------------------------------------------

function recalcLineTotal(item) {
  const basePrice = item.price || 0;
  const variantDelta = item.activeVariant?.price_delta || 0;
  const quantity = item.quantity || 1;
  return (basePrice + variantDelta) * quantity;
}

function recalcOptionSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    return sum + recalcLineTotal(item);
  }, 0);
}

// ---------------------------------------------------------------------------
// Option item helpers
// ---------------------------------------------------------------------------

function findItemInItems(itemsArray, item_id) {
  if (!Array.isArray(itemsArray)) return null;
  for (let i = 0; i < itemsArray.length; i++) {
    if (itemsArray[i]?.item_id === item_id) return { item: itemsArray[i], index: i };
  }
  return null;
}

function updateResolvedItem(resolvedItem, newQuantity) {
  const updated = { ...resolvedItem, quantity: Math.max(1, newQuantity) };
  updated.lineTotal = recalcLineTotal(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Existing schema action handlers (UPDATE_QUANTITY, etc.)
// ---------------------------------------------------------------------------

function handleUpdateQuantity(schema, action) {
  const { slot_id, item_id, quantity } = action;

  return {
    ...schema,
    slots: (schema.slots || []).map((slot) => {
      if (slot.slot_id !== slot_id) return slot;
      const newSlot = { ...slot };

      // Update flat items
      let flatItems = slot.items ? [...slot.items] : [];
      const flatIdx = flatItems.findIndex((it) => it.item_id === item_id);
      if (flatIdx >= 0) {
        flatItems[flatIdx] = { ...flatItems[flatIdx], quantity: Math.max(1, quantity) };
      } else {
        flatItems = flatItems.filter((it) => it.item_id !== item_id);
      }
      newSlot.items = flatItems;

      // Update flat resolvedItems
      if (Array.isArray(slot.resolvedItems)) {
        newSlot.resolvedItems = slot.resolvedItems.map((item) => {
          if (item.item_id !== item_id) return item;
          return updateResolvedItem(item, quantity);
        });
      }

      // Update source-of-truth: options[].items
      if (Array.isArray(newSlot.options)) {
        newSlot.options = newSlot.options.map((opt) => {
          if (!opt.items) return opt;
          const newItems = opt.items.map((it) =>
            it.item_id === item_id ? { ...it, quantity: Math.max(1, quantity) } : it
          );
          return { ...opt, items: newItems };
        });
      }

      // Also update resolvedOptions for consistency
      if (Array.isArray(newSlot.resolvedOptions)) {
        newSlot.resolvedOptions = newSlot.resolvedOptions.map((opt) => {
          if (!opt.resolvedItems) return opt;
          const newResolvedItems = opt.resolvedItems.map((it) => {
            if (it.item_id !== item_id) return it;
            return updateResolvedItem(it, quantity);
          });
          return { ...opt, resolvedItems: newResolvedItems };
        });
      }

      // Recalculate subtotal from resolvedItems or resolvedOptions
      newSlot.subtotal = recalcSlotSubtotal(newSlot);

      return newSlot;
    }),
  };
}

function handleUpdateVariant(schema, action) {
  const { slot_id, item_id, variant } = action;

  return {
    ...schema,
    slots: (schema.slots || []).map((slot) => {
      if (slot.slot_id !== slot_id) return slot;
      const newSlot = { ...slot };

      const updateVariantFn = (item) => {
        if (item.item_id !== item_id) return item;
        const activeVariant =
          variant && Array.isArray(item.variants)
            ? item.variants.find((v) => v.name === variant) || null
            : null;
        const updated = { ...item, variant, activeVariant };
        updated.lineTotal = recalcLineTotal(updated);
        return updated;
      };

      if (Array.isArray(slot.resolvedItems)) {
        newSlot.resolvedItems = slot.resolvedItems.map(updateVariantFn);
      }

      if (Array.isArray(newSlot.options)) {
        newSlot.options = newSlot.options.map((opt) => ({
          ...opt,
          items: (opt.items || []).map((it) =>
            it.item_id === item_id ? { ...it, variant } : it
          ),
        }));
      }

      if (Array.isArray(newSlot.resolvedOptions)) {
        newSlot.resolvedOptions = newSlot.resolvedOptions.map((opt) => ({
          ...opt,
          resolvedItems: (opt.resolvedItems || []).map(updateVariantFn),
        }));
      }

      newSlot.subtotal = recalcSlotSubtotal(newSlot);
      return newSlot;
    }),
  };
}

function handleRemoveItem(schema, action) {
  const { slot_id, item_id } = action;

  return {
    ...schema,
    slots: (schema.slots || []).map((slot) => {
      if (slot.slot_id !== slot_id) return slot;
      const newSlot = { ...slot };

      let flatItems = slot.items ? [...slot.items] : [];
      flatItems = flatItems.filter((it) => it.item_id !== item_id);
      newSlot.items = flatItems;

      if (Array.isArray(slot.resolvedItems)) {
        newSlot.resolvedItems = slot.resolvedItems.filter(
          (item) => item.item_id !== item_id
        );
      }

      if (Array.isArray(newSlot.options)) {
        newSlot.options = newSlot.options.map((opt) => ({
          ...opt,
          items: (opt.items || []).filter((it) => it.item_id !== item_id),
        }));
      }

      if (Array.isArray(newSlot.resolvedOptions)) {
        newSlot.resolvedOptions = newSlot.resolvedOptions.map((opt) => ({
          ...opt,
          resolvedItems: (opt.resolvedItems || []).filter(
            (it) => it.item_id !== item_id
          ),
        }));
      }

      newSlot.subtotal = recalcSlotSubtotal(newSlot);
      return newSlot;
    }),
  };
}

function handleDismissWarning(schema, action) {
  const { warning_index } = action;
  if (!Array.isArray(schema.warnings)) return schema;
  const newWarnings = [...schema.warnings];
  newWarnings.splice(warning_index, 1);
  return { ...schema, warnings: newWarnings };
}

function handleAddItem(schema, action) {
  const { slot_id, item } = action;
  if (!item?.item_id) return schema;

  return {
    ...schema,
    slots: (schema.slots || []).map((slot) => {
      if (slot.slot_id !== slot_id) return slot;
      const newSlot = { ...slot };

      const newItem = { ...item, quantity: item.quantity || 1 };
      const newResolvedItem = { ...newItem };
      newResolvedItem.lineTotal = recalcLineTotal(newResolvedItem);

      // Add to flat items
      newSlot.items = [...(slot.items || [])];
      const flatIdx = newSlot.items.findIndex((it) => it.item_id === item.item_id);
      if (flatIdx >= 0) {
        newSlot.items[flatIdx] = {
          ...newSlot.items[flatIdx],
          quantity: newSlot.items[flatIdx].quantity + 1,
        };
      } else {
        newSlot.items.push(newItem);
      }

      // Add to flat resolvedItems
      if (Array.isArray(slot.resolvedItems)) {
        const resolvedIdx = slot.resolvedItems.findIndex(
          (it) => it.item_id === item.item_id
        );
        if (resolvedIdx >= 0) {
          const existing = slot.resolvedItems[resolvedIdx];
          const updated = { ...existing, quantity: existing.quantity + 1 };
          updated.lineTotal = recalcLineTotal(updated);
          newSlot.resolvedItems = slot.resolvedItems.map((it, i) =>
            i === resolvedIdx ? updated : it
          );
        } else {
          newSlot.resolvedItems = [...slot.resolvedItems, newResolvedItem];
        }
      }

      // Add to option items
      if (Array.isArray(newSlot.options)) {
        newSlot.options = newSlot.options.map((opt) => {
          if (opt.option_id !== slot.selected_option_id) return opt;
          const optItems = [...(opt.items || [])];
          const optIdx = optItems.findIndex((it) => it.item_id === item.item_id);
          if (optIdx >= 0) {
            optItems[optIdx] = {
              ...optItems[optIdx],
              quantity: optItems[optIdx].quantity + 1,
            };
          } else {
            optItems.push(newItem);
          }
          return { ...opt, items: optItems };
        });
      }

      if (Array.isArray(newSlot.resolvedOptions)) {
        newSlot.resolvedOptions = newSlot.resolvedOptions.map((opt) => {
          if (opt.option_id !== slot.selected_option_id) return opt;
          const rItems = [...(opt.resolvedItems || [])];
          const rIdx = rItems.findIndex((it) => it.item_id === item.item_id);
          if (rIdx >= 0) {
            const updated = { ...rItems[rIdx], quantity: rItems[rIdx].quantity + 1 };
            updated.lineTotal = recalcLineTotal(updated);
            rItems[rIdx] = updated;
          } else {
            rItems.push(newResolvedItem);
          }
          return { ...opt, resolvedItems: rItems };
        });
      }

      newSlot.subtotal = recalcSlotSubtotal(newSlot);
      return newSlot;
    }),
  };
}

function recalcSlotSubtotal(slot) {
  if (Array.isArray(slot.resolvedItems)) {
    return slot.resolvedItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  }
  if (Array.isArray(slot.items)) {
    return slot.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }
  return slot.subtotal || 0;
}

// ---------------------------------------------------------------------------
// NEW: Order state action handlers
// ---------------------------------------------------------------------------

// Generate a unique ID for order items
function generateId(prefix = 'ord') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function handleAddOrderItem(schema, action) {
  const { slot, item } = action;
  if (!item?.item_id) return schema;

  const order = schema.order || { items: [] };
  const items = order.items || [];

  // Check if same slot+item+variant already in order
  const existingIndex = items.findIndex(
    (oi) => oi.slot_id === slot.slot_id && oi.item_id === item.item_id && oi.variant === (item.variant || null)
  );

  let newItems;
  if (existingIndex >= 0) {
    // Increment quantity
    newItems = items.map((oi, i) =>
      i === existingIndex
        ? { ...oi, quantity: oi.quantity + 1, line_total: oi.unit_price * (oi.quantity + 1) }
        : oi
    );
  } else {
    const restaurant = item.restaurant || slot.resolvedSelectedOption?.restaurant || {};
    newItems = [
      ...items,
      {
        id: generateId(),
        slot_id: slot.slot_id,
        person_name: slot.person?.name || 'Unknown',
        restaurant_id: restaurant.id || item.restaurant_id || '',
        restaurant_name: restaurant.name || '',
        item_id: item.item_id || item.id,
        name: item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        variant: item.variant || null,
        unit_price: item.price || (item.lineTotal ? item.lineTotal / (item.quantity || 1) : 0),
        line_total: item.lineTotal || item.price || 0,
      },
    ];
  }

  return {
    ...schema,
    order: { ...order, items: newItems },
  };
}

function handleRemoveOrderItem(schema, action) {
  const { order_item_id } = action;
  const order = schema.order || { items: [] };
  return {
    ...schema,
    order: { ...order, items: (order.items || []).filter((i) => i.id !== order_item_id) },
  };
}

function handleUpdateOrderItemQty(schema, action) {
  const { order_item_id, quantity } = action;
  const order = schema.order || { items: [] };
  const newItems = (order.items || []).map((item) => {
    if (item.id !== order_item_id) return item;
    const newQty = Math.max(1, quantity);
    return { ...item, quantity: newQty, line_total: item.unit_price * newQty };
  });
  return { ...schema, order: { ...order, items: newItems } };
}

function handleSetGrouping(schema, action) {
  const { grouping_strategy } = action;
  return {
    ...schema,
    layout: { ...(schema.layout || {}), grouping_strategy },
  };
}

// ---------------------------------------------------------------------------
// Main reducer
// ---------------------------------------------------------------------------

function schemaReducer(schema, action) {
  if (!schema || typeof schema !== 'object') return schema;

  switch (action.type) {
    case 'UPDATE_QUANTITY':
      return handleUpdateQuantity(schema, action);

    case 'UPDATE_VARIANT':
      return handleUpdateVariant(schema, action);

    case 'REMOVE_ITEM':
      return handleRemoveItem(schema, action);

    case 'DISMISS_WARNING':
      return handleDismissWarning(schema, action);

    case 'SELECT_OPTION':
      return { ...schema, slots: (schema.slots || []).map((slot) =>
        slot.slot_id === action.slot_id
          ? { ...slot, selected_option_id: action.option_id }
          : slot
      ) };

    case 'ADD_ITEM':
      return handleAddItem(schema, action);

    // NEW: Order state actions
    case 'ADD_ORDER_ITEM':
      return handleAddOrderItem(schema, action);

    case 'REMOVE_ORDER_ITEM':
      return handleRemoveOrderItem(schema, action);

    case 'UPDATE_ORDER_ITEM_QTY':
      return handleUpdateOrderItemQty(schema, action);

    case 'SET_GROUPING':
      return handleSetGrouping(schema, action);

    default:
      return schema;
  }
}

export default schemaReducer;
