import React, { useCallback } from 'react';
import SlotCard from './SlotCard';
import WarningBanner from './WarningBanner';
import SharedRequirementsBar from './SharedRequirementsBar';
import OrderSummaryPanel from './OrderSummaryPanel';
import PersonTag from './PersonTag';

function CollapsibleGroup({ title, emojiKey, children, defaultOpen = true, label }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-[#F0E8E2] overflow-hidden mb-4 shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-[#FFF9F5] transition-colors duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-[#FFF9F5] border border-[#F0E8E2] flex items-center justify-center text-[#9C8E84] shrink-0 mt-0.5">
          <span className="text-xl leading-none">{emojiKey}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[15px] font-bold text-[#1A120D] block">{title}</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">{label}</div>
        </div>
        <span className="text-[13px] text-[#9C8E84] shrink-0 mt-1 font-medium">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function LayoutShell({
  schema,
  restaurants,
  menus,
  onItemQuantityChange,
  onItemRemove,
  onVariantChange,
  onWarningDismiss,
  onSelectOption,
  onAddOrderItem,
  onAddItem,
  onRemoveOrderItem,
  onUpdateOrderItemQty,
  onCheckout,
}) {
  if (!schema) return null;

  const { slots = [], shared_requirements = [], warnings = [], order_summary = {}, constraints = {} } = schema;

  const sortedWarnings = [...(warnings || [])].sort((a, b) => {
    if (a.severity === 'blocking' && b.severity !== 'blocking') return -1;
    if (a.severity !== 'blocking' && b.severity === 'blocking') return 1;
    return 0;
  });

  // Left section always groups by person at the top level
  function buildGroups() {
    const byPerson = [];
    for (const slot of slots) {
      byPerson.push({
        title: slot.person?.name || 'Unknown',
        emojiKey: '👤',
        slots: [slot],
        preferences: slot.person?.preferences || {},
      });
    }
    return byPerson;
  }

  const groups = buildGroups();

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1A120D]">Your Meal Options</h1>
            <p className="text-[13px] text-[#5C4F48] mt-1">Personalized meal options for {slots.length} people</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Results — always grouped by person */}
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

            {/* Grouped slots by person */}
            <div className="space-y-4">
              {groups.map((group, gi) => (
                <CollapsibleGroup
                  key={gi}
                  title={group.title}
                  emojiKey={group.emojiKey}
                  label={
                    <PersonTag
                      name={null}
                      preferences={group.preferences}
                      showPreferences={true}
                    />
                  }
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
                restaurants={restaurants}
                menus={menus}
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
