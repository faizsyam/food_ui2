import React from 'react';

const STEPS = [
  {
    title: 'Describe your order',
    body: "Tell us what you want in plain language — who's eating, dietary needs, budget, timing.",
  },
  {
    title: 'We find your options',
    body: 'Our system reads your request and builds tailored order options from real restaurants.',
  },
  {
    title: 'Review and confirm',
    body: 'Adjust quantities, swap variants, and review everything in one clean view before checkout.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mt-20 sm:mt-24 pb-20 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start gap-0 sm:gap-6">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.title}>
              <div className="flex-1 flex items-start gap-3 py-4 sm:py-0">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#E8521A]/10 text-[#E8521A] flex items-center justify-center text-[13px] font-semibold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111111]">{step.title}</h3>
                  <p className="text-[14px] text-[#6B6B67] mt-1 leading-relaxed">{step.body}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="hidden sm:block w-px h-16 bg-[#EFEFED] self-center" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
