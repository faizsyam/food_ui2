import React from 'react';

export default function GroupContainer({ group, children }) {
  if (!group) {
    return <div>{children}</div>;
  }

  const sharedEntries =
    group.shared && typeof group.shared === 'object'
      ? Object.entries(group.shared).filter(([, v]) => Boolean(v))
      : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-[#9A9A96] whitespace-nowrap">
          {group.label || 'Group'}
        </span>
        <div className="flex-1 h-px bg-[#EFEFED]" />
      </div>
      {sharedEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sharedEntries.map(([key]) => (
            <span
              key={key}
              className="text-[12px] text-[#6B6B67] bg-[#F7F7F5] rounded-full px-2.5 py-0.5"
            >
              Shared {key}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
