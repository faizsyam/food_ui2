import React from 'react';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatIDR(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/* ── RestaurantBreakdownRow ─────────────────────────────────────────────── */

function RestaurantBreakdownRow({ entry, restaurant }) {
  const {
    restaurant_id,
    slot_ids = [],
    items_subtotal = 0,
    delivery_fee = 0,
    min_order = 0,
    meets_min_order = true,
  } = entry;

  const isBelowMin = !meets_min_order;
  const totalForRestaurant = items_subtotal + delivery_fee;

  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        isBelowMin
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Restaurant name */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
              {restaurant?.name || restaurant_id}
            </span>
            {restaurant?.cuisine && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {restaurant.cuisine}
              </span>
            )}
          </div>

          {/* Slots in this restaurant */}
          <p className="text-xs text-gray-500 mt-1">
            {slot_ids.length} {slot_ids.length === 1 ? 'order' : 'orders'}
          </p>

          {/* Min order warning */}
          {isBelowMin && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              Below minimum order of {formatIDR(min_order)}
            </p>
          )}
        </div>

        {/* Price column */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900 tabular-nums">
            {formatIDR(totalForRestaurant)}
          </p>
          <p className="text-[10px] text-gray-400 tabular-nums mt-0.5">
            <span className={isBelowMin ? 'text-red-500 font-medium' : ''}>
              {formatIDR(items_subtotal)}
            </span>
            {' + '}
            {formatIDR(delivery_fee)} delivery
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── CheckoutStatus ────────────────────────────────────────────────────── */

function CheckoutStatus({ checkoutReady, blockingIssues }) {
  const hasIssues = Array.isArray(blockingIssues) && blockingIssues.length > 0;

  if (checkoutReady && !hasIssues) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-semibold">Ready for checkout</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-semibold">Cannot proceed to checkout</span>
      </div>

      {hasIssues && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
            Blocking issues
          </p>
          <ul className="space-y-1">
            {blockingIssues.map((issue, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>{String(issue).replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── OrderSummaryCard ─────────────────────────────────────────────────── */

/**
 * OrderSummaryCard
 *
 * Renders the AI-computed `order_summary` from the root schema:
 *   { restaurant_breakdown[], grand_total, checkout_ready, blocking_issues[] }
 *
 * Props:
 *   orderSummary {object}  schema.order_summary
 *   restaurants  {array}   Full restaurants array for looking up names
 *   slots        {array}   schema.slots (for person names in breakdown)
 */
export default function OrderSummaryCard({ orderSummary, restaurants = [], slots = [] }) {
  if (!orderSummary || typeof orderSummary !== 'object') return null;

  const {
    restaurant_breakdown = [],
    grand_total = 0,
    checkout_ready = false,
    blocking_issues = [],
  } = orderSummary;

  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden" aria-label="Order summary">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
          Order Summary
        </h2>
      </header>

      <div className="p-5 space-y-4">
        {/* Restaurant breakdowns */}
        {restaurant_breakdown.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Restaurant Breakdown
            </h3>
            <div className="space-y-2">
              {restaurant_breakdown.map((entry) => (
                <RestaurantBreakdownRow
                  key={entry.restaurant_id}
                  entry={entry}
                  restaurant={restaurantMap.get(entry.restaurant_id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Grand total + separator */}
        <div className="border-t border-dashed border-gray-200 pt-4">
          <div className="flex items-end justify-between">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Grand Total
            </span>
            <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
              {formatIDR(grand_total)}
            </span>
          </div>
        </div>

        {/* Checkout status */}
        <div className="pt-1">
          <CheckoutStatus
            checkoutReady={checkout_ready}
            blockingIssues={blocking_issues}
          />
        </div>
      </div>
    </section>
  );
}
