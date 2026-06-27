import React from 'react';
import { formatIDR } from '../../lib/format';

export default function BudgetBar({ slots, constraints, orderSummary }) {
  const grandTotal = orderSummary?.grand_total ?? 0;
  const budgetLimit = constraints?.total_budget ?? null;

  if (!budgetLimit) return null;

  const progress = Math.min((grandTotal / budgetLimit) * 100, 100);
  const isOver = grandTotal > budgetLimit;
  const isNear = !isOver && progress >= 85;

  const barColor = isOver ? 'bg-[#E11D48]' : isNear ? 'bg-[#D97706]' : 'bg-[#22A65E]';
  const textColor = isOver ? 'text-[#E11D48]' : isNear ? 'text-[#D97706]' : 'text-[#22A65E]';

  return (
    <div className="mt-4">
      <div className="w-full h-2 bg-[#F0E8E2] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <p className={`text-[13px] mt-1.5 font-medium ${textColor}`}>
        {isOver
          ? `${formatIDR(grandTotal - budgetLimit)} over budget`
          : `${formatIDR(budgetLimit - grandTotal)} remaining`
        }
      </p>
    </div>
  );
}
