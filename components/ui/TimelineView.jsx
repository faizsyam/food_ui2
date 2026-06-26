import { useMemo } from 'react';

export default function TimelineView({ slots = [], renderSlotCard, getTimeKey }) {
  const grouped = useMemo(() => {
    const map = new Map();

    for (const slot of slots) {
      const key = getTimeKey ? getTimeKey(slot) : slot.deliveryTime;
      const label = key ?? 'ASAP';
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label).push(slot);
    }

    const entries = Array.from(map.entries());
    const sortedEntries = entries.sort((a, b) => {
      const isNullA = !a[0] || a[0] === 'ASAP';
      const isNullB = !b[0] || b[0] === 'ASAP';
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1;
      if (isNullB) return -1;
      return new Date(a[0]) - new Date(b[0]);
    });

    return sortedEntries.map(([time, items]) => ({
      time: time === 'ASAP' && !slots.some((s) => (getTimeKey ? getTimeKey(s) : s.deliveryTime) === null)
        ? 'ASAP'
        : time,
      displayTime: time ?? 'ASAP',
      items,
    }));
  }, [slots, getTimeKey]);

  return (
    <div className="flex gap-4">
      {/* Desktop timeline axis */}
      <div className="hidden md:flex flex-col items-center" style={{ width: 80, flexShrink: 0 }}>
        {grouped.map((group, index) => (
          <div key={group.displayTime + index} className="flex flex-col items-center" style={{ minHeight: 60 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#E8521A',
                marginTop: 6,
              }}
            />
            <span className="mt-1 text-center" style={{ fontSize: 13, color: '#6B6B67' }}>
              {group.displayTime}
            </span>
          </div>
        ))}
      </div>

      {/* Cards container */}
      <div className="flex-1 flex flex-col gap-4">
        {grouped.map((group) => (
          <div key={group.displayTime}>
            {/* Mobile time label */}
            <div className="md:hidden" style={{ fontSize: 13, color: '#6B6B67', marginBottom: 8 }}>
              {group.displayTime}
            </div>
            <div className="flex flex-col gap-3">
              {group.items.map((slot, idx) =>
                renderSlotCard ? (
                  <div key={idx}>{renderSlotCard(slot)}</div>
                ) : (
                  <div key={idx}>{JSON.stringify(slot)}</div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
