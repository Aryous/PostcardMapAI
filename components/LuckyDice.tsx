
import React, { useState } from 'react';

interface LuckyDiceProps {
  onLucky: () => void;
  isLoading: boolean;
  label?: string;
}

const LuckyDice: React.FC<LuckyDiceProps> = ({ onLucky, isLoading, label }) => {
  const [rotation, setRotation] = useState<{x: number, y: number} | null>(null);

  const handleClick = () => {
    if (isLoading) return;
    onLucky();
  };

  const handleMouseEnter = () => {
    if (!isLoading) {
      // Random fixed rotation on hover to break the float loop for a moment
      setRotation({ 
        x: Math.random() * 40 - 20, 
        y: Math.random() * 360 
      });
    }
  };

  const handleMouseLeave = () => {
    setRotation(null); // Return to null to let the CSS float animation take over (or reset)
  };

  return (
    <div 
        className="absolute bottom-10 right-8 z-[1000] flex flex-col items-center gap-3 cursor-pointer group"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
      <div className={`dice-scene ${isLoading ? 'pointer-events-none' : ''}`}>
        <div 
          className={`dice-cube ${isLoading ? 'animate-spin-dice' : (rotation ? '' : 'animate-float-dice')}`}
          style={rotation ? { transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` } : {}}
        >
          {/* Front (1) - Red Dot */}
          <div className="dice-face face-1">
            <div className="dice-dot dot-red"></div>
          </div>
          
          {/* Right (2) */}
          <div className="dice-face face-2 gap-3 flex-col">
            <div className="dice-dot dot-dark transform -translate-x-2 -translate-y-2"></div>
            <div className="dice-dot dot-dark transform translate-x-2 translate-y-2"></div>
          </div>
          
          {/* Back (3) */}
          <div className="dice-face face-3 gap-2">
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
          </div>
          
          {/* Left (4) - Blue Dots maybe? Let's keep dark for classic look */}
          <div className="dice-face face-4 grid grid-cols-2 gap-4 p-4">
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
          </div>
          
          {/* Top (5) */}
          <div className="dice-face face-5 grid grid-cols-2 gap-4 p-4 justify-items-center relative">
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
            <div className="dice-dot dot-dark"></div>
          </div>
          
          {/* Bottom (6) */}
          <div className="dice-face face-6 grid grid-cols-2 gap-x-4 gap-y-2 p-3">
             <div className="dice-dot dot-dark"></div>
             <div className="dice-dot dot-dark"></div>
             <div className="dice-dot dot-dark"></div>
             <div className="dice-dot dot-dark"></div>
             <div className="dice-dot dot-dark"></div>
             <div className="dice-dot dot-dark"></div>
          </div>
        </div>
      </div>
      
      {/* Label Shadow */}
      <div className={`text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
         {label || "Roll Dice"}
      </div>
    </div>
  );
};

export default LuckyDice;
