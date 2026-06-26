import React, { useState } from "react"
import { Copy, Check, Truck, Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import { formatIDR } from "../../lib/format"

function OrderItemRow({ item, onQtyChange, onRemove }) {
  const handleDec = () => {
    if (item.quantity <= 1) onRemove?.(item.id)
    else onQtyChange?.(item.id, item.quantity - 1)
  }
  const handleInc = () => onQtyChange?.(item.id, item.quantity + 1)
  return (
    <div className="flex items-start gap-2 py-2 border-b border-[#F7F7F5] last:border-b-0">
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-[#111111]">{item.name}</span>
        {item.variant && <span className="text-[12px] text-[#6B6B67] ml-1">({item.variant})</span>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={handleDec} className="w-6 h-6 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#111111] hover:border-[#D8D8D5] transition-colors">
          {item.quantity <= 1 ? <Trash2 size={12} className="text-[#DC2626]" /> : <Minus size={12} />}
        </button>
        <span className="text-[13px] font-medium w-6 text-center">{item.quantity}</span>
        <button onClick={handleInc} className="w-6 h-6 rounded-full border border-[#EFEFED] flex items-center justify-center text-[#111111] hover:border-[#D8D8D5] transition-colors">
          <Plus size={12} />
        </button>
      </div>
      <span className="text-[13px] font-medium text-[#111111] tabular-nums w-20 text-right shrink-0">{formatIDR(item.line_total)}</span>
    </div>
  )
}

export default function OrderSummaryPanel({ schema, onCheckout, onRemoveOrderItem, onUpdateOrderItemQty }) {
  const [copied, setCopied] = useState(false)

  if (!schema) return null

  const order = schema.order || { items: [] }
  const items = order.items || []
  const isEmpty = items.length === 0
  const orderSummary = schema.order_summary || {}
  const constraints = schema.constraints || {}

  const budgetLimit = (constraints.total_budget)
  const headcount = (constraints.headcount) || 0
  const perPerson = budgetLimit && headcount > 0 ? budgetLimit / headcount : 0

  const grandTotal = (orderSummary.grand_total) || 0
  const breakdown = orderSummary.restaurant_breakdown || []
  const checkoutReady = (orderSummary.checkout_ready) || false
  const blockingIssues = orderSummary.blocking_issues || []

  const progress = budgetLimit ? Math.min((grandTotal / budgetLimit) * 100, 100) : 0
  const over = budgetLimit ? grandTotal > budgetLimit : false
  const near = budgetLimit ? !over && progress >= 85 : false

  const groupByRestaurant = () => {
    const groups = {}
    for (const it of items) {
      const rid = it.restaurant_id || "unknown"
      if (!groups[rid]) {
        groups[rid] = {
          rid, name: it.restaurant_name || "Unknown", items: [], subtotal: 0
        }
      }
      groups[rid].items.push(it)
      groups[rid].subtotal += it.line_total || 0
    }
    return Object.values(groups)
  }
  const groups = isEmpty ? [] : groupByRestaurant()

  const handleCopy = () => {
    const lines = ["Order Summary"]
    for (const g of groups) {
      lines.push(`${g.name}:`)
      for (const it of g.items) {
        lines.push(`  - ${it.name} x${it.quantity} = ${formatIDR(it.line_total)}`)
      }
    }
    lines.push(`Total: ${formatIDR(grandTotal)}`)
    navigator.clipboard.writeText(lines.join("\n")).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-[#EFEFED] rounded-xl overflow-hidden">
      <div className="p-5">
        <h2 className="text-[17px] font-semibold text-[#111111]">Order Summary</h2>

        {/* Empty state */}
        {isEmpty && (
          <div className="mt-6 text-center py-8">
            <div className="w-12 h-12 bg-[#F7F7F5] rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingCart size={24} className="text-[#9A9A96]" />
            </div>
            <p className="text-[14px] text-[#9A9A96]">Your order is empty</p>
            <p className="text-[13px] text-[#6B6B67] mt-1">Add items from the meal options to get started</p>
          </div>
        )}

        {/* Order items grouped by restaurant */}
        {!isEmpty && (
          <div className="mt-4 border border-[#EFEFED] rounded-lg overflow-hidden">
            {groups.map(g => {
              const fee = breakdown.find(b => b.restaurant_id === g.rid)?.delivery_fee || 0
              return (
                <div key={g.rid} className="border-b border-[#EFEFED] last:border-b-0">
                  <div className="px-5 py-3 bg-[#F7F7F5]">
                    <div className="flex items-center gap-1 text-[14px] font-semibold text-[#111111]">
                      <Truck size={14} /> {g.name}
                    </div>
                  </div>
                  <div className="px-5">
                    {g.items.map(it => (
                      <OrderItemRow key={it.id} item={it} onQtyChange={onUpdateOrderItemQty} onRemove={onRemoveOrderItem} />
                    ))}
                  </div>
                  <div className="px-5 py-2 flex justify-between text-[13px]">
                    <span className="text-[#6B6B67]">Subtotal</span>
                    <span className="text-[#111111] tabular-nums">{formatIDR(g.subtotal)}</span>
                  </div>
                  <div className="px-5 py-1 flex justify-between text-[13px]">
                    <span className="text-[#6B6B67]">Delivery</span>
                    <span className="text-[#111111] tabular-nums">{formatIDR(fee)}</span>
                  </div>
                </div>
              )
            })}
          </div>)
        }

        {/* Price totals */}
        {!isEmpty && (
          <div className="mt-4 pt-4 border-t border-[#EFEFED]">
            <div className="flex justify-between text-[15px] font-bold">
              <span className="text-[#111111]">Grand Total</span>
              <span className="text-[#111111] tabular-nums text-[17px]">{formatIDR(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Budget */}
        {budgetLimit && !isEmpty && (
          <div className="mt-4">
            <div className="w-full h-2 bg-[#EFEFED] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${over ? "bg-[#DC2626]" : near ? "bg-[#D97706]" : "bg-[#16A34A]"}`} style={{width: Math.min(progress, 100) + "%"}} />
            </div>
            <p className="text-[13px] mt-1.5">
              {over ? (
                <span className="text-[#DC2626] font-medium">{formatIDR(grandTotal - budgetLimit)} over budget</span>
              ) : (
                <span className="text-[#16A34A] font-medium">{formatIDR(budgetLimit - grandTotal)} under budget</span>
              )}
            </p>
          </div>
        )}

        {/* Constraints */}
        {budgetLimit && (
          <div className="mt-3 text-[12px] text-[#6B6B67]">
            Budget: {formatIDR(budgetLimit)} ({headcount > 0 ? formatIDR(budgetLimit / headcount) : ""} per person)
          </div>
        )}

        {/* Blocking */}
        {blockingIssues.length > 0 && (
          <div className="mt-4 p-3 bg-[#FEF2F2] rounded-lg">
            {blockingIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[13px] text-[#DC2626]">{issue}</span>
              </div>
            ))}
          </div>
        )}

        {/* Checkout */}
        <button onClick={onCheckout} disabled={!checkoutReady}
          className="mt-5 w-full h-12 bg-[#E8521A] text-white text-[15px] font-semibold rounded-lg hover:bg-[#d4491a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {checkoutReady ? "Confirm order" : "Add items to continue"}
        </button>

        {/* Copy */}
        {!isEmpty && (
          <button onClick={handleCopy}
            className="mt-3 w-full flex items-center justify-center gap-2 text-[14px] text-[#6B6B67] hover:text-[#111111] transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy order summary"}
          </button>
        )}
      </div>
    </div>
  )
}
