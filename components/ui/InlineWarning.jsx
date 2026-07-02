import { AlertTriangle, Info, X } from 'lucide-react';

/**
 * InlineWarning — compact, contextual warning that lives *inside* a card/slot.
 * Designed to sit close to the element it concerns (person/restaurant/item).
 */
export default function InlineWarning({ warning, onDismiss, className = '' }) {
  if (!warning) return null;

  const { code, message, severity, suggestion } = warning;
  const isBlocking = severity === 'blocking';

  const borderClass = isBlocking
    ? 'border-[#FEE2E2] bg-[#FEF2F2]'
    : 'border-[#FEF3C7] bg-[#FFFBEB]';

  const iconClass = isBlocking ? 'text-[#E11D48]' : 'text-[#D97706]';

  const textClass = isBlocking
    ? 'text-[#E11D48]'
    : 'text-[#B45309]';

  return (
    <div
      className={`inline-flex items-start gap-2.5 rounded-lg border px-3 py-2 ${borderClass} ${className}`}
      role="alert"
    >
      {isBlocking ? (
        <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${iconClass}`} />
      ) : (
        <Info size={14} className={`shrink-0 mt-0.5 ${iconClass}`} />
      )}
      <div className="flex-1 min-w-0">
        {message && (
          <p className={`text-[12px] font-medium leading-snug ${textClass}`}>
            {message}
          </p>
        )}
        {suggestion && (
          <p className="text-[11px] mt-0.5 text-[#92400E]/80 leading-snug">
            {suggestion}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss warning"
          className="shrink-0 p-0.5 rounded hover:bg-white/50 transition-colors -mr-1 -mt-0.5"
        >
          <X size={13} className={iconClass} />
        </button>
      )}
    </div>
  );
}
