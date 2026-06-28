import React, { useState } from 'react';
import { Trash2, ShoppingCart, Star, Sparkles } from 'lucide-react';
import { formatIDR } from '../../lib/format';

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

export default function ItemRow({ item, quantity, selectedVariant, notes, onQuantityChange, onVariantChange, onRemove, onAddToOrder }) {
  if (!item) return null;

  const [showConfirm, setShowConfirm] = useState(false);

  const isBestSeller = Array.isArray(item.tags) && item.tags.includes('best-seller');
  const isUnavailable = item.available === false;
  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
  const hasPromo = !!item.promo;

  const activeVariant = hasVariants ? item.variants.find((v) => v.name === selectedVariant) ?? null : null;
  const priceDelta = activeVariant?.price_delta ?? 0;
  const safeQty = quantity ?? 1;

  const unitPrice = hasPromo
    ? ((item.promo.discounted_price ?? item.price) + priceDelta)
    : ((item.price ?? 0) + priceDelta);
  const lineTotal = unitPrice * safeQty;

  const handleDecrement = () => {
    if (safeQty > 1) onQuantityChange?.(item.id, safeQty - 1);
  };

  const handleIncrement = () => onQuantityChange?.(item.id, safeQty + 1);

  if (isUnavailable) {
    return (
      <div className="flex items-start gap-3 py-2 opacity-40">
        <ItemImage itemId={item.id} className="w-20 aspect-square rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[14px] font-medium line-through text-[#1A120D]">{item.name}</span>
          <p className="text-[13px] text-[#5C4F48]"><span className="italic">Unavailable</span></p>
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="py-2 flex items-center gap-3">
        <span className="text-[14px] text-[#5C4F48]">Remove item?</span>
        <button onClick={() => { onRemove?.(item.id); setShowConfirm(false); }} className="text-[14px] text-[#E11D48] font-semibold hover:underline">Yes</button>
        <button onClick={() => setShowConfirm(false)} className="text-[14px] text-[#9C8E84]">Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 py-2.5 transition-opacity duration-150">
      <ItemImage itemId={item.id} className="w-24 aspect-square rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-[#1A120D]">{item.name}</span>
          {isBestSeller && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-[#FFFBEB] px-2 py-[1px] rounded-full uppercase tracking-wide border border-[#FEF3C7]">
              <Star size={9} className="fill-[#F59E0B]" />
              Popular
            </span>
          )}
          {hasPromo && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-[1px] rounded-full uppercase tracking-wide border border-[#86EFAC]">
              <Sparkles size={9} className="fill-[#22C55E]" />
              {item.promo.label || `${item.promo.discount_percent}% Off`}
            </span>
          )}
        </div>
        {item.description && <p className="text-[13px] text-[#9C8E84] line-clamp-1 mt-0.5">{item.description}</p>}

        {/* Variant selector */}
        {hasVariants && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.variants.map((v) => {
              const isActive = selectedVariant === v.name;
              return (
                <button
                  key={v.name}
                  onClick={() => onVariantChange?.(item.id, isActive ? null : v.name)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1A120D] text-white border-[#1A120D]'
                      : 'bg-white text-[#5C4F48] border-[#E0D4CA] hover:border-[#C4B5AB]'
                  }`}
                >
                  {v.name} {v.price_delta !== 0 ? `(${v.price_delta > 0 ? '+' : ''}${formatIDR(v.price_delta)})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {notes && <p className="text-[12px] italic text-[#9C8E84] mt-1">{notes}</p>}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0 min-w-[80px]">
        {hasPromo ? (
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-[#9C8E84] line-through tabular-nums">{formatIDR((item.price ?? 0) + priceDelta)}</span>
            <span className="text-[14px] font-bold text-[#22A65E] tabular-nums">{formatIDR(lineTotal)}</span>
          </div>
        ) : (
          <span className="text-[14px] font-bold text-[#1A120D] tabular-nums">{formatIDR(lineTotal)}</span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={safeQty === 1 ? () => setShowConfirm(true) : handleDecrement}
            className="w-8 h-8 rounded-full border border-[#E0D4CA] flex items-center justify-center text-[#1A120D] hover:border-[#E8521A]/40 hover:bg-[#FFF0EA] transition-all duration-200 active:scale-90"
            aria-label={safeQty === 1 ? 'Remove item' : 'Decrease quantity'}
          >
            {safeQty === 1 ? <Trash2 size={14} className="text-[#E11D48]" /> : <span className="text-[15px] leading-none -mt-[1px]">−</span>}
          </button>
          <span className="text-[14px] font-semibold w-6 text-center">{safeQty}</span>
          <button
            onClick={handleIncrement}
            className="w-8 h-8 rounded-full border border-[#E0D4CA] flex items-center justify-center text-[#1A120D] hover:border-[#E8521A]/40 hover:bg-[#FFF0EA] transition-all duration-200 active:scale-90"
            aria-label="Increase quantity"
          >
            <span className="text-[15px] leading-none -mt-[1px]">+</span>
          </button>
        </div>
        {onAddToOrder && (
          <button
            onClick={() => onAddToOrder(item)}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#22A65E] hover:text-[#1A8246] transition-colors px-2.5 py-1 rounded-full border border-[#DCFCE7] bg-[#F0FDF4] hover:bg-[#DCFCE7]"
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
