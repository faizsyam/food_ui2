import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowRight, RotateCcw, Clock, Zap, History, X, Sparkles } from 'lucide-react';

function formatTimestamp(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const REFINEMENT_LOADING_MESSAGES = [
  'Updating your order...',
  'Adjusting selections...',
  'Re-checking availability...',
  'Applying changes...',
];

/**
 * QueryBar — conversational refinement input
 *
 * Collapsed in RESULT view. Shows the current request, a live refinement
 * input field, and an optional history indicator.
 */
export default function QueryBar({
  currentRequest,
  history = [],
  onSubmit,
  isLoading,
}) {
  const [refinementText, setRefinementText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const handleSubmit = useCallback(() => {
    const trimmed = refinementText.trim();
    if (!trimmed || isLoading) return;
    onSubmit?.(trimmed);
    setRefinementText('');
    setShowHistory(false);
  }, [refinementText, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // scroll into view on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // Loading message cycle
  useEffect(() => {
    if (!isLoading) return;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % REFINEMENT_LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const updateCount = Math.max(0, history.length - 1);

  return (
    <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-md border-b border-[#EFEFED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">

        {/* ── Current request context chip ── */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5EF] border border-[#F0E8E2] rounded-lg shrink-0">
            <Sparkles size={14} className="text-[#E8521A]" />
            <span className="text-[12px] font-semibold text-[#E8521A] tracking-wide uppercase">Order</span>
          </div>
          <p className="text-[14px] text-[#1A120D] leading-snug pt-1">
            {currentRequest || 'Your order'}
          </p>
        </div>

        {/* ── Refinement input ── */}
        <div className="relative group">
          <div
            className={`
              flex items-center gap-2.5
              bg-white border rounded-xl
              transition-all duration-200
              ${isLoading
                ? 'border-[#E8521A]/30 bg-[#FFF5EF]/50'
                : 'border-[#F0E8E2] group-focus-within:border-[#E8521A]/30 group-focus-within:shadow-soft'
              }
            `}
          >
            <input
              ref={inputRef}
              type="text"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? '' : 'Add a refinement…'}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-[14px] text-[#1A120D] bg-transparent
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                placeholder:text-[#B5A99F]"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !refinementText.trim()}
              className="shrink-0 mr-2 p-2 rounded-lg
                text-[#E8521A] disabled:text-[#B5A99F]
                hover:bg-[#FFF5EF] active:scale-[0.96]
                transition-all duration-200"
              aria-label="Submit refinement"
            >
              <ArrowRight size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* ── Loading state overlay ── */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center gap-2.5 px-4 pointer-events-none">
              <div className="relative">
                <div className="w-4 h-4 border-2 border-[#E8521A]/15 border-t-[#E8521A] rounded-full animate-spin" />
              </div>
              <span className="text-[13px] text-[#5C4F48] font-medium animate-pulse">
                {REFINEMENT_LOADING_MESSAGES[messageIndex]}
              </span>
            </div>
          )}
        </div>

        {/* ── History & meta row ── */}
        <div className="flex items-center gap-3 mt-2">
          {updateCount > 0 ? (
            <button
              onClick={() => setShowHistory((p) => !p)}
              className="flex items-center gap-1.5 text-[12px] text-[#9A9A96] hover:text-[#5C4F48] transition-colors
                px-2 py-1 rounded-md hover:bg-[#F7F7F5]"
            >
              {showHistory ? <X size={12} /> : <History size={12} />}
              <span>{showHistory ? 'Hide' : `${updateCount} update${updateCount > 1 ? 's' : ''}`}</span>
            </button>
          ) : (
            <span className="text-[12px] text-[#B5A99F] flex items-center gap-1.5">
              <Zap size={10} />
              Original request
            </span>
          )}
        </div>

        {/* ── History timeline ── */}
        {showHistory && updateCount > 0 && (
          <div className="mt-3 pt-3 border-t border-[#EFEFED] space-y-1">
            {history.map((entry, index) => {
              const isLatest = index === 0;
              const isOriginal = index === history.length - 1;
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 py-2.5 px-3 rounded-xl transition-all duration-200
                    ${isLatest ? 'bg-[#FFF5EF]/40' : 'hover:bg-[#F7F7F5]'}`}
                >
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center self-stretch pt-1">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0
                      ${isLatest ? 'bg-[#E8521A] ring-2 ring-[#E8521A]/15' : 'bg-[#D4CEC9]'}`}
                    />
                    {index < history.length - 1 && (
                      <div className="w-px flex-1 min-h-[16px] bg-[#E8E3DF] mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#1A120D] leading-snug">
                      {entry.request}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-[#9A9A96]" />
                      <p className="text-[11px] text-[#9A9A96]">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                      {isOriginal && (
                        <span className="text-[10px] font-medium text-[#B5A99F] uppercase tracking-wider">Original</span>
                      )}
                      {isLatest && !isOriginal && (
                        <span className="text-[10px] font-medium text-[#E8521A] uppercase tracking-wider">Latest</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
