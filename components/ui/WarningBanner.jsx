import { AlertTriangle, Info, X, RefreshCw } from 'lucide-react';

export default function WarningBanner({ warning, onDismiss, onClick }) {
  if (!warning) return null;

  const { code, message, severity, suggestion } = warning;
  const isBlocking = severity === 'blocking';

  const severityStyles = isBlocking
    ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#E11D48]'
    : 'bg-[#FFF9F5] border-[#F0E8E2] text-[#D97706]';

  const Icon = isBlocking ? AlertTriangle : code === 'AUTO_REASSIGNED_OPTION' ? RefreshCw : Info;

  return (
    <div
      className={`relative rounded-xl border px-4 py-3.5 ${severityStyles} ${onClick ? 'cursor-pointer' : ''} hover:shadow-soft transition-shadow duration-200`}
      onClick={onClick}
      role="alert"
    >
      <div className="flex items-start gap-3 pr-8">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isBlocking ? 'bg-[#FEE2E2]/60' : 'bg-[#FEF3C7]/40'}`}>
          <Icon size={16} className="shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          {code && (
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
              {String(code).replace(/_/g, ' ')}
            </p>
          )}
          {message && <p className="text-[14px] mt-0.5">{message}</p>}
          {suggestion && (
            <p className="text-[13px] mt-1 opacity-80 leading-relaxed">
              <span className="font-semibold">Suggestion:</span> {suggestion}
            </p>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss warning"
          className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
