import React from 'react';
import { MessageSquareText, CookingPot, ClipboardCheck } from 'lucide-react';

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Describe your order',
    body: "Tell us what you want in plain language — who's eating, dietary needs, budget, timing.",
  },
  {
    icon: CookingPot,
    title: 'We find your options',
    body: 'Our system reads your request and builds tailored order options from real restaurants.',
  },
  {
    icon: ClipboardCheck,
    title: 'Review and confirm',
    body: 'Adjust quantities, swap variants, and review everything in one clean view before checkout.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mt-20 sm:mt-24 pb-20 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1A120D]">How it works</h2>
          <p className="text-[15px] text-[#5C4F48] mt-2">Three simple steps to your perfect meal</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative bg-white rounded-2xl p-6 border border-[#F0E8E2] shadow-card hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E8521A]/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#E8521A]" />
                </div>
                <span className="text-[12px] font-semibold text-[#9C8E84] tracking-wider uppercase mb-1 block">
                  Step {index + 1}
                </span>
                <h3 className="text-[15px] font-semibold text-[#1A120D] mb-2">{step.title}</h3>
                <p className="text-[14px] text-[#5C4F48] leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
