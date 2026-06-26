import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getRecent, saveRequest, removeRequest } from '../lib/recentRequests';

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
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleChange}
        placeholder="Describe your meal order in plain language..."
        rows={3}
        disabled={isLoading}
        className="w-full px-4 py-3 text-[15px] text-[#111111] bg-white border border-[#EFEFED] rounded-xl resize-none focus:outline-none focus:border-[#111111] disabled:opacity-50"
      />

      {/* Submit row */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[13px] text-[#9A9A96]">
          {inputValue.length} / 500
        </span>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !inputValue.trim()}
          className="px-5 py-2.5 bg-[#E8521A] text-white text-[15px] font-medium rounded-lg hover:bg-[#D4491A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Finding...' : 'Find my order'}
        </button>
      </div>

      {/* Loading status */}
      {isLoading && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-[#6B6B67] animate-pulse-soft">
          <div className="w-2 h-2 rounded-full bg-[#E8521A]" />
          {LOADING_MESSAGES[messageIndex]}
        </div>
      )}

      {/* Example chips */}
      {!isLoading && (
        <div className="mt-5 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((text) => (
            <button
              key={text}
              onClick={() => selectExample(text)}
              className="px-4 py-1.5 text-[13px] text-[#6B6B67] bg-[#F7F7F5] border border-[#EFEFED] rounded-full hover:border-[#D8D8D5] hover:bg-white transition-colors"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Recent requests */}
      {recents.length > 0 && !isLoading && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#9A9A96] mb-2">Recent</p>
          <div className="space-y-1">
            {recents.map((req) => (
              <div key={req} className="flex items-center gap-2 group">
                <button
                  onClick={() => selectExample(req)}
                  className="flex-1 text-left text-[14px] text-[#6B6B67] hover:text-[#111111] truncate"
                >
                  {req}
                </button>
                <button
                  onClick={() => { removeRequest(req); setRecents(getRecent()); }}
                  className="opacity-0 group-hover:opacity-100 text-[13px] text-[#9A9A96] hover:text-[#DC2626] transition-opacity"
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
