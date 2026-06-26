import React from 'react';
import { Star, Clock } from 'lucide-react';
import PersonTag from './PersonTag';
import ItemRow from './ItemRow';
import { formatIDR } from '../../lib/format';

export default function SlotCard({
  slot,
  restaurants,
  menus,
  onItemQuantityChange,
  onItemRemove,
  onVariantChange,
  onSelectOption,
  onAddOrderItem,
  onAddItem,
}) {
  const resolvedOptions = slot.resolvedOptions || [];
  const selectedOptionId = slot.selected_option_id;

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
              />
            ))}
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
        </div>
      )}
    </div>
  );
}
