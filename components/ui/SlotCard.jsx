import React, { useState } from 'react';
import { Star, Clock, Plus, ShoppingCart, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import PersonTag from './PersonTag';
import ItemRow from './ItemRow';
import { formatIDR } from '../../lib/format';

function RestaurantImage({ id }) {
  const [hasError, setHasError] = useState(false);
  return (
    <div className="w-full h-40 rounded-t-2xl bg-[#F0E8E2] overflow-hidden">
      {!hasError && id && (
        <img
          src={`/${id}.webp`}
          alt=""
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

function ItemImage({ itemId, className = '' }) {
  const [hasError, setHasError] = useState(false);
  return (
    <div className={`overflow-hidden bg-[#F0E8E2] ${className}`}>
      {!hasError && itemId && (
        <img
          src={`/${itemId}.webp`}
          alt=""
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

function BrowseItemRow({ item, onAdd }) {
  const isUnavailable = item.available === false;
  if (isUnavailable) return null;
  return (
    <div className="flex items-center gap-3 py-2 hover:bg-[#FFF9F5] rounded-lg transition-colors cursor-pointer" onClick={onAdd}>
      <ItemImage itemId={item.id} className="w-16 aspect-square rounded-md shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-medium text-[#1A120D]">{item.name}</span>
        {item.description && (
          <p className="text-[12px] text-[#9C8E84] line-clamp-1">{item.description}</p>
        )}
      </div>
      <span className="text-[14px] font-semibold text-[#1A120D] tabular-nums">{formatIDR(item.price || 0)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="shrink-0 w-8 h-8 rounded-full bg-[#E8521A] text-white flex items-center justify-center hover:bg-[#D4491A] active:scale-90 transition-all duration-200"
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
      <div className="bg-white rounded-2xl border border-[#F0E8E2] p-6 shadow-card">
        <PersonTag name={slot.person?.name} preferences={slot.person?.preferences} />
        <p className="text-[14px] text-[#9C8E84] mt-3">No meal options available for this person.</p>
      </div>
    );
  }

  const selectedOption =
    resolvedOptions.find((o) => o.option_id === selectedOptionId) || resolvedOptions[0];

  const optionTotal =
    (selectedOption?.subtotal || 0) + (selectedOption?.delivery_fee || 0);

  const currentItemIds = new Set(
    (selectedOption?.resolvedItems || []).map((i) => i.item_id || i.id)
  );

  const restaurantId = selectedOption?.restaurant?.id;
  const moreItems = (menus || []).filter(
    (m) =>
      m.restaurant_id === restaurantId &&
      m.available !== false &&
      !currentItemIds.has(m.id)
  );

  const handleAddAll = () => {
    const items = selectedOption?.resolvedItems || [];
    for (const item of items) {
      onAddOrderItem?.(slot, { ...item, restaurant: selectedOption?.restaurant });
    }
  };

  const handleAddSingle = (item) => {
    onAddOrderItem?.(slot, { ...item, restaurant: selectedOption?.restaurant });
  };

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
    <div className="bg-white rounded-2xl border border-[#F0E8E2] overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300">
      {/* Option selector tabs */}
      {resolvedOptions.length > 1 && (
        <div className="px-6 pt-5">
          <div className="flex flex-wrap gap-2">
            {resolvedOptions.map((opt) => (
              <button
                key={opt.option_id}
                onClick={() => onSelectOption?.(slot.slot_id, opt.option_id)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-all duration-200 ${
                  opt.option_id === selectedOptionId
                    ? 'bg-[#1A120D] text-white border-[#1A120D]'
                    : 'bg-white text-[#5C4F48] border-[#E0D4CA] hover:border-[#9C8E84]'
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
        <div className="px-6 py-5">
          {/* Restaurant info card */}
          <div className="bg-[#FFF9F5] rounded-2xl overflow-hidden mb-4 border border-[#F0E8E2]">
            <RestaurantImage id={selectedOption.restaurant?.id} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-[#1A120D] leading-tight">
                  {selectedOption.restaurant?.name || 'Unknown Restaurant'}
                </h3>
                <p className="text-[13px] text-[#5C4F48] mt-0.5">
                  {selectedOption.restaurant?.cuisine}
                </p>
                {selectedOption.highlight_reason && (
                  <p className="text-[13px] text-[#22A65E] mt-2 font-medium bg-[#F0FDF4] inline-block px-2.5 py-1 rounded-full">
                    {selectedOption.highlight_reason}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {selectedOption.restaurant?.rating && (
                  <div className="flex items-center gap-1 justify-end text-[13px] bg-white px-2.5 py-1 rounded-full border border-[#F0E8E2]">
                    <Star size={13} className="text-[#D97706] fill-[#D97706]" />
                    <span className="font-bold">{selectedOption.restaurant.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery time row */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F0E8E2]">
              {selectedOption.estimated_arrival && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5C4F48]">
                  <Clock size={14} className="text-[#9C8E84]" />
                  <span>{selectedOption.estimated_arrival}</span>
                </div>
              )}
              {selectedOption.restaurant?.location?.address && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5C4F48]">
                  <MapPin size={14} className="text-[#9C8E84]" />
                  <span className="truncate max-w-[200px]">{selectedOption.restaurant.location.address}</span>
                </div>
              )}
            </div>
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
          <div className="mt-5">
            <button
              onClick={handleAddAll}
              className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-[#E8521A] hover:bg-[#D4491A] active:scale-[0.98] transition-all duration-200 rounded-xl px-4 py-3 shadow-soft"
            >
              <ShoppingCart size={16} />
              <span>Add all {(selectedOption.resolvedItems || []).length} items to order</span>
            </button>
          </div>

          {/* Price summary */}
          <div className="mt-5 pt-4 border-t border-[#F0E8E2]">
            <div className="flex justify-between text-[14px] mb-2">
              <span className="text-[#9C8E84]">Item subtotal</span>
              <span className="font-medium tabular-nums text-[#1A120D]">
                {formatIDR(selectedOption.subtotal || 0)}
              </span>
            </div>
            <div className="flex justify-between text-[14px] mb-2">
              <span className="text-[#9C8E84]">Delivery fee</span>
              <span className="font-medium tabular-nums text-[#1A120D]">
                {formatIDR(selectedOption.delivery_fee || 0)}
              </span>
            </div>
            <div className="flex justify-between text-[16px] font-bold mt-3 pt-3 border-t border-[#F0E8E2]">
              <span className="text-[#1A120D]">Total</span>
              <span className="tabular-nums">{formatIDR(optionTotal)}</span>
            </div>
          </div>

          {/* Browse more from this restaurant */}
          {moreItems.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#F0E8E2]">
              <button
                onClick={() => setShowBrowseMore((p) => !p)}
                className="w-full flex items-center justify-between text-[14px] font-medium text-[#5C4F48] hover:text-[#1A120D] transition-colors"
              >
                <span className="font-semibold">
                  Browse more from {selectedOption.restaurant?.name}
                </span>
                {showBrowseMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showBrowseMore && (
                <div className="mt-3 pt-3 border-t border-[#F0E8E2] max-h-60 overflow-y-auto">
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
