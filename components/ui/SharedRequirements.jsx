import React from 'react';

/**
 * SlotDot
 *
 * Small color-coded dot with a tooltip-like label showing the slot identifier.
 */
function SlotDot({ slotId, index }) {
  const hue = ((index * 137) % 360); // golden angle for nice color spread
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
      title={slotId}
    >
      {index + 1}
    </span>
  );
}

/**
 * ResolvedItemBadge
 *
 * Renders one resolved_item entry: slot_id, item_id, restaurant_id.
 */
function ResolvedItemBadge({ item, slots, index }) {
  const slot = slots.find((s) => s.slot_id === item.slot_id);
  const slotName = slot?.person?.name || item.slot_id;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-700">
      <SlotDot slotId={item.slot_id} index={index} />
      <span className="font-medium">{slotName}</span>
      {item.item_id && (
        <span className="text-gray-400">→ {item.item_id}</span>
      )}
      {item.restaurant_id && (
        <span className="text-[10px] text-gray-300 font-mono">({item.restaurant_id})</span>
      )}
    </div>
  );
}

/**
 * SharedRequirements
 *
 * Renders the `shared_requirements` section from the order schema.
 * Each requirement shows: which slots are affected, what the label is,
 * how it was resolved, and any substitution notes.
 *
 * Props:
 *   requirements {array}  Array from schema.shared_requirements
 *   slots        {array}  Array from schema.slots (to look up person names)
 */
export default function SharedRequirements({ requirements, slots = [] }) {
  if (!Array.isArray(requirements) || requirements.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="Shared Requirements">
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
        Shared Requirements
      </h2>

      <div className="space-y-3">
        {requirements.map((req) => (
          <div
            key={req.requirement_id || req.label}
            className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
          >
            {/* Label + affected slot dots */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-bold text-emerald-900">
                {req.label || 'Shared Requirement'}
              </span>
              {Array.isArray(req.slot_ids) && req.slot_ids.length > 0 && (
                <div className="flex items-center gap-1">
                  {req.slot_ids.map((sid, i) => (
                    <SlotDot key={sid} slotId={sid} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Resolution note */}
            {req.resolution_note && (
              <p className="text-xs text-emerald-800/80 mb-2 leading-snug">
                {req.resolution_note}
              </p>
            )}

            {/* Resolved items: what each slot got */}
            {Array.isArray(req.resolved_items) && req.resolved_items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Assigned to
                </p>
                {req.resolved_items.map((item, i) => (
                  <ResolvedItemBadge
                    key={`${item.slot_id}-${i}`}
                    item={item}
                    slots={slots}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
