import { Users } from 'lucide-react';

export default function SharedRequirementsBar({ requirements = [], warnings = [] }) {
  if (!requirements || requirements.length === 0) return null;

  const hasSubstitutedWarning = warnings.some((w) => w?.code === 'SHARED_ITEM_SUBSTITUTED');

  return (
    <div className="flex gap-4 overflow-auto bg-[#F7F7F5] rounded-lg px-4 py-2.5 mb-4">
      {requirements.map((req) => {
        const slotCount = Array.isArray(req.slot_ids) ? req.slot_ids.length : 0;
        return (
          <div key={req.requirement_id || req.label} className="flex items-center gap-1.5 whitespace-nowrap text-[13px] text-[#6B6B67]">
            <Users size={16} strokeWidth={1.5} />
            <span>{req.label}</span>
            <span className="relative">
              <span className="font-semibold">{slotCount} people</span>
              {hasSubstitutedWarning && (
                <span className="absolute -top-0.5 -right-1.5 w-2 h-2 bg-[#D97706] rounded-full" />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
