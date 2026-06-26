import React, { useState, useRef, useCallback } from 'react';
import { formatIDR } from '../../lib/format';

function estimateArrival(deliveryMinutes) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + (deliveryMinutes || 35));
  return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function QueryBar({
                           requestText,
                           slots,
                           isLoading,
                           error,
                           onEdit,
                           onSubmit,
                         }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editValue, setEditValue] = useState(requestText);
  const textareaRef = useRef(null);

  const handleEdit = useCallback(() => {
    setIsExpanded(true);
    setEditValue(requestText);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [requestText]);

  const handleCancel = useCallback(() => {
    setIsExpanded(false);
    setEditValue(requestText);
  }, [requestText]);

  const handleSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (!trimmed || isLoading) return;
    onSubmit?.(trimmed);
    setIsExpanded(false);
  }, [editValue, isLoading, onSubmit]);

  const arrivalTimes = slots
    .map((slot) => {
      const restaurantId = slot.options?.[0]?.restaurant_id || slot.restaurant_id;
      return estimateArrival(35);
    })
    .filter(Boolean);

  const uniqueTime = [...new Set(arrivalTimes)];
  const displayTime =
    uniqueTime.length === 1
      ? uniqueTime[0]
      : uniqueTime.length > 1
        ? `${uniqueTime[0]} - ${uniqueTime[uniqueTime.length - 1]}`
        : null;

  return (
    <div className="bg-[#F7F7F5] border-b border-[#EFEFED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {!isExpanded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[14px] text-[#111111] font-medium truncate">
                {requestText}
              </span>
              {displayTime && (
                <span className="text-[13px] text-[#6B6B67] whitespace-nowrap">{
                  ` (~${displayTime})`
                }</span>
              )}
            </div>
            <button
              onClick={handleEdit}
              className="text-[14px] text-[#E8521A] font-medium hover:underline shrink-0 ml-4"
            >
              Edit request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-[#EFEFED] rounded-lg text-[15px] text-[#111111] resize-none focus:outline-none focus:border-[#111111]"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !editValue.trim()}
                className="px-5 py-2 bg-[#E8521A] text-white text-[15px] font-medium rounded-lg hover:bg-[#D4491A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Finding...' : 'Find my order'}
              </button>
              <button
                onClick={handleCancel}
                className="text-[14px] text-[#6B6B67] hover:text-[#111111]"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p className="text-[14px] text-[#DC2626]">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
