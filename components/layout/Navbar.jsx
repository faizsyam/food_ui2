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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F0E8E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={handleStartOver}
            className="flex items-center gap-1.5 text-[18px] font-bold text-[#E8521A] tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8521A] focus-visible:ring-offset-2 rounded-lg"
          >
            <span className="w-7 h-7 bg-[#E8521A] rounded-lg flex items-center justify-center text-white text-[14px] font-bold">O</span>
            ordr
          </button>

          {view === 'IDLE' && (
            <button
              onClick={handleHowItWorks}
              className="text-[14px] font-medium text-[#5C4F48] hover:text-[#1A120D] transition-colors duration-200"
            >
              How it works
            </button>
          )}

          {(view === 'RESULT' || view === 'CONFIRMED') && (
            <button
              onClick={handleStartOver}
              className="text-[14px] font-medium text-[#5C4F48] hover:text-[#1A120D] transition-colors duration-200"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
