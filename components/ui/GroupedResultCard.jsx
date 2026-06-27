import React, { useState } from 'react';
import { Plus, ShoppingCart, ChevronDown, ChevronUp, User, Store } from 'lucide-react';
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

function AddToOrderButton({ onClick, label, small }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 font-medium text-[#E8521A] hover:text-[#D4491A] transition-colors ${
        small ? 'text-[12px]' : 'text-[13px]'
      }`}
    >
      <Plus size={small ? 14 : 16} /> {label}
    </button>
  );
}

export default function GroupedResultCard({
  groupType,
  groupName,
  groupKey,
  subGroups,
  onAddAllToOrder,
  onAddItemToOrder,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const GroupIcon = groupType === 'person' ? User : Store;

  const handleAddAll = () => {
    // Flatten all items from all subGroups and add
    for (const sub of subGroups) {
      for (const item of sub.items || []) {
        onAddItemToOrder?.(sub.slot, item);
      }
    }
    if (onAddAllToOrder) { onAddAllToOrder(); }
  };

  return (
    <div className="bg-white border border-[#EFEFED] rounded-xl overflow-hidden">
      {/* Group Header */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer bg-[#F7F7F5] hover:bg-[#EFEFED] transition-colors"
        onClick={() => setIsExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-[#EFEFED] flex items-center justify-center">
            <GroupIcon size={18} className="text-[#6B6B67]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#111111]">{groupName}</h3>
            <p className="text-[13px] text-[#6B6B67]">{subGroups.length} sub-group{subGroups.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleAddAll(); }}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#E8521A] hover:text-[#D4491A] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FFF0EB]"
          >
            <ShoppingCart size={14} />
            Add all to order
          </button>
          {isExpanded ? <ChevronUp size={18} className="text-[#6B6B67]" /> : <ChevronDown size={18} className="text-[#6B6B67]" />}
        </div>
      </div>

      {/* Sub-groups */}
      {isExpanded && (
        <div className="divide-y divide-[#EFEFED]">
          {subGroups.map((sub) => (
            <SubGroupSection
              key={sub.key}
              sub={sub}
              onAddItemToOrder={onAddItemToOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubGroupSection({ sub, onAddItemToOrder }) {
  const [expanded, setExpanded] = useState(true);
  const items = sub.items || [];

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-[14px] font-medium text-[#111111]"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {sub.name}
        </button>
        <AddToOrderButton
          onClick={() => {
            for (const item of items) {
              onAddItemToOrder?.(sub.slot, item);
            }
          }}
          label="Add option"
          small
        />
      </div>

      {expanded && (
        <div className="space-y-2 mt-2 pl-1">
          {items.map((item) => (
            <div
              key={item.item_id || item.id}
              className="flex items-start justify-between py-2 border-b border-[#F7F7F5] last:border-b-0"
            >
              <ItemImage itemId={item.item_id || item.id} className="w-16 aspect-square rounded-md object-cover shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 ml-3">
                <span className="text-[14px] text-[#111111]">{item.name}</span>
                {item.variant && <span className="text-[12px] text-[#6B6B67] ml-2">({item.variant})</span>}
                <p className="text-[13px] text-[#6B6B67]">
                  {formatIDR(item.price || 0)} x {item.quantity || 1}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[14px] font-medium text-[#111111] tabular-nums">
                  {formatIDR((item.price || 0) * (item.quantity || 1))}
                </span>
                <button
                  onClick={() => onAddItemToOrder?.(sub.slot, item)}
                  className="w-8 h-8 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#2563EB] hover:border-[#2563EB] transition-colors"
                  aria-label="Add to order"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
