import { AlertTriangle, Info, X, RefreshCw } from 'lucide-react';

export default function WarningBanner({ warning, onDismiss, onClick }) {
  if (!warning) return null;

  const { code, message, severity, suggestion } = warning;
  const isBlocking = severity === 'blocking';

  const containerClass = isBlocking
    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#E11D48]'
    : 'bg-[#FFF9F5] border-[#F0E8E2] text-[#B45309]';

  const Icon = isBlocking ? AlertTriangle : code === 'AUTO_REASSIGNED_OPTION' ? RefreshCw : Info;

  return (
    <div
      className={`relative rounded-lg border px-4 py-3 ${containerClass}`}
      role="alert"
    >
      <div className="flex items-start gap-3 pr-8">
        <Icon size={16} className="shrink-0 mt-0.5" />
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
          onClick={onDismiss}
          aria-label="Dismiss warning"
          className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
