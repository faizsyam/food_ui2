import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { classifyWarnings, computeMinOrderWarnings } from '../../lib/warningUtils';
import SlotCard from './SlotCard';
import WarningBanner from './WarningBanner';
import SharedRequirementsBar from './SharedRequirementsBar';
import OrderSummaryPanel from './OrderSummaryPanel';
import PersonTag from './PersonTag';

function WarningBadge({ count, isBlocking }) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-[1px] rounded-full shrink-0 ${
        isBlocking
          ? 'bg-[#FEE2E2] text-[#E11D48] border border-[#FECACA]'
          : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
      }`}
    >
      <AlertTriangle size={12} />
      {count} {count === 1 ? 'issue' : 'issues'}
    </span>
  );
}

function CollapsibleGroup({
  title,
  emojiKey,
  children,
  defaultOpen = true,
  label,
  warningCount = 0,
  hasBlocking = false,
}) {
  const [open, setOpen] = React.useState(defaultOpen && !hasBlocking);
  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden mb-4 shadow-card hover:shadow-card-hover transition-shadow duration-300 ${
        hasBlocking
          ? 'border-[#E11D48]/40 ring-1 ring-[#E11D48]/20'
          : 'border-[#F0E8E2]'
      }`}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-[#FFF9F5] transition-colors duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-[#FFF9F5] border border-[#F0E8E2] flex items-center justify-center text-[#9C8E84] shrink-0 mt-0.5">
          <span className="text-xl leading-none">{emojiKey}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-[#1A120D] block">
              {title}
            </span>
            <WarningBadge count={warningCount} isBlocking={hasBlocking} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">{label}</div>
        </div>
        <span className="text-[13px] text-[#9C8E84] shrink-0 mt-1 font-medium">
          {open ? 'Hide' : 'Show'}
        </span>
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
  diff,
}) {
  if (!schema) return null;

  const { slots = [], shared_requirements = [], warnings = [], constraints = {} } = schema;

  // Compute live min_order warnings from current cart state
  const liveMinOrderWarnings = React.useMemo(
    () => computeMinOrderWarnings(schema?.order?.items, restaurants, schema),
    [schema?.order?.items, restaurants, schema]
  );

  // Merge AI warnings + live computed warnings, then classify by scope
  const allWarnings = React.useMemo(
    () => [...(warnings || []), ...liveMinOrderWarnings],
    [warnings, liveMinOrderWarnings]
  );
  const { global: globalWarnings, bySlot: slotWarnings } = classifyWarnings(allWarnings);

  const sortedGlobalWarnings = [...globalWarnings].sort((a, b) => {
    if (a.severity === 'blocking' && b.severity !== 'blocking') return -1;
    if (a.severity !== 'blocking' && b.severity === 'blocking') return 1;
    return 0;
  });

  // Rejected instructions from diff
  const rejectedEntries = diff?.rejected || [];
  const rejectedMessage = rejectedEntries.map((r) => r.reason).join(' ');
  const [dismissedRejected, setDismissedRejected] = useState(false);
  const prevDiffRef = React.useRef(null);

  useEffect(() => {
    if (diff && prevDiffRef.current !== diff) {
      prevDiffRef.current = diff;
      setDismissedRejected(false);
    }
  }, [diff]);

  // Build person groups from slots
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
            <p className="text-[13px] text-[#5C4F48] mt-1">
              Personalized meal options for {slots.length} people
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Results */}
          <div className="flex-1 min-w-0">
            {shared_requirements.length > 0 && (
              <SharedRequirementsBar requirements={shared_requirements} warnings={warnings} />
            )}

            {/* Rejected instructions from diff */}
            {rejectedEntries.length > 0 && !dismissedRejected && (
              <div className="mb-4" role="region" aria-label="Rejected instructions">
                <WarningBanner
                  warning={{ code: null, message: rejectedMessage, severity: 'info' }}
                  onDismiss={() => setDismissedRejected(true)}
                />
              </div>
            )}

            {/* GLOBAL WARNINGS: only for issues that are NOT tied to a specific person */}
            {sortedGlobalWarnings.length > 0 && (
              <div className="space-y-2 mb-4" role="region" aria-label="Global warnings">
                {sortedGlobalWarnings.map((warning, i) => {
                  const originalIndex = warnings.findIndex((w) => w === warning);
                  const isLive = !warnings.includes(warning);
                  return (
                    <WarningBanner
                      key={warning.code ?? 'warning-' + i}
                      warning={warning}
                      onDismiss={
                        !isLive && warning.severity === 'info'
                          ? () => onWarningDismiss?.(originalIndex)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Grouped slots by person */}
            <div className="space-y-4">
              {groups.map((group, gi) => {
                const slot = group.slots[0];
                const slotId = slot?.slot_id;
                const thisSlotWarnings = slotWarnings[slotId] || [];
                const warningCount = thisSlotWarnings.length;
                const hasBlocking = thisSlotWarnings.some(
                  (w) => w.severity === 'blocking'
                );

                return (
                  <CollapsibleGroup
                    key={gi}
                    title={group.title}
                    emojiKey={group.emojiKey}
                    warningCount={warningCount}
                    hasBlocking={hasBlocking}
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
                        diff={diff}
                        warnings={thisSlotWarnings}
                        onItemQuantityChange={onItemQuantityChange}
                        onItemRemove={onItemRemove}
                        onVariantChange={onVariantChange}
                        onSelectOption={onSelectOption}
                        onAddOrderItem={onAddOrderItem}
                        onAddItem={onAddItem}
                      />
                    ))}
                  </CollapsibleGroup>
                );
              })}
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
