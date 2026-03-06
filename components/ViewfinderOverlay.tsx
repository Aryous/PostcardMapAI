
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

// Camera frame bezel sizes
const BEZ_T = 54;   // top bezel (fits HUD labels)
const BEZ_B = 46;   // bottom bezel
const BEZ_S = 44;   // side bezels
const CAM_R = 14;   // camera outer border-radius
const VF_R = 5;    // viewfinder inner border-radius
const BKT = 16;   // corner bracket arm length
// Screen breathing room outside the camera frame
const VPAD = 52;   // vertical gap (screen edge → camera frame outer)
const HPAD = 52;   // horizontal gap

const GOLD = '#C4A265';
const DIM = 'rgba(196,162,101,0.55)';
const BODY = 'rgba(20,17,14,0.93)';

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

  // Maximum viewfinder area = screen minus padding and bezels on all sides
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

  // Viewfinder position (centered in screen)
  const fl = Math.round((size.w - fw) / 2);
  const ft = Math.round((size.h - fh) / 2);
  const fr = fl + fw;
  const fb = ft + fh;
  const cx = fl + fw / 2;
  const cy = ft + fh / 2;

  // Camera frame outer bounds — ONLY the bezel strip area, NOT the whole screen
  const camL = fl - BEZ_S;
  const camT = ft - BEZ_T;
  const camR = fr + BEZ_S;
  const camB = fb + BEZ_B;
  const camW = camR - camL;
  const camH = camB - camT;

  const isGen = appState === AppState.GENERATING;
  const accent = isGen ? '#818CF8' : GOLD;

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-[500]"
      style={{ pointerEvents: 'none' }}
      data-html2canvas-ignore="true"
    >
      {size.w > 0 && (<>

        {/* ── SVG: camera frame (bezel strips only) with punched viewfinder ── */}
        <svg width={size.w} height={size.h} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            {/* Mask: white = show camera body, black = transparent viewfinder hole */}
            <mask id="cam-mask">
              <rect x={camL} y={camT} width={camW} height={camH} rx={CAM_R} fill="white" />
              <rect x={fl} y={ft} width={fw} height={fh} rx={VF_R} fill="black" />
            </mask>

            {/* Top-to-bottom sheen */}
            <linearGradient id="body-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.015)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.04)" />
            </linearGradient>

            {/* Grip dot texture */}
            <pattern id="grip" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.8" fill="rgba(255,255,255,0.055)" />
            </pattern>

            {/* Drop shadow for the frame */}
            <filter id="cam-shadow" x="-8%" y="-8%" width="116%" height="116%">
              <feDropShadow dx="0" dy="3" stdDeviation="10" floodColor="rgba(0,0,0,0.55)" />
            </filter>
          </defs>

          {/* Shadow behind frame */}
          <rect x={camL} y={camT} width={camW} height={camH} rx={CAM_R}
            fill="rgba(0,0,0,0.0)" filter="url(#cam-shadow)" />

          {/* Camera body base — masked to bezel strips only */}
          <rect x={camL} y={camT} width={camW} height={camH} rx={CAM_R}
            fill={BODY} mask="url(#cam-mask)" />

          {/* Sheen overlay */}
          <rect x={camL} y={camT} width={camW} height={camH} rx={CAM_R}
            fill="url(#body-sheen)" mask="url(#cam-mask)" />

          {/* Right side grip texture */}
          <rect x={camR - BEZ_S + 8} y={camT + BEZ_T + 8} width={BEZ_S - 16} height={camH - BEZ_T - BEZ_B - 16}
            fill="url(#grip)" mask="url(#cam-mask)" />

          {/* Outer edge highlight (catches light top-left) */}
          <rect x={camL + 0.5} y={camT + 0.5} width={camW - 1} height={camH - 1} rx={CAM_R - 0.5}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} mask="url(#cam-mask)" />

          {/* Inner shadow edge */}
          <rect x={camL + 1.5} y={camT + 1.5} width={camW - 3} height={camH - 3} rx={CAM_R - 1.5}
            fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={1} mask="url(#cam-mask)" />

          {/* Horizontal rule below top bezel */}
          <line x1={camL + CAM_R} y1={camT + BEZ_T} x2={camR - CAM_R} y2={camT + BEZ_T}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

          {/* Horizontal rule above bottom bezel */}
          <line x1={camL + CAM_R} y1={camB - BEZ_B} x2={camR - CAM_R} y2={camB - BEZ_B}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

          {/* Light blue tint overlay inside viewfinder */}
          <rect x={fl} y={ft} width={fw} height={fh} rx={VF_R}
            fill="rgba(186,220,255,0.3)" />

          {/* Recessed channel around viewfinder opening — masked so it only shows in bezel area */}
          <rect x={fl - 4} y={ft - 4} width={fw + 8} height={fh + 8} rx={VF_R + 3}
            fill="rgba(0,0,0,0.50)" mask="url(#cam-mask)" />
          <rect x={fl - 2} y={ft - 2} width={fw + 4} height={fh + 4} rx={VF_R + 1}
            fill="rgba(0,0,0,0.35)" mask="url(#cam-mask)" />

          {/* Viewfinder border ring */}
          <rect x={fl + 0.5} y={ft + 0.5} width={fw - 1} height={fh - 1} rx={VF_R - 0.5}
            fill="none"
            stroke={isGen ? 'rgba(129,140,248,0.55)' : 'rgba(196,162,101,0.40)'}
            strokeWidth={1.5} />

          {/* Corner screws */}
          {([[camL + 20, camT + 20], [camR - 20, camT + 20], [camL + 20, camB - 20], [camR - 20, camB - 20]] as [number, number][]).map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={4.5} fill="rgba(0,0,0,0.45)" />
              <circle cx={x} cy={y} r={4} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={0.8} />
              <line x1={x - 2.2} y1={y} x2={x + 2.2} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth={0.9} />
              <line x1={x} y1={y - 2.2} x2={x} y2={y + 2.2} stroke="rgba(255,255,255,0.18)" strokeWidth={0.9} />
            </g>
          ))}

          {/* Top center indicator dot */}
          <circle cx={cx} cy={camT + BEZ_T / 2} r={3}
            fill={isGen ? 'rgba(129,140,248,0.70)' : 'rgba(196,162,101,0.45)'} />
          <circle cx={cx} cy={camT + BEZ_T / 2} r={5.5}
            fill="none" stroke={isGen ? 'rgba(129,140,248,0.20)' : 'rgba(196,162,101,0.12)'} strokeWidth={1} />
        </svg>

        {/* ── Top bezel HUD ── */}
        <div style={{
          position: 'absolute', left: camL, top: camT, width: camW, height: BEZ_T,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 ${BEZ_S + 4}px`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 8, color: 'rgba(196,162,101,0.32)', letterSpacing: '0.18em' }}>GEO CAM</span>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: DIM, letterSpacing: '0.06em' }}>f/2.8 · ISO 400</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 8, color: 'rgba(196,162,101,0.30)', letterSpacing: '0.20em' }}>PHOTO</span>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: DIM, letterSpacing: '0.06em' }}>1/125s</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 8, color: 'rgba(196,162,101,0.32)', letterSpacing: '0.18em' }}>FRAME</span>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: DIM, letterSpacing: '0.06em' }}>001/036</span>
          </div>
        </div>

        {/* ── Bottom bezel HUD ── */}
        <div style={{
          position: 'absolute', left: camL, top: camB - BEZ_B, width: camW, height: BEZ_B,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 ${BEZ_S + 4}px`,
        }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'block', width: 6, height: 6, borderRadius: '50%',
              backgroundColor: isGen ? 'rgba(129,140,248,0.80)' : 'rgba(255,70,70,0.55)',
            }} className={isGen ? 'animate-pulse' : ''} />
            <span style={{
              fontFamily: 'ui-monospace,monospace', fontSize: 10, letterSpacing: '0.10em',
              color: isGen ? 'rgba(129,140,248,0.70)' : 'rgba(255,70,70,0.45)'
            }}>
              {isGen ? 'GEN' : 'LIVE'}
            </span>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isDetecting ? (
              <>
                <span className="animate-pulse" style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em' }}>LOCATING</span>
              </>
            ) : locationName ? (
              <>
                <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', backgroundColor: GOLD }} />
                <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: 'rgba(216,190,145,0.92)', letterSpacing: '0.07em', fontWeight: 600 }}>
                  {locationName.toUpperCase()}
                </span>
              </>
            ) : mapCenter ? (
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, color: 'rgba(255,255,255,0.26)', letterSpacing: '0.06em' }}>
                {Math.abs(mapCenter.lat).toFixed(3)}°{mapCenter.lat >= 0 ? 'N' : 'S'}&nbsp;·&nbsp;{Math.abs(mapCenter.lng).toFixed(3)}°{mapCenter.lng >= 0 ? 'E' : 'W'}
              </span>
            ) : null}
          </div>

          {/* Aspect ratio */}
          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: DIM, letterSpacing: '0.07em' }}>
            {aspectRatio}
          </span>
        </div>

        {/* ── Corner brackets on viewfinder ── */}
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
        <div className="absolute" style={{ left: cx - 12, top: cy, width: 24, height: 1, backgroundColor: 'rgba(196,162,101,0.18)' }} />
        <div className="absolute" style={{ left: cx, top: cy - 12, width: 1, height: 24, backgroundColor: 'rgba(196,162,101,0.18)' }} />

      </>)}
    </div>
  );
};

export default ViewfinderOverlay;
