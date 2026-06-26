import React, { useState, useMemo } from 'react';
import { formatIDR } from '../../lib/format';

export default function ItemBrowser({
  restaurantId,
  restaurantName,
  menus,
  currentItems = [],
  onAddItem,
  onUpdateQuantity,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [selectedVariant, setSelectedVariant] = useState({}); // { itemId: variantName }

  const items = useMemo(() => {
    return menus.filter((m) => m.restaurant_id === restaurantId);
  }, [menus, restaurantId]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const cats = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!cats[cat]) cats[cat] = { available: [], unavailable: [] };
      if (item.available === false) {
        cats[cat].unavailable.push(item);
      } else {
        cats[cat].available.push(item);
      }
    });
    return cats;
  }, [filteredItems]);

  const currentQtyMap = useMemo(() => {
    const map = {};
    currentItems.forEach((item) => {
      map[item.id] = item.quantity || 0;
    });
    return map;
  }, [currentItems]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#EFEFED]">
        <h3 className="text-[15px] font-semibold text-[#111111]">{restaurantName}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#6B6B67] hover:text-[#111111]"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <input
          type="text"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-[#EFEFED] rounded-lg text-[14px] focus:outline-none focus:border-[#111111]"
        />
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(grouped).length === 0 ? (
          <p className="text-[14px] text-[#9A9A96] text-center py-8">No items found</p>
        ) : (
          Object.entries(grouped).map(([cat, items]) => {
            const allInCat = [...items.available, ...items.unavailable];
            if (allInCat.length === 0) return null;
            return (
              <div key={cat}>
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-[#9A9A96] mb-2 sticky top-0 bg-white py-1">
                  {cat}
                </h4>
                <div className="space-y-3">
                  {items.available.map((item) => {
                    const qty = currentQtyMap[item.id] || 0;
                    const variant = selectedVariant[item.id];
                    const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
                    const price = hasVariants && variant
                      ? item.price + (item.variants.find((v) => v.name === variant)?.price_delta || 0)
                      : item.price;
                    return (
                      <div key={item.id} className="flex items-start justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-[#111111]">{item.name}</p>
                          {item.description && (
                            <p className="text-[13px] text-[#6B6B67] line-clamp-2">{item.description}</p>
                          )}
                          {hasVariants && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.variants.map((v) => (
                                <button
                                  key={v.name}
                                  onClick={() => setSelectedVariant((prev) => ({ ...prev, [item.id]: v.name === prev[item.id] ? null : v.name }))}
                                  className={`text-[12px] px-2 py-0.5 rounded border ${
                                    selectedVariant[item.id] === v.name
                                      ? 'bg-[#111111] text-white border-[#111111]'
                                      : 'bg-white text-[#6B6B67] border-[#EFEFED] hover:border-[#D8D8D5]'
                                  }`}
                                >
                                  {v.name} {v.price_delta > 0 ? `+${formatIDR(v.price_delta)}` : v.price_delta < 0 ? formatIDR(v.price_delta) : ''}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-[14px] font-semibold text-[#E8521A] tabular-nums">
                            {formatIDR(price)}
                          </span>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onUpdateQuantity?.(item.id, qty - 1)}
                                className="w-7 h-7 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#111111]"
                              >−</button>
                              <span className="text-[14px] font-medium w-5 text-center">{qty}</span>
                              <button
                                onClick={() => onUpdateQuantity?.(item.id, qty + 1)}
                                className="w-7 h-7 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#111111]"
                              >+</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onAddItem?.(item, selectedVariant[item.id] || null)}
                              className="px-3 py-1 bg-[#E8521A] text-white text-[13px] font-medium rounded-lg hover:bg-[#D4491A]"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {items.unavailable.map((item) => (
                    <div key={item.id} className="flex items-start justify-between py-2 opacity-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#111111] line-through">{item.name}</p>
                      </div>
                      <span className="text-[12px] text-[#9A9A96]">Unavailable</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
