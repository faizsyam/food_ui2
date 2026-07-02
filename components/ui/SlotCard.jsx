import React, { useState, useEffect, useRef } from 'react';
import { Star, Sparkles, Clock, Plus, ShoppingCart, ChevronDown, ChevronUp, MapPin, AlertCircle } from 'lucide-react';
import PersonTag from './PersonTag';
import ItemRow from './ItemRow';
import InlineWarning from './InlineWarning';
import { formatIDR } from '../../lib/format';

function RestaurantImage({ id }) {
  const [hasError, setHasError] = useState(false);
  return (
    <div className="w-full h-44 rounded-t-2xl bg-[#F0E8E2] overflow-hidden">
      {!hasError && id && (
        <img
          src={`/${id}.webp`}
          alt=""
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
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
  const hasPromo = !!item.promo;
  if (isUnavailable) return null;
  return (
    <div className="flex items-center gap-3 py-2 hover:bg-[#FFF9F5] rounded-lg transition-colors cursor-pointer" onClick={onAdd}>
      <ItemImage itemId={item.id} className="w-16 aspect-square rounded-md shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-[#1A120D]">{item.name}</span>
          {hasPromo && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-[1px] rounded-full uppercase tracking-wide border border-[#86EFAC]">
              <Sparkles size={9} className="fill-[#22C55E]" />
              {item.promo.label || `${item.promo.discount_percent}% Off`}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-[12px] text-[#9C8E84] line-clamp-1">{item.description}</p>
        )}
      </div>
      {hasPromo ? (
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[11px] text-[#9C8E84] line-through tabular-nums">{formatIDR(item.price || 0)}</span>
          <span className="text-[14px] font-semibold text-[#22A65E] tabular-nums">{formatIDR(item.promo.discounted_price || 0)}</span>
        </div>
      ) : (
        <span className="text-[14px] font-semibold text-[#1A120D] tabular-nums shrink-0">{formatIDR(item.price || 0)}</span>
      )}
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
  onAddItem,
  diff,
  warnings = [],
}) {
  const resolvedOptions = slot.resolvedOptions || [];
  const selectedOptionId = slot.selected_option_id;
  const [showBrowseMore, setShowBrowseMore] = useState(false);

  // Diff visual treatment state
  const [isFadedIn, setIsFadedIn] = useState(false);
  const [showNewPill, setShowNewPill] = useState(false);
  const [showModifiedBorder, setShowModifiedBorder] = useState(false);
  const prevDiffRef = useRef(null);

  const isAdded =
    diff?.added?.some((a) => a.slot_id === slot.slot_id) || false;

  useEffect(() => {
    if (!diff) return;
    if (prevDiffRef.current === diff) return;
    prevDiffRef.current = diff;

    const wasAdded = diff.added?.some(
      (a) => a.slot_id === slot.slot_id
    );
    const wasModified = diff.modified?.some(
      (m) => m.slot_id === slot.slot_id
    );

    let newPillTimer = null;
    let borderTimer = null;

    if (wasAdded) {
      requestAnimationFrame(() => setIsFadedIn(true));
      setShowNewPill(true);
      newPillTimer = setTimeout(() => setShowNewPill(false), 6000);
    }

    if (wasModified) {
      setShowModifiedBorder(true);
      borderTimer = setTimeout(() => setShowModifiedBorder(false), 4000);
    }

    return () => {
      if (newPillTimer) clearTimeout(newPillTimer);
      if (borderTimer) clearTimeout(borderTimer);
    };
  }, [diff, slot.slot_id]);

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

  const liveSubtotal = (selectedOption?.resolvedItems || []).reduce(
    (sum, item) => sum + (item.lineTotal || (item.price || 0) * (item.quantity || 1)),
    0
  );
  const optionTotal = liveSubtotal + (selectedOption?.delivery_fee || 0);

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

  /** Render a friendly delivery duration range based on prep + delivery times */
  function formatArrivalTime(timing) {
    if (!timing || typeof timing.minMinutes !== 'number') return null;
    const { minMinutes, maxMinutes } = timing;
    if (minMinutes === maxMinutes) return `${minMinutes} mins`;
    return `${minMinutes}–${maxMinutes} mins`;
  }

  /** Format an ISO-8601 target_time as a human-readable wall-clock time */
  function formatTargetTime(iso) {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return null;
    }
  }

  // Inline style only for added slots (fade-in animation)
  const cardStyle = isAdded
    ? {
        opacity: isFadedIn ? 1 : 0,
        transform: isFadedIn ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out, box-shadow 300ms ease',
      }
    : undefined;

  return (
    <div
      className={`bg-white rounded-2xl border border-[#F0E8E2]/80 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
        showModifiedBorder ? 'border-l-2 border-l-[#2563EB]' : ''
      }`}
      style={cardStyle}
    >
      {/* New pill */}
      {showNewPill && (
        <div className="flex justify-end px-6 pt-4 pb-0">
          <span className="text-[11px] font-semibold text-white bg-[#16A34A] px-2.5 py-0.5 rounded-full transition-opacity duration-500">
            New
          </span>
        </div>
      )}

      {/* Preference mismatch notice */}
      {selectedOption?.meets_preferences === false && (
        <div className="px-6 pt-4">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 leading-snug">
              {selectedOption.highlight_reason || "This option doesn't fully meet the stated preferences for this person."}
            </p>
          </div>
        </div>
      )}

      {/* Inline slot-specific warnings from the AI */}
      {warnings.length > 0 && (
        <div className="px-6 pt-4 space-y-2">
          {warnings.map((warning, i) => (
            <InlineWarning key={`${warning.code}_${i}`} warning={warning} />
          ))}
        </div>
      )}

      {/* Option selector tabs */}
      {resolvedOptions.length > 1 && (
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold text-[#9C8E84] uppercase tracking-widest">
              Meal Options for {slot.person?.name || 'Guest'}
            </p>
            {resolvedOptions.some((o) => o.meets_preferences === false) && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-[1px]">
                {resolvedOptions.filter((o) => o.meets_preferences === false).length} partial
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {resolvedOptions.map((opt) => {
              const isSelected = opt.option_id === selectedOptionId;
              const isCloseMatch = opt.meets_preferences === false;
              const isMinOrderFail = opt.meets_min_order === false;
              const isDeadlineFail = opt.deadline_ok === false;

              let tagText = '';
              let tagColor = '';
              if (isMinOrderFail) { tagText = 'Below min order'; tagColor = 'text-[#E11D48] bg-[#FEF2F2] border-[#FECACA]'; }
              else if (isDeadlineFail) { tagText = "Won't meet deadline"; tagColor = 'text-[#D97706] bg-amber-50 border-amber-200'; }
              else if (isCloseMatch) { tagText = 'Partial match'; tagColor = 'text-amber-700 bg-amber-50 border-amber-200'; }

              return (
                <button
                  key={opt.option_id}
                  onClick={() => onSelectOption?.(slot.slot_id, opt.option_id)}
                  className={`text-left px-3.5 py-2 rounded-xl border transition-all duration-200 min-w-[140px] ${
                    isSelected
                      ? isCloseMatch
                        ? 'bg-amber-900 text-white border-amber-900'
                        : 'bg-[#1A120D] text-white border-[#1A120D]'
                      : isCloseMatch
                        ? 'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400'
                        : 'bg-white text-[#5C4F48] border-[#E0D4CA] hover:border-[#9C8E84]'
                  }`}
                  title={`${opt.label || opt.option_id}${opt.estimated_arrival ? '\nArrives ' + new Date(opt.estimated_arrival).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) : ''}${opt.subtotal ? '\n' + formatIDR(opt.subtotal + (opt.delivery_fee || 0)) : ''} total`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold">{opt.label || opt.option_id}</span>
                    {isSelected && <Sparkles size={13} className="opacity-80" />}
                  </div>
                  {/* Subtotal + timing line */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[11px] font-medium tabular-nums ${isSelected ? 'opacity-80' : 'text-[#9C8E84]'}`}>
                      {formatIDR((opt.subtotal || 0) + (opt.delivery_fee || 0))}
                    </span>
                    {opt.estimated_arrival && (
                      <span className={`text-[10px] ${isSelected ? 'opacity-70' : 'text-[#B5A99F]'}`}>
                        · {(() => {
                          try {
                            const d = new Date(opt.estimated_arrival);
                            return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false}) + ' est.';
                          } catch { return 'arriving'; }
                        })()}
                      </span>
                    )}
                  </div>
                  {/* Visible warning tag */}
                  {tagText && (
                    <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-[1px] rounded-full border ${tagColor}`}>
                      {tagText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected option detail */}
      {selectedOption && (
        <div className="px-6 py-5">
          {/* Recommendation note */}
          {selectedOption.highlight_reason && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] px-3.5 py-2.5">
              <Sparkles size={14} className="text-[#22C55E] shrink-0 mt-0.5" fill="#22C55E" />
              <span className="text-[12px] font-medium text-[#1A8246] leading-snug">
                {selectedOption.highlight_reason}
              </span>
            </div>
          )}

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
                {/* Option-level flags: always surface meets_min_order and deadline_ok */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedOption.meets_min_order === false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E11D48] bg-[#FEF2F2] border border-[#FECACA] px-2 py-[1px] rounded-full">
                      <AlertCircle size={10} />
                      Below min order ({selectedOption.restaurant?.min_order ? formatIDR(selectedOption.restaurant.min_order) : ''})
                    </span>
                  )}
                  {selectedOption.meets_min_order !== false && selectedOption.meets_min_order !== undefined && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#DCFCE7] px-2 py-[1px] rounded-full">
                      Min order met
                    </span>
                  )}
                  {selectedOption.deadline_ok === false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-[1px] rounded-full">
                      <AlertCircle size={10} />
                      Won't meet deadline
                    </span>
                  )}
                  {selectedOption.meets_preferences === false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-[1px] rounded-full">
                      <AlertCircle size={10} />
                      Partial match
                    </span>
                  )}
                </div>
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

            {/* Delivery info row */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F0E8E2]">
              {/* Estimated arrival (from option timing) */}
              {(selectedOption.timing || slot.timing) && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5C4F48]">
                  <Clock size={14} className="text-[#9C8E84]" />
                  <span>{formatArrivalTime(selectedOption.timing || slot.timing)}</span>
                </div>
              )}
              {/* Target delivery time (user-specified) */}
              {slot.delivery?.target_time && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5C4F48]">
                  <Clock size={14} className="text-[#E8521A]" />
                  <span className="font-medium">Target: {formatTargetTime(slot.delivery.target_time)}</span>
                </div>
              )}
              {/* Delivery address */}
              {slot.delivery?.address && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5C4F48]">
                  <MapPin size={14} className="text-[#E8521A]" />
                  <span className="truncate max-w-[200px]" title={slot.delivery.address}>
                    {slot.delivery.address}
                  </span>
                </div>
              )}
              {/* AI estimated arrival (ISO format from slot.delivery) */}
              {slot.delivery?.estimated_arrival && !slot.delivery?.target_time && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#5C4F48]">
                  <Clock size={14} className="text-[#9C8E84]" />
                  <span>Arrives {formatTargetTime(slot.delivery.estimated_arrival)}</span>
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

          {/* Price summary */}
          <div className="mt-5 pt-4 border-t border-[#F0E8E2]">
            <div className="flex justify-between text-[14px] mb-2">
              <span className="text-[#9C8E84]">Item subtotal</span>
              <span className="font-medium tabular-nums text-[#1A120D]">
                {formatIDR(liveSubtotal)}
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
