import { ArrowRight } from 'lucide-react';

export default function HeroSection({ children, isCompact }) {
  if (isCompact) {
    return (
      <section className="bg-white border-b border-[#EFEFED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center w-full">
        <h1 className="text-[32px] font-semibold text-[#111111] leading-tight">
          Order anything, your way.
        </h1>
        <p className="text-[17px] text-[#6B6B67] mt-3 leading-relaxed">
          Describe what you want — for everyone, any cuisine, any time.
        </p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
