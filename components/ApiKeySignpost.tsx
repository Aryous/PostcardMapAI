import React, { useEffect, useRef, useState } from 'react';
import { AppState, Language } from '../types';

interface ApiKeySignpostProps {
  language: Language;
  hasKey: boolean;
  appState: AppState;
}

type Phase = 'hidden' | 'entering' | 'visible' | 'exiting';

const ApiKeySignpost: React.FC<ApiKeySignpostProps> = ({ language, hasKey, appState }) => {
  const shouldHide = hasKey || appState === AppState.GENERATING || appState === AppState.COMPLETE;
  const [phase, setPhase] = useState<Phase>('hidden');
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (shouldHide) {
      // If currently visible or entering, trigger exit
      if (phase === 'visible' || phase === 'entering') {
        setPhase('exiting');
      } else {
        // Cancel pending entry timer
        if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
        setPhase('hidden');
      }
    } else {
      // Should show — start entry delay only if currently hidden
      if (phase === 'hidden') {
        entryTimerRef.current = setTimeout(() => {
          setPhase('entering');
        }, 1500);
      }
    }
    return () => {
      if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
    };
  }, [shouldHide, phase]);

  const handleAnimationEnd = () => {
    if (phase === 'entering') setPhase('visible');
    if (phase === 'exiting') setPhase('hidden');
  };

  if (phase === 'hidden') return null;

  const animClass =
    phase === 'entering' ? 'signpost-entry' :
    phase === 'exiting'  ? 'signpost-exit'  :
    'signpost-sway';

  const label = language === 'zh' ? '配置 API KEY' : 'SET UP API KEY';

  return (
    <div
      className="absolute z-[1000]"
      style={{ bottom: 24, left: 56 }}
    >
      <svg
        width="88"
        height="56"
        viewBox="0 0 88 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animClass}
        style={{ transformOrigin: 'bottom center' }}
        onAnimationEnd={handleAnimationEnd}
        aria-hidden="true"
      >
        {/* Vertical post */}
        <rect x="40" y="30" width="6" height="26" rx="1" fill="#8a6a42" />

        {/* Wood plank: arrow shape pointing left (chevron-left tip on left side) */}
        {/* Arrow path: starts at left tip, goes up-right across top, right end, down, back to tip */}
        <path
          d="M8,16 L18,8 L78,8 Q82,8 82,12 L82,24 Q82,28 78,28 L18,28 Z"
          fill="#b8956a"
        />
        {/* Wood grain shadow line */}
        <path
          d="M18,11 L78,11"
          stroke="#9a7a52"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M18,25 L78,25"
          stroke="#9a7a52"
          strokeWidth="0.8"
          opacity="0.3"
        />

        {/* Label text */}
        <text
          x="48"
          y="21"
          textAnchor="middle"
          fontFamily="'DM Mono', 'Courier New', monospace"
          fontSize="7"
          fontWeight="600"
          letterSpacing="0.8"
          fill="#f8f3e8"
          style={{ textTransform: 'uppercase' }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

export default ApiKeySignpost;
