import React, { useState } from 'react';
import { Star, Clock, Plus, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import PersonTag from './PersonTag';
import ItemRow from './ItemRow';
import { formatIDR } from '../../lib/format';

function BrowseItemRow({ item, onAdd }) {
  const isUnavailable = item.available === false;
  if (isUnavailable) return null;
  return (
    <div className="flex items-center gap-3 py-1.5 hover:bg-[#FAFAFA] rounded transition-colors">
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-medium text-[#111111]">{item.name}</span>
        {item.description && (
          <p className="text-[12px] text-[#9A9A96] line-clamp-1">{item.description}</p>
        )}
      </div>
      <span className="text-[14px] font-semibold text-[#111111] tabular-nums">{formatIDR(item.price || 0)}</span>
      <button
        onClick={onAdd}
        className="shrink-0 w-8 h-8 rounded-full bg-[#E8521A] text-white flex items-center justify-center hover:bg-[#d4491a] transition-colors"
        aria-label={`Add ${item.name} to order`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function SlotCard({
  slot,
  restaurants,
  menus,
  onItemQuantityChange,
  onItemRemove,
  onVariantChange,
  onSelectOption,
  onAddOrderItem,
}) {
  const resolvedOptions = slot.resolvedOptions || [];
  const selectedOptionId = slot.selected_option_id;
  const [showBrowseMore, setShowBrowseMore] = useState(false);

  if (!resolvedOptions || resolvedOptions.length === 0) {
    return (
      <div className="bg-white border border-[#EFEFED] rounded-xl p-5">
        <PersonTag name={slot.person?.name} preferences={slot.person?.preferences} />
        <p className="text-[14px] text-[#9A9A96] mt-3">No meal options available for this person.</p>
      </div>
    );
  }

  const selectedOption =
    resolvedOptions.find((o) => o.option_id === selectedOptionId) || resolvedOptions[0];

  const optionTotal =
    (selectedOption?.subtotal || 0) + (selectedOption?.delivery_fee || 0);

  // Items already in the current option
  const currentItemIds = new Set(
    (selectedOption?.resolvedItems || []).map((i) => i.item_id || i.id)
  );

  // Restaurant info
  const restaurantId = selectedOption?.restaurant?.id;
  const moreItems = (menus || []).filter(
    (m) =>
      m.restaurant_id === restaurantId &&
      m.available !== false &&
      !currentItemIds.has(m.id)
  );

  // Add all items in this option to the order
  const handleAddAll = () => {
    const items = selectedOption?.resolvedItems || [];
    for (const item of items) {
      onAddOrderItem?.(slot, { ...item, restaurant: selectedOption?.restaurant });
    }
  };

  // Add a single item to the order
  const handleAddSingle = (item) => {
    onAddOrderItem?.(slot, { ...item, restaurant: selectedOption?.restaurant });
  };

  // Add a browse-more item
  const handleBrowseAdd = (menuItem) => {
    onAddOrderItem?.(slot, {
      ...menuItem,
      item_id: menuItem.id,
      quantity: 1,
      variant: null,
      price: menuItem.price || 0,
      restaurant: selectedOption?.restaurant,
    });
  };

  return (
    <div className="bg-white border border-[#EFEFED] rounded-xl overflow-hidden">
      {/* Header with person info */}
      <div className="px-5 pt-4 pb-2">
        <PersonTag name={slot.person?.name} preferences={slot.person?.preferences} />
      </div>

      {/* Option selector tabs */}
      {resolvedOptions.length > 1 && (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {resolvedOptions.map((opt) => (
              <button
                key={opt.option_id}
                onClick={() => onSelectOption?.(slot.slot_id, opt.option_id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                  opt.option_id === selectedOptionId
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#6B6B67] border-[#EFEFED] hover:border-[#D8D8D5]'
                }`}
              >
                {opt.label || opt.option_id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected option detail */}
      {selectedOption && (
        <div className="px-5 pb-5">
          {/* Restaurant info card */}
          <div className="bg-[#F7F7F5] rounded-lg p-3 mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-[#111111] leading-tight">
                  {selectedOption.restaurant?.name || 'Unknown Restaurant'}
                </h3>
                <p className="text-[13px] text-[#6B6B67] mt-0.5">
                  {selectedOption.restaurant?.cuisine}
                </p>
                {selectedOption.highlight_reason && (
                  <p className="text-[13px] text-[#16A34A] mt-1.5">
                    {selectedOption.highlight_reason}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {selectedOption.restaurant?.rating && (
                  <div className="flex items-center gap-1 justify-end text-[13px]">
                    <Star size={14} className="text-[#D97706]" />
                    <span className="font-medium">{selectedOption.restaurant.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery time row */}
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#EFEFED]">
              {selectedOption.estimated_arrival && (
                <div className="flex items-center gap-1 text-[13px] text-[#6B6B67]">
                  <Clock size={14} />
                  <span>{selectedOption.estimated_arrival}</span>
                </div>
              )}
            </div>
          </div>

          {/* Item list */}
          <div className="space-y-1">
            {(selectedOption.resolvedItems || []).map((item) => (
              <ItemRow
                key={item.item_id || item.id}
                item={{ ...item, id: item.item_id || item.id }}
                quantity={item.quantity}
                selectedVariant={item.variant}
                notes={item.notes}
                onQuantityChange={(id, qty) =>
                  onItemQuantityChange?.(slot.slot_id, id, qty)
                }
                onVariantChange={(id, variant) =>
                  onVariantChange?.(slot.slot_id, id, variant)
                }
                onRemove={(id) => onItemRemove?.(slot.slot_id, id)}
                onAddToOrder={() => handleAddSingle(item)}
              />
            ))}
          </div>

          {/* Add all to order button */}
          <div className="mt-4">
            <button
              onClick={handleAddAll}
              className="w-full flex items-center justify-center gap-2 text-[14px] font-medium text-white bg-[#E8521A] hover:bg-[#d4491a] transition-colors rounded-lg px-4 py-2.5"
            >
              <ShoppingCart size={16} />
              <span>Add all {(selectedOption.resolvedItems || []).length} items to order</span>
            </button>
          </div>

          {/* Price summary */}
          <div className="mt-4 pt-3 border-t border-[#EFEFED]">
            <div className="flex justify-between text-[14px] mb-1">
              <span className="text-[#6B6B67]">Item subtotal</span>
              <span className="font-medium tabular-nums">
                {formatIDR(selectedOption.subtotal || 0)}
              </span>
            </div>
            <div className="flex justify-between text-[14px] mb-1">
              <span className="text-[#6B6B67]">Delivery fee</span>
              <span className="font-medium tabular-nums">
                {formatIDR(selectedOption.delivery_fee || 0)}
              </span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold mt-2 pt-2 border-t border-[#EFEFED]">
              <span className="text-[#111111]">Total</span>
              <span className="tabular-nums">{formatIDR(optionTotal)}</span>
            </div>
          </div>

          {/* Browse more from this restaurant */}
          {moreItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#EFEFED]">
              <button
                onClick={() => setShowBrowseMore((p) => !p)}
                className="w-full flex items-center justify-between text-[14px] text-[#6B6B67] hover:text-[#111111] transition-colors"
              >
                <span className="font-medium">
                  Browse more from {selectedOption.restaurant?.name}
                </span>
                {showBrowseMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showBrowseMore && (
                <div className="mt-2 pt-2 border-t border-[#EFEFED] max-h-60 overflow-y-auto">
                  {moreItems.map((item) => (
                    <BrowseItemRow
                      key={item.id}
                      item={item}
                      onAdd={() => handleBrowseAdd(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
