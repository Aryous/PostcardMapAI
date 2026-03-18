import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Language } from '../types';

interface ApiKeySignpostProps {
  language: Language;
  hasKey: boolean;
  appState: AppState;
  onClick: () => void;
}

type Phase = 'hidden' | 'entering' | 'visible' | 'exiting';

// Label content width (fixed inner panel)
const LABEL_W = 112;
// Swatch width
const SWATCH_W = 26;

const ApiKeySignpost: React.FC<ApiKeySignpostProps> = ({ language, hasKey, appState, onClick }) => {
  const shouldHide = appState === AppState.GENERATING || appState === AppState.COMPLETE;
  const [phase, setPhase] = useState<Phase>('hidden');
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // expanded: label panel visible
  // hasKey=false → always true (no drag)
  // hasKey=true  → starts false (collapsed), drag to expand
  const [expanded, setExpanded] = useState(!hasKey);
  const [hovered, setHovered] = useState(false);

  // Drag mechanics — only active when hasKey=true
  const [isDragging, setIsDragging] = useState(false);
  const [dragW, setDragW] = useState(0);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const didDrag = useRef(false);

  // Sync expansion when key status changes externally
  useEffect(() => {
    setExpanded(!hasKey);
  }, [hasKey]);

  // ── Entry / exit phase machine ───────────────────────────────────────────
  useEffect(() => {
    if (shouldHide) {
      if (phase === 'visible' || phase === 'entering') {
        setPhase('exiting');
      } else {
        if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
        setPhase('hidden');
      }
    } else if (phase === 'hidden') {
      entryTimerRef.current = setTimeout(() => setPhase('entering'), 600);
    }
    return () => { if (entryTimerRef.current) clearTimeout(entryTimerRef.current); };
  }, [shouldHide, phase]);

  // ── Pointer drag handlers ────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!hasKey) return;
    setIsDragging(true);
    didDrag.current = false;
    dragStartX.current = e.clientX;
    dragStartW.current = expanded ? LABEL_W : 0;
    setDragW(dragStartW.current);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [hasKey, expanded]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX.current;
    const clamped = Math.max(0, Math.min(dragStartW.current + delta, LABEL_W));
    setDragW(clamped);
    if (Math.abs(delta) > 5) didDrag.current = true;
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX.current;
    const finalW = Math.max(0, Math.min(dragStartW.current + delta, LABEL_W));
    setIsDragging(false);
    // Snap: >45% of label → expand; <45% → collapse
    setExpanded(finalW > LABEL_W * 0.45);
  }, [isDragging]);

  const handleClick = useCallback(() => {
    if (didDrag.current) { didDrag.current = false; return; }
    // If collapsed and has key, first click expands; second click opens modal
    if (hasKey && !expanded) {
      setExpanded(true);
      return;
    }
    onClick();
  }, [hasKey, expanded, onClick]);

  if (phase === 'hidden') return null;

  const isChinese = language === 'zh';

  // Animation classes: tab-only for hasKey (slides from left), full for !hasKey (rises from below)
  const entryClass = hasKey ? 'signpost-entry-tab' : 'signpost-entry';
  const exitClass  = hasKey ? 'signpost-exit-tab'  : 'signpost-exit';
  const animClass  = phase === 'entering' ? entryClass : phase === 'exiting' ? exitClass : '';

  // Label width: drag overrides, else animate expand/collapse
  const labelW = isDragging ? dragW : (expanded ? LABEL_W : 0);
  const labelTransition = isDragging ? 'none' : 'width 0.42s cubic-bezier(0.16, 1, 0.3, 1)';

  // Show a faint peek on hover when collapsed
  const showPeek = hasKey && !expanded && !isDragging && hovered;
  const peekW = showPeek ? 20 : 0;
  const effectiveLabelW = isDragging ? dragW : (expanded ? LABEL_W : peekW);
  const effectiveTransition = isDragging ? 'none' : 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)';

  // Swatch right border-radius: squared when label is present
  const hasLabelVisible = expanded || isDragging || showPeek;
  const swatchRadius = hasLabelVisible ? '2px 0 0 2px' : (hasKey ? '0 2px 2px 2px' : '2px 0 0 2px');

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setIsDragging(false); }}
      className={`absolute z-[1000] ${animClass}`}
      title={isChinese ? '配置 API Key' : 'Configure API Key'}
      onAnimationEnd={() => {
        if (phase === 'entering') setPhase('visible');
        if (phase === 'exiting') setPhase('hidden');
      }}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        bottom: 40,
        // Tab-mode: flush to left edge; full mode: inset 32px
        left: hasKey ? 0 : 32,
        cursor: (hasKey && !expanded && !isDragging) ? 'ew-resize' : 'pointer',
        touchAction: 'none',
        userSelect: 'none',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.22))',
        transition: 'filter 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* ── Swatch / pull-tab ── */}
        <div
          className={!hasKey ? 'legend-alert-pulse' : ''}
          style={{
            width: SWATCH_W,
            background: hasKey ? '#2a4535' : '#c4892a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            flexShrink: 0,
            borderRadius: swatchRadius,
            minHeight: 44,
            transition: 'border-radius 0.3s ease, background 0.3s ease',
          }}
        >
          {hasKey ? (
            <>
              {/* Key symbol */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="8" cy="11" r="5" stroke="rgba(255,255,255,0.88)" strokeWidth="2.5" fill="none" />
                <path d="M13 11h8M19 11v3" stroke="rgba(255,255,255,0.88)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {/* Chevron pull hint — fades out when expanded */}
              <svg
                width="7" height="7" viewBox="0 0 7 7" fill="none" aria-hidden="true"
                style={{
                  opacity: expanded ? 0 : 0.5,
                  transition: 'opacity 0.3s ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path d="M1.5 2L4 4.5L6.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '4px 3.25px' }}
                />
              </svg>
            </>
          ) : (
            <span style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 13,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
            }}>!</span>
          )}
        </div>

        {/* ── Label panel — animated width reveal ── */}
        <div style={{
          width: effectiveLabelW,
          overflow: 'hidden',
          transition: effectiveTransition,
        }}>
          {/* Fixed-width inner — never reflows during animation */}
          <div style={{
            width: LABEL_W,
            height: '100%',
            padding: '6px 10px 6px 9px',
            background: '#f5f0e6',
            border: `1px solid ${hasKey ? 'rgba(42,69,53,0.28)' : 'rgba(196,137,42,0.55)'}`,
            borderLeft: 'none',
            borderRadius: '0 2px 2px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 3,
            boxSizing: 'border-box',
          }}>
            {/* Atlas legend category */}
            <div style={{
              fontFamily: "'DM Mono','Courier New',monospace",
              fontSize: 7,
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: 'rgba(42,69,53,0.45)',
              lineHeight: 1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              GEMINI
            </div>
            {/* Main label */}
            <div style={{
              fontFamily: "'DM Mono','Courier New',monospace",
              fontSize: isChinese ? 10 : 9,
              fontWeight: 700,
              letterSpacing: isChinese ? '0.06em' : '0.1em',
              color: hasKey ? '#2a4535' : '#8b5e15',
              lineHeight: 1,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {hasKey
                ? (isChinese ? 'API KEY 已配置' : 'API KEY ACTIVE')
                : (isChinese ? '配置 API KEY' : 'SET UP API KEY')}
            </div>
          </div>
        </div>

      </div>
    </button>
  );
};

export default ApiKeySignpost;
