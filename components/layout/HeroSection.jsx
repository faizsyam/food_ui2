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
    <section className="relative flex items-center justify-center min-h-[calc(100vh-56px)] overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[#FFF9F5]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E8521A]/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E8521A]/[0.03] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0EA] border border-[#E8521A]/10 text-[#E8521A] text-[13px] font-medium mb-6">
          <Sparkles size={14} />
          AI-powered food ordering
        </div>
        <h1 className="text-[36px] sm:text-[44px] font-bold text-[#1A120D] leading-[1.15] tracking-tight">
          Order food for everyone,{' '}
          <span className="text-[#E8521A]">your way.</span>
        </h1>
        <p className="text-[18px] text-[#5C4F48] mt-4 leading-relaxed max-w-lg mx-auto">
          Describe what you want — who's eating, dietary needs, budget, timing. We'll build the perfect order from real restaurants near you.
        </p>
        <div className="mt-10">
          {children}
        </div>
      </div>
    </section>
  );
}
