import { Sparkles } from 'lucide-react';

export default function HeroSection({ children, isCompact }) {
  if (isCompact) {
    return (
      <section className="bg-white/80 backdrop-blur-sm border-b border-[#F0E8E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex items-center justify-center min-h-[calc(100dvh-56px)] overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 bg-[#FFF9F5]" />
      <div className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] bg-[#E8521A]/[0.035] rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[440px] h-[440px] bg-[#E8521A]/[0.03] rounded-full blur-[120px]" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-[#D97706]/[0.025] rounded-full blur-[100px]" />

      <div className="relative max-w-2xl mx-auto mt-6 px-4 sm:px-6 text-center w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0EA] border border-[#E8521A]/10 text-[#E8521A] text-[13px] font-medium mb-6 animate-fade-in">
          <Sparkles size={14} className="shrink-0" />
          Smart food ordering
        </div>
        <h1 className="text-[32px] sm:text-[40px] font-bold text-[#1A120D] leading-[1.12] tracking-tight text-balance">
          Order food for everyone,{' '}
          <span className="text-[#E8521A]">your way.</span>
        </h1>
        <p className="text-[17px] text-[#5C4F48] mt-4 leading-relaxed max-w-lg mx-auto text-balance">
          Describe what you want — who's eating, dietary needs, budget, timing. We'll build the perfect order from real restaurants near you.
        </p>
        <div className="mt-10">
          {children}
        </div>
      </div>
    </section>
  );
}