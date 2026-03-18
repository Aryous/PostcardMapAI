
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface LuckyDiceProps {
  onLucky: () => void;
  isLoading: boolean;
  label?: string;
}

const STIFFNESS  = 0.10;
const DAMPING    = 0.52;
const SPIN_DEG   = 4;   // degrees per frame — ~240°/s at 60fps, ~1 rotation/1.5s

const LuckyDice: React.FC<LuckyDiceProps> = ({ onLucky, isLoading, label }) => {
  // springActive=true means JS owns the transform (no CSS animation on needle)
  const [springActive, setSpringActive] = useState(false);

  const needleRef    = useRef<HTMLDivElement | null>(null);
  const angleRef     = useRef(0);
  const velocityRef  = useRef(0);
  const targetRef    = useRef(0);
  const rafRef       = useRef<number | null>(null);
  const returningRef = useRef(false);
  const spinningRef  = useRef(false);   // true while JS-driven loading spin is active

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Spring tick — hover wander + return-to-zero
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
      // Fully back to north — hand control to CSS wobble
      angleRef.current    = 0;
      velocityRef.current = 0;
      returningRef.current = false;
      if (needleRef.current) needleRef.current.style.transform = '';
      setSpringActive(false);
    }
  };

  // Spin tick — continuous rotation from current angle (no snap on loading start)
  const spinTickRef = useRef<() => void>(() => {});
  spinTickRef.current = () => {
    if (!spinningRef.current) return;
    angleRef.current = (angleRef.current + SPIN_DEG) % 360;
    if (needleRef.current) {
      needleRef.current.style.transform = `rotate(${angleRef.current}deg)`;
    }
    rafRef.current = requestAnimationFrame(() => spinTickRef.current());
  };

  // Respond to isLoading changes — replaces CSS animation switching
  useEffect(() => {
    if (isLoading) {
      stopRaf();
      spinningRef.current  = true;
      returningRef.current = false;
      setSpringActive(true);   // suppress CSS wobble
      rafRef.current = requestAnimationFrame(() => spinTickRef.current());
    } else {
      spinningRef.current = false;
      stopRaf();
      // Spring back to north then release to CSS wobble
      returningRef.current = true;
      targetRef.current    = 0;
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    }
  }, [isLoading]);

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

  useEffect(() => () => stopRaf(), []);

  // JS-driven whenever springActive (hover, return, or loading spin)
  // CSS wobble only at rest
  const needleClass = springActive
    ? 'compass-needle'
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
        className={`text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full shadow-lg ring-1 ring-white/10 transition-all duration-300 transform group-hover:scale-110 group-hover:bg-[#2a4535]/90 group-hover:ring-[#2a4535]/30 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {label || 'Explore'}
      </div>
    </div>
  );
};

export default LuckyDice;
