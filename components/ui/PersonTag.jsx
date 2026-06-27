import React from 'react';

const PALETTE = [
  'bg-[#FFF0EA] text-[#C0481A] border-[#E8521A]/20',
  'bg-[#F0F9F4] text-[#198B4E] border-[#22C55E]/20',
  'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6]/20',
  'bg-[#F6F3FF] text-[#7C3AED] border-[#8B5CF6]/20',
  'bg-[#FFF7ED] text-[#C2410C] border-[#F97316]/20',
  'bg-[#F0FDFA] text-[#0D9488] border-[#14B8A6]/20',
];

function keyToPalette(key) {
  if (!key) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function PersonTag({ name, preferences, showPreferences = true }) {
  const prefEntries =
    preferences && typeof preferences === 'object' && showPreferences
      ? Object.entries(preferences)
      : [];

  return (
    <>
      {name !== null && name !== undefined && (
        <span className="text-[14px] font-semibold text-[#1A120D]">
          {name || 'Unknown'}
        </span>
      )}
      {prefEntries.map(([key, value]) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1 border rounded-full font-medium shrink-0
            text-[11px] px-2.5 py-[3px] leading-none ${keyToPalette(key)}`}
        >
          <span className="opacity-70 capitalize">{key}:</span>
          <span className="capitalize font-semibold">{String(value)}</span>
        </span>
      ))}
    </>
  );
}
