import React, { useState } from "react"
import { Copy, Check, Truck, Plus, Trash2, ShoppingCart, User, Store } from "lucide-react"
import { formatIDR } from "../../lib/format"

function OrderItemRow({ item, onQtyChange, onRemove }) {
  const handleDec = () => {
    if (item.quantity <= 1) onRemove?.(item.id)
    else onQtyChange?.(item.id, item.quantity - 1)
  }
  const handleInc = () => onQtyChange?.(item.id, item.quantity + 1)
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-[#F0E8E2] last:border-b-0">
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-[#1A120D]">{item.name}</span>
        {item.variant && <span className="text-[12px] text-[#9C8E84] ml-1">({item.variant})</span>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={handleDec} className="w-6 h-6 rounded-full border border-[#E0D4CA] flex items-center justify-center text-[#1A120D] hover:bg-[#FFF9F5] transition-colors active:scale-90">
          {item.quantity <= 1 ? <Trash2 size={12} className="text-[#E11D48]" /> : <span className="text-[13px] leading-none">-</span>}
        </button>
        <span className="text-[13px] font-semibold w-6 text-center">{item.quantity}</span>
        <button onClick={handleInc} className="w-6 h-6 rounded-full border border-full border-[#E0D4CA] flex items-center justify-center text-[#1A120D] hover:bg-[#FFF9F5] transition-colors active:scale-90">
          <span className="text-[13px] leading-none">+</span>
        </button>
      </div>
      <span className="text-[13px] font-semibold text-[#1A120D] tabular-nums w-20 text-right shrink-0">{formatIDR(item.line_total)}</span>
    </div>
  )
}

export default function OrderSummaryPanel({ schema, onCheckout, onRemoveOrderItem, onUpdateOrderItemQty }) {
  const [copied, setCopied] = useState(false)
  const [groupingStrategy, setGroupingStrategy] = useState('by_person')

  if (!schema) return null

  const order = schema.order || { items: [] }
  const items = order.items || []
  const isEmpty = items.length === 0
  const orderSummary = schema.order_summary || {}
  const constraints = schema.constraints || {}

  const budgetLimit = (constraints.total_budget)
  const headcount = (constraints.headcount) || 0

  const grandTotal = (orderSummary.grand_total) || 0
  const breakdown = orderSummary.restaurant_breakdown || []
  const checkoutReady = (orderSummary.checkout_ready) || false
  const blockingIssues = orderSummary.blocking_issues || []

  const progress = budgetLimit ? Math.min((grandTotal / budgetLimit) * 100, 100) : 0
  const over = budgetLimit ? grandTotal > budgetLimit : false
  const near = budgetLimit ? !over && progress >= 85 : false

  const getGroups = () => {
    const groups = {}
    if (groupingStrategy === 'by_person') {
      for (const it of items) {
        const key = it.person_name || 'Unknown'
        if (!groups[key]) {
          groups[key] = { rid: key, name: key, items: [], subtotal: 0 }
        }
        groups[key].items.push(it)
        groups[key].subtotal += it.line_total || 0
      }
    } else {
      for (const it of items) {
        const rid = it.restaurant_id || 'unknown'
        if (!groups[rid]) {
          groups[rid] = { rid, name: it.restaurant_name || 'Unknown', items: [], subtotal: 0 }
        }
        groups[rid].items.push(it)
        groups[rid].subtotal += it.line_total || 0
      }
    }
    return Object.values(groups)
  }
  const groups = isEmpty ? [] : getGroups()

  const handleCopy = () => {
    const lines = ["Order Summary"]
    for (const g of groups) {
      lines.push(`${g.name}:`)
      for (const it of g.items) {
        lines.push(`  - ${it.name} x${it.quantity} = ${formatIDR(it.line_total)}`)
      }
      lines.push(`Subtotal: ${formatIDR(g.subtotal)}`)
    }
    lines.push(`Grand Total: ${formatIDR(grandTotal)}`)
    navigator.clipboard.writeText(lines.join("\n")).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-[#F0E8E2] rounded-2xl overflow-hidden shadow-card">
      <div className="p-5">
        {/* Title + grouping toggle */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-bold text-[#1A120D]">Order Summary</h2>
          <div className="flex items-center gap-1.5 bg-[#FFF9F5] border border-[#F0E8E2] rounded-xl p-0.5">
            <button
              onClick={() => setGroupingStrategy('by_person')}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 ${
                groupingStrategy === 'by_person'
                  ? 'bg-white text-[#E8521A] shadow-soft'
                  : 'text-[#9C8E84] hover:text-[#5C4F48]'
              }`}
            >
              <User size={12} />
              Person
            </button>
            <button
              onClick={() => setGroupingStrategy('by_restaurant')}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 ${
                groupingStrategy === 'by_restaurant'
                  ? 'bg-white text-[#E8521A] shadow-soft'
                  : 'text-[#9C8E84] hover:text-[#5C4F48]'
              }`}
            >
              <Store size={12} />
              Restaurant
            </button>
          </div>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-[#FFF9F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={28} className="text-[#E0D4CA]" />
            </div>
            <p className="text-[15px] font-semibold text-[#1A120D]">Your order is empty</p>
            <p className="text-[13px] text-[#9C8E84] mt-1">Add items from the meal options to get started</p>
          </div>
        )}

        {/* Order items grouped by restaurant */}
        {!isEmpty && (
          <div className="border border-[#F0E8E2] rounded-xl overflow-hidden" id="orderSummaryPanel">
            {groups.map(g => {
              const isPersonMode = groupingStrategy === 'by_person'
              const fee = isPersonMode ? 0 : (breakdown.find(b => b.restaurant_id === g.rid)?.delivery_fee || 0)
              return (
                <div key={g.rid} className="border-b border-[#F0E8E2] last:border-b-0">
                  <div className="px-5 py-3 bg-[#FFF9F5]">
                    <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#1A120D]">
                      {isPersonMode ? (
                        <User size={15} className="text-[#E8521A]" />
                      ) : (
                        <Truck size={15} className="text-[#E8521A]" />
                      )}
                      {g.name}
                    </div>
                  </div>
                  <div className="px-5">
                    {g.items.map(it => (
                      <OrderItemRow key={it.id} item={it} onQtyChange={onUpdateOrderItemQty} onRemove={onRemoveOrderItem} />
                    ))}
                  </div>
                  <div className="px-5 py-2 flex justify-between text-[13px]">
                    <span className="text-[#9C8E84]">Subtotal</span>
                    <span className="text-[#1A120D] font-semibold tabular-nums">{formatIDR(g.subtotal)}</span>
                  </div>
                  {!isPersonMode && (
                    <div className="px-5 py-1 flex justify-between text-[13px]">
                      <span className="text-[#9C8E84]">Delivery</span>
                      <span className="text-[#1A120D] font-semibold tabular-nums">{formatIDR(fee)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Price totals */}
        {!isEmpty && (
          <div className="mt-5 pt-4 border-t border-[#F0E8E2]">
            <div className="flex justify-between text-[15px] font-bold">
              <span className="text-[#1A120D]">Grand Total</span>
              <span className="text-[#1A120D] tabular-nums text-[18px]">{formatIDR(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Budget */}
        {budgetLimit && !isEmpty && (
          <div className="mt-5">
            <div className="w-full h-2.5 bg-[#F0E8E2] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-[#E11D48]" : near ? "bg-[#D97706]" : "bg-[#22A65E]"}`} style={{width: Math.min(progress, 100) + "%"}} />
            </div>
            <p className="text-[13px] mt-2 font-medium">
              {over ? (
                <span className="text-[#E11D48]">{formatIDR(grandTotal - budgetLimit)} over budget</span>
              ) : (
                <span className="text-[#22A65E]">{formatIDR(budgetLimit - grandTotal)} remaining</span>
              )}
            </p>
          </div>
        )}

        {/* Constraints */}
        {budgetLimit && (
          <div className="mt-2 text-[12px] text-[#B5A99F]">
            Budget: {formatIDR(budgetLimit)} {headcount > 0 ? `(${formatIDR(budgetLimit / headcount)} per person)` : ""}
          </div>
        )}

        {/* Blocking */}
        {blockingIssues.length > 0 && (
          <div className="mt-4 p-3.5 bg-[#FEF2F2] rounded-xl border border-[#FEE2E2]">
            {blockingIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[13px] text-[#E11D48]">{issue}</span>
              </div>
            ))}
          </div>
        )}

        {/* Checkout */}
        <button onClick={onCheckout} disabled={!checkoutReady}
          className="mt-5 w-full h-12 bg-[#E8521A] text-white text-[15px] font-bold rounded-xl hover:bg-[#D4491A] active:scale-[0.98] transition-all duration-200 shadow-soft disabled:opacity-40 disabled:cursor-not-allowed">
          {checkoutReady ? "Confirm order" : "Add items to continue"}
        </button>

        {/* Copy */}
        {!isEmpty && (
          <button onClick={handleCopy}
            className="mt-3 w-full flex items-center justify-center gap-2 text-[14px] text-[#5C4F48] hover:text-[#1A120D] transition-colors py-2 rounded-xl hover:bg-[#FFF9F5]">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy order summary"}
          </button>
        )}
      </div>
    </div>
  )
}
