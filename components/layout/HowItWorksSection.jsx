import React from 'react';
import { MessageSquareText, CookingPot, ClipboardCheck } from 'lucide-react';

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Describe your order',
    body: "Tell us what you want in plain language — who's eating, dietary needs, budget, timing.",
    stepLabel: '01',
  },
  {
    icon: CookingPot,
    title: 'We find your options',
    body: 'Our system reads your request and builds tailored order options from real restaurants.',
    stepLabel: '02',
  },
  {
    icon: ClipboardCheck,
    title: 'Review and confirm',
    body: 'Adjust quantities, swap variants, and review everything in one clean view before checkout.',
    stepLabel: '03',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mt-20 sm:mt-24 pb-20 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-[10px] font-bold text-[#9C8E84] uppercase tracking-[0.2em] mb-3">How it works</span>
          <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1A120D] leading-tight tracking-tight">
            Three simple steps to your perfect meal
          </h2>
          <p className="text-[15px] text-[#5C4F48] mt-2.5 max-w-lg mx-auto">
            From a quick sentence to a complete order in seconds.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative bg-white rounded-2xl p-6 border border-[#F0E8E2]/80 shadow-soft
                  hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FFF0EA]/70 flex items-center justify-center mb-4
                  group-hover:bg-[#FFF0EA] transition-colors duration-300">
                  <Icon size={20} className="text-[#E8521A]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-bold text-[#1A120D] mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[14px] text-[#5C4F48] leading-relaxed">{step.body}</p>
                <span className="absolute top-5 right-5 text-[32px] font-bold text-[#F0E8E2]/60 leading-none select-none">
                  {step.stepLabel}
                </span>
 embedding  {index === 0 && (
                    <span className="text-[11px] text-[#DC2626]"></span>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}