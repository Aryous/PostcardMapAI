
import React, { useState } from 'react';

interface LuckyDiceProps {
  onLucky: () => void;
  isLoading: boolean;
  label?: string;
}

const LuckyDice: React.FC<LuckyDiceProps> = ({ onLucky, isLoading, label }) => {
  const [snapAngle, setSnapAngle] = useState<number | null>(null);

  const handleClick = () => {
    if (isLoading) return;
    onLucky();
  };

  const handleMouseEnter = () => {
    if (!isLoading) {
      setSnapAngle(Math.floor(Math.random() * 360));
    }
  };

  const handleMouseLeave = () => {
    setSnapAngle(null);
  };

  const needleClass = isLoading
    ? 'compass-needle animate-spin-compass'
    : snapAngle !== null
    ? 'compass-needle'
    : 'compass-needle animate-wobble-compass';

  const needleStyle =
    snapAngle !== null && !isLoading
      ? { transform: `rotate(${snapAngle}deg)`, transition: 'transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)' }
      : {};

  return (
    <div
      className="absolute bottom-10 right-8 z-[1000] flex flex-col items-center gap-3 cursor-pointer group"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="compass-body">
        <span className="compass-label compass-n">N</span>
        <span className="compass-label compass-s">S</span>
        <span className="compass-label compass-e">E</span>
        <span className="compass-label compass-w">W</span>
        <div className="compass-needle-wrap">
          <div className={needleClass} style={needleStyle} />
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
