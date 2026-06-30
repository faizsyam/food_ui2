import { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Check } from 'lucide-react';

export default function SharedRequirementsBar({ requirements = [], warnings = [] }) {
  const [expanded, setExpanded] = useState({});

  if (!requirements || requirements.length === 0) return null;

  const hasSubstitutedWarning = warnings.some((w) => w?.code === 'SHARED_ITEM_SUBSTITUTED');

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3 mb-4">
      {requirements.map((req) => {
        const slotCount = Array.isArray(req.slot_ids) ? req.slot_ids.length : 0;
        const itemCount = Array.isArray(req.resolved_items) ? req.resolved_items.length : 0;
        const isExpanded = expanded[req.requirement_id || req.label];

        return (
          <div
            key={req.requirement_id || req.label}
            className="bg-[#FFF9F5] border border-[#F0E8E2] rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggle(req.requirement_id || req.label)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#FEF8F3] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Users size={16} strokeWidth={1.5} className="text-[#E8521A] shrink-0" />
                <span className="text-[13px] text-[#1A120D]">
                  <span className="font-semibold">{req.label}</span>
                  <span className="text-[#9C8E84] ml-1.5">
                    {slotCount} {slotCount === 1 ? 'person' : 'people'}
                  </span>
                  {itemCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
                      <Check size={10} />
                      {itemCount} item{itemCount > 1 ? 's' : ''} matched
                    </span>
                  )}
                  {hasSubstitutedWarning && (
                    <span className="ml-1.5 w-2 h-2 bg-[#D97706] rounded-full inline-block align-middle" title="Some items were substituted across restaurants" />
                  )}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp size={14} className="text-[#9C8E84] shrink-0" />
              ) : (
                <ChevronDown size={14} className="text-[#9C8E84] shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-3 border-t border-[#F0E8E2]">
                {/* Resolution note */}
                {req.resolution_note && (
                  <p className="text-[12px] text-[#5C4F48] italic mt-2.5">
                    {req.resolution_note}
                  </p>
                )}

                {/* Resolved items table */}
                {Array.isArray(req.resolved_items) && req.resolved_items.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[11px] font-semibold text-[#9C8E84] uppercase tracking-wide mb-1.5">
                      Matched Items
                    </p>
                    <div className="space-y-1">
                      {req.resolved_items.map((ri, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[12px] text-[#5C4F48]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                          <span>
                            <span className="font-medium">{ri.slot_id}</span>
                            {ri.item_id && (
                              <span className="text-[#9C8E84]"> → {ri.item_id}</span>
                            )}
                            {ri.restaurant_id && (
                              <span className="text-[#9C8E84]"> @ {ri.restaurant_id}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
