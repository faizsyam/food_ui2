import React from 'react';

export default function Navbar({ view, onStartOver }) {
  const handleHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartOver = () => {
    if (onStartOver) onStartOver();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#EFEFED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={handleStartOver}
            className="text-[18px] font-semibold text-[#111111] tracking-[-0.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8521A] focus-visible:ring-offset-2 rounded"
          >
            ordr
          </button>

          {view === 'IDLE' && (
            <button
              onClick={handleHowItWorks}
              className="text-[14px] text-[#6B6B67] hover:text-[#111111] transition-colors duration-150"
            >
              How it works
            </button>
          )}

          {(view === 'RESULT' || view === 'CONFIRMED') && (
            <button
              onClick={handleStartOver}
              className="text-[14px] text-[#6B6B67] hover:text-[#111111] transition-colors duration-150"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
