
import React, { useState, useEffect } from 'react';

interface FlipUnitProps {
  value: string;
  label: string;
}

const FlipUnit: React.FC<FlipUnitProps> = ({ value, label }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
        setPrevValue(value);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 w-1/4 max-w-[200px] aspect-[4/5] min-w-[70px]">
      <div className="relative w-full h-full flip-container rounded-lg md:rounded-xl overflow-hidden shadow-2xl">
        {/* Static Background Cards */}
        <div className="absolute inset-0 bg-[#121212] flex flex-col">
          <div className="h-1/2 w-full border-b border-black/30 flex items-end justify-center overflow-hidden">
            <span className="translate-y-1/2 text-white font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl leading-none">
              {value}
            </span>
          </div>
          <div className="h-1/2 w-full flex items-start justify-center overflow-hidden">
            <span className="-translate-y-1/2 text-white font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl leading-none">
              {prevValue}
            </span>
          </div>
        </div>

        {/* The Flip animation layer */}
        {isFlipping && (
          <>
            <div className="flip-top absolute top-0 left-0 w-full h-1/2 bg-[#121212] border-b border-black/30 flex items-end justify-center overflow-hidden flip-animate-top z-20">
              <span className="translate-y-1/2 text-white font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl leading-none">
                {prevValue}
              </span>
            </div>
            <div className="flip-bottom absolute bottom-0 left-0 w-full h-1/2 bg-[#121212] flex items-start justify-center overflow-hidden flip-animate-bottom z-30">
              <span className="-translate-y-1/2 text-white font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl leading-none">
                {value}
              </span>
            </div>
          </>
        )}

        {/* Center Hinge Line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/50 z-40"></div>
      </div>
      <span className="text-[10px] md:text-xs text-white/20 uppercase tracking-[0.2em] font-medium hidden sm:block">
        {label}
      </span>
    </div>
  );
};

export default FlipUnit;
