
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface LuckyDiceProps {
  onLucky: () => void;
  isLoading: boolean;
  label?: string;
}

const STIFFNESS = 0.10;
const DAMPING   = 0.52;

const LuckyDice: React.FC<LuckyDiceProps> = ({ onLucky, isLoading, label }) => {
  // true while mouse is over (spring running toward random target)
  // false when spring has fully returned to 0 (wobble CSS re-activates)
  const [springActive, setSpringActive] = useState(false);

  const needleRef   = useRef<HTMLDivElement | null>(null);
  const angleRef    = useRef(0);
  const velocityRef = useRef(0);
  const targetRef   = useRef(0);
  const rafRef      = useRef<number | null>(null);
  const returningRef = useRef(false);   // true = animating back to 0

  // Spring tick — stored in a ref so it's always current inside RAF
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    velocityRef.current += (targetRef.current - angleRef.current) * STIFFNESS;
    velocityRef.current *= DAMPING;
    angleRef.current    += velocityRef.current;

    if (needleRef.current) {
      needleRef.current.style.transform = `rotate(${angleRef.current}deg)`;
    }

    const settled =
      Math.abs(velocityRef.current) < 0.05 &&
      Math.abs(targetRef.current - angleRef.current) < 0.1;

    if (!settled) {
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    } else if (returningRef.current) {
      // Fully back to north — hand control back to CSS wobble animation
      angleRef.current    = 0;
      velocityRef.current = 0;
      returningRef.current = false;
      if (needleRef.current) needleRef.current.style.transform = '';
      setSpringActive(false);
    }
  };

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleMouseEnter = useCallback(() => {
    if (isLoading) return;
    returningRef.current = false;
    targetRef.current    = Math.floor(Math.random() * 360);
    setSpringActive(true);
    stopRaf();
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [isLoading]);

  const handleMouseLeave = useCallback(() => {
    if (isLoading) return;
    returningRef.current = true;
    targetRef.current    = 0;
    stopRaf();
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [isLoading]);

  // Cleanup on unmount
  useEffect(() => () => stopRaf(), []);

  const needleClass = isLoading
    ? 'compass-needle animate-spin-compass'
    : springActive
    ? 'compass-needle'                     // JS-driven; no CSS animation
    : 'compass-needle animate-wobble-compass';

  return (
    <div
      className="absolute bottom-10 right-8 z-[1000] flex flex-col items-center gap-3 cursor-pointer group"
      onClick={() => { if (!isLoading) onLucky(); }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      <div className="compass-body">
        <span className="compass-label compass-n">N</span>
        <span className="compass-label compass-s">S</span>
        <span className="compass-label compass-e">E</span>
        <span className="compass-label compass-w">W</span>
        <div className="compass-needle-wrap">
          <div className={needleClass} ref={needleRef} />
        </div>
        <div className="compass-pin" />
      </div>

      <div
        className={`text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full shadow-lg ring-1 ring-white/10 transition-all duration-300 transform group-hover:scale-110 group-hover:bg-indigo-600/80 group-hover:ring-indigo-400/30 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {label || 'Explore'}
      </div>
    </div>
  );
};

export default LuckyDice;
