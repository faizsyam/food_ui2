import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import schemaReducer from './lib/schemaReducer';
import { resolveSlot } from './lib/resolveSchema';
import { LayoutShell } from './components/ui';

function enrichSchema(schema, restaurants, menus) {
  if (!schema || typeof schema !== 'object') return null;
  const enrichedSlots = [];
  for (const slot of schema.slots || []) {
    const enriched = resolveSlot(slot, restaurants, menus);
    enrichedSlots.push(enriched || slot);
  }
  return { ...schema, slots: enrichedSlots };
}

function reducerWithSetState(state, action) {
  if (action.type === '_SET_STATE') { return action.schema; }
  return schemaReducer(state, action);
}

function recomputeOrderSummary(schema, restaurants) {
  const items = (schema.order?.items) || [];
  if (items.length === 0) {
    return { restaurant_breakdown: [], grand_total: 0, checkout_ready: false, blocking_issues: ['ORDER_EMPTY'] };
  }

  const byRestaurant = {};
  for (const item of items) {
    const rid = item.restaurant_id || 'unknown';
    if (!byRestaurant[rid]) {
      byRestaurant[rid] = { restaurant_id: rid, restaurant_name: item.restaurant_name || rid, slot_ids: new Set(), items_subtotal: 0, delivery_fee: 0, min_order: 0, meets_min_order: true };
    }
    byRestaurant[rid].slot_ids.add(item.slot_id);
    byRestaurant[rid].items_subtotal += item.line_total || 0;
  }

  for (const rid of Object.keys(byRestaurant)) {
    const restaurant = (restaurants || []).find((r) => r.id === rid);
    if (restaurant) {
      byRestaurant[rid].delivery_fee = restaurant.delivery_fee || 0;
      byRestaurant[rid].min_order = restaurant.min_order || 0;
      byRestaurant[rid].meets_min_order = byRestaurant[rid].items_subtotal >= (restaurant.min_order || 0);
    }
  }

  let grandTotal = 0;
  const blockingIssues = [];
  for (const entry of Object.values(byRestaurant)) {
    grandTotal += entry.items_subtotal + entry.delivery_fee;
    if (!entry.meets_min_order) { blockingIssues.push(`MIN_ORDER_NOT_MET: ${entry.restaurant_id}`); }
  }

  return {
    restaurant_breakdown: Object.values(byRestaurant).map((r) => ({ ...r, slot_ids: Array.from(r.slot_ids) })),
    grand_total: grandTotal,
    checkout_ready: blockingIssues.length === 0 && items.length > 0,
    blocking_issues: blockingIssues,
  };
}

export default function OrderRenderer({ schema: propSchema, restaurants, menus, onCheckout }) {
  const initialEnriched = useMemo(() => {
    const enriched = enrichSchema(propSchema, restaurants, menus);
    if (enriched && !enriched.order) { enriched.order = { items: [] }; }
    return enriched;
  }, []);

  const [schema, dispatch] = useReducer(reducerWithSetState, initialEnriched);
  const prevPropRef = useRef(propSchema);

  useEffect(() => {
    if (propSchema !== prevPropRef.current) {
      prevPropRef.current = propSchema;
      const enriched = enrichSchema(propSchema, restaurants, menus);
      if (enriched && !enriched.order) { enriched.order = { items: [] }; }
      dispatch({ type: '_SET_STATE', schema: enriched });
    }
  }, [propSchema, restaurants, menus]);

  const liveSchema = useMemo(() => {
    if (!schema) return null;
    return { ...schema, order_summary: recomputeOrderSummary(schema, restaurants) };
  }, [schema, restaurants]);

  const handleItemQuantityChange = useCallback((slotId, itemId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', slot_id: slotId, item_id: itemId, quantity });
  }, []);

  const handleItemRemove = useCallback((slotId, itemId) => {
    dispatch({ type: 'REMOVE_ITEM', slot_id: slotId, item_id: itemId });
  }, []);

  const handleVariantChange = useCallback((slotId, itemId, variant) => {
    dispatch({ type: 'UPDATE_VARIANT', slot_id: slotId, item_id: itemId, variant });
  }, []);

  const handleWarningDismiss = useCallback((warningIndex) => {
    dispatch({ type: 'DISMISS_WARNING', warning_index: warningIndex });
  }, []);

  const handleSelectOption = useCallback((slotId, optionId) => {
    dispatch({ type: 'SELECT_OPTION', slot_id: slotId, option_id: optionId });
  }, []);

  const handleAddItem = useCallback((slotId, item) => {
    dispatch({ type: 'ADD_ITEM', slot_id: slotId, item: { ...item, item_id: item.id, quantity: 1 } });
  }, []);

  const handleAddOrderItem = useCallback((slot, item) => {
    dispatch({ type: 'ADD_ORDER_ITEM', slot, item });
  }, []);

  const handleRemoveOrderItem = useCallback((orderItemId) => {
    dispatch({ type: 'REMOVE_ORDER_ITEM', order_item_id: orderItemId });
  }, []);

  const handleUpdateOrderItemQty = useCallback((orderItemId, quantity) => {
    dispatch({ type: 'UPDATE_ORDER_ITEM_QTY', order_item_id: orderItemId, quantity });
  }, []);

  const handleSchemaChange = useCallback((updatedSchema) => {
    dispatch({ type: '_SET_STATE', schema: updatedSchema });
  }, []);

  const handleCheckout = useCallback(() => {
    onCheckout?.(liveSchema);
  }, [onCheckout, liveSchema]);

  if (!propSchema || !liveSchema) {
    return (<div className="p-12 text-center text-[#9A9A96]">Submit a request to generate your order.</div>);
  }

  return (
    <div className="order-renderer">
      <LayoutShell
        schema={liveSchema}
        restaurants={restaurants}
        menus={menus}
        onSchemaChange={handleSchemaChange}
        onItemQuantityChange={handleItemQuantityChange}
        onItemRemove={handleItemRemove}
        onVariantChange={handleVariantChange}
        onWarningDismiss={handleWarningDismiss}
        onSelectOption={handleSelectOption}
        onAddItem={handleAddItem}
        onAddOrderItem={handleAddOrderItem}
        onRemoveOrderItem={handleRemoveOrderItem}
        onUpdateOrderItemQty={handleUpdateOrderItemQty}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
