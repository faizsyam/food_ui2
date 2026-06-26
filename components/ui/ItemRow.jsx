import React, { useState } from 'react';
import { Trash2, Plus, ShoppingCart } from 'lucide-react';
import { formatIDR } from '../../lib/format';

export default function ItemRow({ item, quantity, selectedVariant, notes, onQuantityChange, onVariantChange, onRemove, onAddToOrder }) {
  if (!item) return null;

  const [showConfirm, setShowConfirm] = useState(false);

  const isBestSeller = Array.isArray(item.tags) && item.tags.includes('best-seller');
  const isUnavailable = item.available === false;
  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;

  const activeVariant = hasVariants ? item.variants.find((v) => v.name === selectedVariant) ?? null : null;
  const priceDelta = activeVariant?.price_delta ?? 0;
  const unitPrice = (item.price ?? 0) + priceDelta;
  const safeQty = quantity ?? 1;
  const lineTotal = unitPrice * safeQty;

  const handleDecrement = () => {
    if (safeQty > 1) onQuantityChange?.(item.id, safeQty - 1);
  };

  const handleIncrement = () => onQuantityChange?.(item.id, safeQty + 1);

  if (isUnavailable) {
    return (
      <div className="flex items-start gap-3 py-2 opacity-40">
        <div className="flex-1 min-w-0">
          <span className="text-[14px] font-medium line-through text-[#111111]">{item.name}</span>
          <p className="text-[13px] text-[#6B6B67]"><span className="text-inherit italic">Unavailable</span></p>
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="py-2 flex items-center gap-3">
        <span className="text-[14px] text-[#6B6B67]">Remove item?</span>
        <button onClick={() => { onRemove?.(item.id); setShowConfirm(false); }} className="text-[14px] text-[#DC2626] font-medium">Yes</button>
        <button onClick={() => setShowConfirm(false)} className="text-[14px] text-[#6B6B67]">Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2 transition-opacity duration-150">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-[#111111]">{item.name}</span>
          {isBestSeller && <span className="text-[11px] text-[#D97706]">Popular</span>}
        </div>
        {item.description && <p className="text-[13px] text-[#6B6B67] line-clamp-1 mt-0.5">{item.description}</p>}

        {/* Variant selector */}
        {hasVariants && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.variants.map((v) => {
              const isActive = selectedVariant === v.name;
              return (
                <button
                  key={v.name}
                  onClick={() => onVariantChange?.(item.id, isActive ? null : v.name)}
                  className={`text-[12px] px-2 py-0.5 rounded border ${isActive ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#6B6B67] border-[#EFEFED] hover:border-[#D8D8D5]'}`}
                >
                  {v.name} {v.price_delta !== 0 ? `(${v.price_delta > 0 ? '+' : ''}${formatIDR(v.price_delta)})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {notes && <p className="text-[12px] italic text-[#9A9A96] mt-1">{notes}</p>}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0 min-w-[80px]">
        <span className="text-[14px] font-semibold text-[#111111] tabular-nums">{formatIDR(lineTotal)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={safeQty === 1 ? () => setShowConfirm(true) : handleDecrement}
            className="w-7 h-7 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#111111] hover:border-[#D8D8D5] transition-colors"
            aria-label={safeQty === 1 ? 'Remove item' : 'Decrease quantity'}
          >
            {safeQty === 1 ? <Trash2 size={14} className="text-[#DC2626]" /> : '−'}
          </button>
          <span className="text-[14px] font-medium w-6 text-center">{safeQty}</span>
          <button
            onClick={handleIncrement}
            className="w-7 h-7 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#111111] hover:border-[#D8D8D5] transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {/* Quick add to order */}
        {onAddToOrder && (
          <button
            onClick={() => onAddToOrder(item)}
            className="flex items-center gap-1 text-[12px] font-medium text-[#16A34A] hover:text-[#15803d] transition-colors px-2 py-0.5 rounded-full border border-[#DCFCE7] bg-[#F0FDF4] hover:bg-[#DCFCE7]"
            aria-label="Add to order"
          >
            <ShoppingCart size={12} />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
