import React from 'react';

const PALETTE = [
  'bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]',
  'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]',
  'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]',
  'bg-[#F3E5F5] text-[#7B1FA2] border-[#E1BEE7]',
  'bg-[#E0F2F1] text-[#00695C] border-[#B2DFDB]',
  'bg-[#FBE9E7] text-[#BF360C] border-[#FFCCBC]',
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
        <span className="text-[14px] font-semibold text-[#111111]">{name || 'Unknown'}</span>
      )}
      {prefEntries.map(([key, value]) => (
        <span
          key={key}
          className={`inline-flex shrink-0 items-center gap-1 border text-[12px] px-[10px] py-[3px] rounded-full font-medium leading-none whitespace-nowrap ${keyToPalette(key)}`}
        >
          <span className="opacity-60 capitalize">{key}:</span>
          <span className="capitalize">{String(value)}</span>
        </span>
      ))}
    </>
  );
}
