
import React, { useRef, useState, useEffect } from 'react';
import { AppState, AspectRatio } from '../types';

interface ViewfinderOverlayProps {
  aspectRatio: AspectRatio;
  locationName: string;
  isDetecting: boolean;
  appState: AppState;
  mapCenter: { lat: number; lng: number } | null;
}

const RATIO_MAP: Record<string, [number, number]> = {
  '1:1': [1, 1], '4:3': [4, 3], '3:4': [3, 4],
  '3:2': [3, 2], '2:3': [2, 3], '16:9': [16, 9], '9:16': [9, 16],
};

const BEZ_T = 52;
const BEZ_B = 44;
const BEZ_S = 42;
const CAM_R = 14;
const VF_R = 7;
const BKT = 16;
const VPAD = 52;
const HPAD = 52;

// Frosted glass indigo palette
const GLASS_BG = 'rgba(238,240,255,0.5)';
const GLASS_BORDER = 'rgba(99,102,241,0.28)';
const TEXT_LABEL = 'rgba(99,102,241,0.55)';   // indigo-600 dimmed (small caps)
const TEXT_VALUE = 'rgba(55,48,163,0.80)';     // indigo-900 (values)
const ACCENT = '#6366F1';                  // indigo-500
const ACCENT_GEN = '#818CF8';                  // indigo-400 (generating)

const bezelStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute',
  background: GLASS_BG,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  ...extra,
});

const ViewfinderOverlay: React.FC<ViewfinderOverlayProps> = ({
  aspectRatio, locationName, isDetecting, appState, mapCenter,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      if (ref.current) setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const [aw, ah] = RATIO_MAP[aspectRatio] ?? [4, 3];
  const frameAspect = aw / ah;

  const maxW = size.w - (HPAD + BEZ_S) * 2;
  const maxH = size.h - (VPAD + BEZ_T) - (VPAD + BEZ_B);

  let fw: number, fh: number;
  if (frameAspect > maxW / maxH) {
    fw = Math.round(maxW);
    fh = Math.round(fw / frameAspect);
  } else {
    fh = Math.round(maxH);
    fw = Math.round(fh * frameAspect);
  }

  const fl = Math.round((size.w - fw) / 2);
  const ft = Math.round((size.h - fh) / 2);
  const fr = fl + fw;
  const fb = ft + fh;
  const cx = fl + fw / 2;
  const cy = ft + fh / 2;

  const camL = fl - BEZ_S;
  const camT = ft - BEZ_T;
  const camR = fr + BEZ_S;
  const camB = fb + BEZ_B;
  const camW = camR - camL;
  const camH = camB - camT;

  const isGen = appState === AppState.GENERATING;
  const accent = isGen ? ACCENT_GEN : ACCENT;

  const mono: React.CSSProperties = { fontFamily: 'ui-monospace,monospace' };

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-[500]"
      style={{ pointerEvents: 'none' }}
      data-html2canvas-ignore="true"
    >
      {size.w > 0 && (<>

        {/* ── Frosted bezel strips ── */}

        {/* Top */}
        <div style={bezelStyle({
          left: camL, top: camT, width: camW, height: BEZ_T,
          borderRadius: `${CAM_R}px ${CAM_R}px 0 0`,
          borderTop: `1px solid ${GLASS_BORDER}`,
          borderLeft: `1px solid ${GLASS_BORDER}`,
          borderRight: `1px solid ${GLASS_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 ${BEZ_S + 4}px`,
        })}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...mono, fontSize: 8, color: TEXT_LABEL, letterSpacing: '0.18em' }}>GEO CAM</span>
            <span style={{ ...mono, fontSize: 11, color: TEXT_VALUE, letterSpacing: '0.06em' }}>f/2.8 · ISO 400</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ ...mono, fontSize: 8, color: TEXT_LABEL, letterSpacing: '0.20em' }}>PHOTO</span>
            <span style={{ ...mono, fontSize: 11, color: TEXT_VALUE, letterSpacing: '0.06em' }}>1/125s</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ ...mono, fontSize: 8, color: TEXT_LABEL, letterSpacing: '0.18em' }}>FRAME</span>
            <span style={{ ...mono, fontSize: 11, color: TEXT_VALUE, letterSpacing: '0.06em' }}>001/036</span>
          </div>
        </div>

        {/* Bottom */}
        <div style={bezelStyle({
          left: camL, top: camB - BEZ_B, width: camW, height: BEZ_B,
          borderRadius: `0 0 ${CAM_R}px ${CAM_R}px`,
          borderBottom: `1px solid ${GLASS_BORDER}`,
          borderLeft: `1px solid ${GLASS_BORDER}`,
          borderRight: `1px solid ${GLASS_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 ${BEZ_S + 4}px`,
        })}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'block', width: 6, height: 6, borderRadius: '50%',
              backgroundColor: isGen ? '#818CF8' : 'rgba(239,68,68,0.75)',
            }} className={isGen ? 'animate-pulse' : ''} />
            <span style={{
              ...mono, fontSize: 10, letterSpacing: '0.10em',
              color: isGen ? '#818CF8' : 'rgba(239,68,68,0.65)'
            }}>
              {isGen ? 'GEN' : 'LIVE'}
            </span>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isDetecting ? (
              <>
                <span className="animate-pulse" style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                <span style={{ ...mono, fontSize: 10, color: 'rgba(100,116,139,0.70)', letterSpacing: '0.12em' }}>LOCATING</span>
              </>
            ) : locationName ? (
              <>
                <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', backgroundColor: ACCENT }} />
                <span style={{ ...mono, fontSize: 11, color: TEXT_VALUE, letterSpacing: '0.07em', fontWeight: 600 }}>
                  {locationName.toUpperCase()}
                </span>
              </>
            ) : mapCenter ? (
              <span style={{ ...mono, fontSize: 10, color: 'rgba(100,116,139,0.60)', letterSpacing: '0.06em' }}>
                {Math.abs(mapCenter.lat).toFixed(3)}°{mapCenter.lat >= 0 ? 'N' : 'S'}&nbsp;·&nbsp;{Math.abs(mapCenter.lng).toFixed(3)}°{mapCenter.lng >= 0 ? 'E' : 'W'}
              </span>
            ) : null}
          </div>

          <span style={{ ...mono, fontSize: 11, color: TEXT_VALUE, letterSpacing: '0.07em' }}>
            {aspectRatio}
          </span>
        </div>

        {/* Left */}
        <div style={bezelStyle({
          left: camL, top: camT + BEZ_T,
          width: BEZ_S, height: camH - BEZ_T - BEZ_B,
          borderLeft: `1px solid ${GLASS_BORDER}`,
        })} />

        {/* Right */}
        <div style={bezelStyle({
          left: camR - BEZ_S, top: camT + BEZ_T,
          width: BEZ_S, height: camH - BEZ_T - BEZ_B,
          borderRight: `1px solid ${GLASS_BORDER}`,
        })} />

        {/* ── Blur outside camera frame — single div, evenodd clip-path, no seams ── */}
      {(() => {
        const r = CAM_R;
        const W = size.w, H = size.h;
        // Outer: full screen rectangle
        const outer = `M 0 0 H ${W} V ${H} H 0 Z`;
        // Inner: rounded rect matching camera frame exactly (evenodd cuts it out)
        const inner = [
          `M ${camL + r} ${camT}`,
          `H ${camR - r}`,
          `A ${r} ${r} 0 0 1 ${camR} ${camT + r}`,
          `V ${camB - r}`,
          `A ${r} ${r} 0 0 1 ${camR - r} ${camB}`,
          `H ${camL + r}`,
          `A ${r} ${r} 0 0 1 ${camL} ${camB - r}`,
          `V ${camT + r}`,
          `A ${r} ${r} 0 0 1 ${camL + r} ${camT}`,
          `Z`,
        ].join(' ');
        return (
          <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            clipPath: `path(evenodd, "${outer} ${inner}")`,
          }} />
        );
      })()}

      {/* ── Viewfinder glass tint (no blur, clear like glass) ── */}
      <div style={{
        position: 'absolute',
        left: fl, top: ft, width: fw, height: fh,
        borderRadius: VF_R,
        background: 'rgba(186,210,255,0.10)',
      }} />

      {/* ── SVG: viewfinder border ring + corner screws ── */}
        <svg width={size.w} height={size.h} style={{ position: 'absolute', inset: 0 }}>
          {/* Subtle inner border strip joining bezels */}
          <line x1={camL + BEZ_S} y1={camT + BEZ_T} x2={fl} y2={ft}
            stroke="none" />

          {/* Viewfinder border ring */}
          <rect x={fl + 0.75} y={ft + 0.75} width={fw - 1.5} height={fh - 1.5} rx={VF_R}
            fill="none"
            stroke={isGen ? 'rgba(129,140,248,0.65)' : 'rgba(99,102,241,0.40)'}
            strokeWidth={1.5} />

          {/* Outer glow on viewfinder */}
          <rect x={fl - 1} y={ft - 1} width={fw + 2} height={fh + 2} rx={VF_R + 1}
            fill="none"
            stroke={isGen ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.08)'}
            strokeWidth={3} />

          {/* Corner screws — subtle on frosted glass */}
          {([[camL + 18, camT + 18], [camR - 18, camT + 18], [camL + 18, camB - 18], [camR - 18, camB - 18]] as [number, number][]).map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill="rgba(99,102,241,0.10)" />
              <circle cx={x} cy={y} r={3.5} fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth={0.8} />
              <line x1={x - 2} y1={y} x2={x + 2} y2={y} stroke="rgba(99,102,241,0.40)" strokeWidth={0.9} />
              <line x1={x} y1={y - 2} x2={x} y2={y + 2} stroke="rgba(99,102,241,0.40)" strokeWidth={0.9} />
            </g>
          ))}

          {/* Top center indicator dot */}
          <circle cx={cx} cy={camT + BEZ_T / 2} r={2.5} fill="rgba(99,102,241,0.50)" />
          <circle cx={cx} cy={camT + BEZ_T / 2} r={5} fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth={1} />
        </svg>

        {/* ── Corner brackets ── */}
        {([
          [fl - 1, ft - 1, BKT, 2],
          [fl - 1, ft - 1, 2, BKT],
          [fr - BKT + 1, ft - 1, BKT, 2],
          [fr - 1, ft - 1, 2, BKT],
          [fl - 1, fb - 1, BKT, 2],
          [fl - 1, fb - BKT + 1, 2, BKT],
          [fr - BKT + 1, fb - 1, BKT, 2],
          [fr - 1, fb - BKT + 1, 2, BKT],
        ] as [number, number, number, number][]).map(([l, t, w, h], i) => (
          <div key={i} className="viewfinder-bracket absolute" style={{
            left: l, top: t, width: w, height: h,
            backgroundColor: accent, transition: 'background-color 0.4s',
          }} />
        ))}

        {/* Center crosshair */}
        <div className="absolute" style={{ left: cx - 12, top: cy, width: 24, height: 1, backgroundColor: 'rgba(99,102,241,0.25)' }} />
        <div className="absolute" style={{ left: cx, top: cy - 12, width: 1, height: 24, backgroundColor: 'rgba(99,102,241,0.25)' }} />

      </>)}
    </div>
  );
};

export default ViewfinderOverlay;
