import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowRight, RotateCcw, Clock } from 'lucide-react';

function formatTimestamp(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

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

  const updateCount = Math.max(0, history.length - 1);

  return (
    <div className="bg-white border-b border-[#EFEFED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* COLLAPSED — show current request */}
        <p className="text-[14px] text-[#6B6B67] truncate mb-2.5">
          {currentRequest || 'Your order'}
        </p>

        {/* Refinement input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={refinementText}
            onChange={(e) => setRefinementText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Refine your order…"
            disabled={isLoading}
            className="w-full px-3 py-2 pr-10 text-[13px] text-[#1A120D] bg-white border border-[#EFEFED] rounded-lg
              focus:outline-none focus:border-[#9A9A96] focus:ring-1 focus:ring-[#9A9A96]/20
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-[#B5A99F] transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !refinementText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E8521A] disabled:opacity-40
              hover:text-[#D4491A] transition-colors p-1"
            aria-label="Submit refinement"
          >
            <ArrowRight size={16} />
          </button>
        </div>

        {/* History indicator */}
        {updateCount > 0 && (
          <button
            onClick={() => setShowHistory((p) => !p)}
            className="flex items-center gap-1.5 text-[12px] text-[#9A9A96] mt-2
              hover:text-[#6B6B67] transition-colors"
          >
            <RotateCcw size={12} />
            <span>{updateCount} updates</span>
          </button>
        )}

        {/* History panel */}
        {showHistory && updateCount > 0 && (
          <div className="mt-3 pt-3 border-t border-[#EFEFED] space-y-2">
            {history.map((entry, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={index}
                  className="flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-[#F7F7F5] transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E8521A] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#1A120D] leading-snug">
                      {entry.request}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} className="text-[#9A9A96]" />
                      <p className="text-[11px] text-[#9A9A96]">
                        {formatTimestamp(entry.timestamp)}
                        {isLatest && ' • latest'}
                      </p>
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
