import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getRecent, saveRequest, removeRequest } from '../lib/recentRequests';
import { Sparkles } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Lunch for 4 at the office, mixed dietary needs, arrive by 12:30',
  'Full day meals — breakfast, lunch, and dinner for one person',
  'Me and my wife ordering from different locations, one payment',
  'Best meal under Rp150k across two restaurants',
];

const LOADING_MESSAGES = [
  'Reading your request...',
  'Searching restaurants...',
  'Building your order...',
  'Almost ready...',
];

export default function RequestInput({ onSubmit, isLoading, value, onChange }) {
  const textareaRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) setInputValue(value);
  }, [value]);

  const handleChange = useCallback((e) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
  }, [onChange]);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    saveRequest(trimmed);
    onSubmit?.(trimmed);
  }, [inputValue, isLoading, onSubmit]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  useEffect(() => {
    if (!isLoading) return;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const selectExample = (text) => {
    setInputValue(text);
    onChange?.(text);
    textareaRef.current?.focus();
  };

  const [recents, setRecents] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRecents(getRecent());
    setMounted(true);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleChange}
          placeholder="Describe your meal order in plain language..."
          rows={3}
          disabled={isLoading}
          className="w-full px-5 py-4 text-[15px] text-[#1A120D] bg-white border border-[#F0E8E2] rounded-2xl resize-none
            focus:outline-none focus:ring-2 focus:ring-[#E8521A]/20 focus:border-[#E8521A]/30
            disabled:opacity-50 transition-shadow duration-200 shadow-soft
            placeholder:text-[#9C8E84]"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] text-[#B5A99F] font-medium">
            {inputValue.length} / 500
          </span>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-2.5 bg-[#E8521A] text-white text-[14px] font-semibold rounded-xl
              hover:bg-[#D4491A] active:scale-[0.97] transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-card"
          >
            {isLoading ? 'Finding...' : 'Find my order'}
          </button>
        </div>
      </div>

      {/* Loading status */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-2.5 text-[13px] text-[#5C4F48]">
          <div className="w-5 h-5 border-2 border-[#E8521A]/20 border-t-[#E8521A] rounded-full animate-spin-slow" />
          <span className="animate-pulse-soft">{LOADING_MESSAGES[messageIndex]}</span>
        </div>
      )}

      {/* Example chips */}
      {!isLoading && (
        <div className="mt-6">
          <p className="text-[12px] font-medium text-[#9C8E84] mb-2 tracking-wide uppercase">Try saying</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((text) => (
              <button
                key={text}
                onClick={() => selectExample(text)}
                className="px-3.5 py-2 text-[13px] text-[#5C4F48] bg-white border border-[#F0E8E2] rounded-xl
                  hover:border-[#E8521A]/30 hover:shadow-soft transition-all duration-200 text-left leading-snug max-w-[260px]"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent requests */}
      {recents.length > 0 && !isLoading && (
        <div className="mt-5">
          <p className="text-[12px] font-medium text-[#9C8E84] mb-2 tracking-wide uppercase">Recent</p>
          <div className="space-y-1">
            {recents.map((req) => (
              <div key={req} className="flex items-center gap-2 group">
                <button
                  onClick={() => selectExample(req)}
                  className="flex-1 text-left text-[14px] text-[#5C4F48] hover:text-[#1A120D] truncate
                    py-1.5 px-3 rounded-xl hover:bg-white transition-colors duration-200"
                >
                  {req}
                </button>
                <button
                  onClick={() => { removeRequest(req); setRecents(getRecent()); }}
                  className="opacity-0 group-hover:opacity-100 text-[12px] text-[#9C8E84] hover:text-[#E11D48] transition-opacity px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
