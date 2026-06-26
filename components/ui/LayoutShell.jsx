import React, { useCallback } from 'react';
import { User, Store } from 'lucide-react';
import SlotCard from './SlotCard';
import WarningBanner from './WarningBanner';
import SharedRequirementsBar from './SharedRequirementsBar';
import OrderSummaryPanel from './OrderSummaryPanel';

function CollapsibleGroup({ title, emojiKey, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-[#EFEFED] overflow-hidden mb-4">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#F7F7F5] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-white border border-[#EFEFED] flex items-center justify-center text-[#6B6B67]">
          <span className="text-xl leading-none">{emojiKey}</span>
        </div>
        <span className="text-[15px] font-semibold text-[#111111] flex-1">{title}</span>
        <span className="text-[13px] text-[#9A9A96]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function LayoutShell({
  schema,
  restaurants,
  menus,
  groupingStrategy = 'by_person',
  onItemQuantityChange,
  onItemRemove,
  onVariantChange,
  onWarningDismiss,
  onSelectOption,
  onAddOrderItem,
  onAddItem,
  onRemoveOrderItem,
  onUpdateOrderItemQty,
  onSetGrouping,
  onCheckout,
}) {
  if (!schema) return null;

  const { slots = [], shared_requirements = [], warnings = [], order_summary = {}, constraints = {} } = schema;

  const sortedWarnings = [...(warnings || [])].sort((a, b) => {
    if (a.severity === 'blocking' && b.severity !== 'blocking') return -1;
    if (a.severity !== 'blocking' && b.severity === 'blocking') return 1;
    return 0;
  });

  // Group slots
  function buildGroups() {
    if (groupingStrategy === 'by_restaurant') {
      const byRestaurant = {};
      for (const slot of slots) {
        const opt = (slot.resolvedOptions || slot.options || []).find((o) => o.option_id === slot.selected_option_id);
        const id = opt?.restaurant_id || opt?.restaurant?.id || 'other';
        if (!byRestaurant[id]) byRestaurant[id] = { title: opt?.restaurant?.name || id, emojiKey: '🍽️', slots: [] };
        byRestaurant[id].slots.push(slot);
      }
      return Object.values(byRestaurant);
    }
    const byPerson = [];
    for (const slot of slots) {
      byPerson.push({ title: slot.person?.name || 'Unknown', emojiKey: '👤', slots: [slot] });
    }
    return byPerson;
  }

  const groups = buildGroups();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#111111]">Your Meal Options</h1>
            <p className="text-[13px] text-[#6B6B67] mt-1">AI‑generated meal options for {slots.length} people</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#EFEFED] rounded-lg p-1">
            <button
              onClick={() => onSetGrouping?.('by_person')}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1 ${
                groupingStrategy === 'by_person'
                  ? 'bg-[#F7F7F5] text-[#111111] shadow-sm'
                  : 'text-[#9A9A96] hover:text-[#111111]'
              }`}
            >
              <User size={14} />
              Person
            </button>
            <button
              onClick={() => onSetGrouping?.('by_restaurant')}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1 ${
                groupingStrategy === 'by_restaurant'
                  ? 'bg-[#F7F7F5] text-[#111111] shadow-sm'
                  : 'text-[#9A9A96] hover:text-[#111111]'
              }`}
            >
              <Store size={14} />
              Restaurant
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Results */}
          <div className="flex-1 min-w-0">
            {shared_requirements.length > 0 && (
              <SharedRequirementsBar requirements={shared_requirements} warnings={warnings} />
            )}

            {sortedWarnings.length > 0 && (
              <div className="space-y-2 mb-4" role="region" aria-label="Warnings">
                {sortedWarnings.map((warning, i) => {
                  const originalIndex = warnings.findIndex((w) => w === warning);
                  return (
                    <WarningBanner
                      key={warning.code ?? 'warning-' + i}
                      warning={warning}
                      onDismiss={warning.severity === 'info' ? () => onWarningDismiss?.(originalIndex) : undefined}
                    />
                  );
                })}
              </div>
            )}

            {/* Grouped slots */}
            <div className="space-y-4">
              {groups.map((group, gi) => (
                <CollapsibleGroup
                  key={gi}
                  title={group.title}
                  emojiKey={group.emojiKey}
                >
                  {group.slots.map((slot) => (
                    <SlotCard
                      key={slot.slot_id}
                      slot={slot}
                      restaurants={restaurants}
                      menus={menus}
                      onItemQuantityChange={onItemQuantityChange}
                      onItemRemove={onItemRemove}
                      onVariantChange={onVariantChange}
                      onSelectOption={onSelectOption}
                      onAddOrderItem={onAddOrderItem}
                      onAddItem={onAddItem}
                    />
                  ))}
                </CollapsibleGroup>
              ))}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:w-[360px] shrink-0">
            <div className="lg:sticky lg:top-[120px]">
              <OrderSummaryPanel
                schema={schema}
                onCheckout={onCheckout}
                onRemoveOrderItem={onRemoveOrderItem}
                onUpdateOrderItemQty={onUpdateOrderItemQty}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
