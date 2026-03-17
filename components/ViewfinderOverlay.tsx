
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
const VPAD = 52;
const HPAD = 52;

// Cartographic editorial palette
const GLASS_BG   = 'rgba(248,243,232,0.42)';
const GLASS_BORDER = 'rgba(42,69,53,0.20)';
const TEXT_LABEL = 'rgba(42,69,53,0.50)';
const TEXT_VALUE = 'rgba(30,24,16,0.82)';
const ACCENT     = '#2a4535';
const ACCENT_GEN = '#c4892a';

const TRANS = '0.38s cubic-bezier(0.4,0,0.2,1)';

/** Format decimal degrees to D°MM′ */
const toDM = (val: number, isLat: boolean): string => {
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  return `${deg}°${String(min).padStart(2, '0')}′${dir}`;
};

const bezelStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute',
  background: GLASS_BG,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  transition: `left ${TRANS}, top ${TRANS}, width ${TRANS}, height ${TRANS}`,
  ...extra,
});

const ViewfinderOverlay: React.FC<ViewfinderOverlayProps> = ({
  aspectRatio, locationName, isDetecting, appState, mapCenter,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Refs for Web Animations API
  const borderRef = useRef<SVGRectElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const trRef = useRef<HTMLDivElement>(null);
  const blRef = useRef<HTMLDivElement>(null);
  const brRef = useRef<HTMLDivElement>(null);
  // Store computed frame dims for use in effects
  const frameSizeRef = useRef({ fw: 0, fh: 0 });

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

  const camL = fl - BEZ_S;
  const camT = ft - BEZ_T;
  const camR = fr + BEZ_S;
  const camB = fb + BEZ_B;
  const camW = camR - camL;
  const camH = camB - camT;

  // Keep frameSizeRef in sync for effects
  frameSizeRef.current = { fw, fh };

  const isGen = appState === AppState.GENERATING;
  const accent = isGen ? ACCENT_GEN : ACCENT;
  const mono: React.CSSProperties = { fontFamily: 'ui-monospace,monospace' };

  // ── Spring-in corner marks + border scan trace on entering REVIEWING ──────
  useEffect(() => {
    if (appState !== AppState.REVIEWING) return;
    const { fw: cfw, fh: cfh } = frameSizeRef.current;
    if (cfw === 0) return;

    // Corner spring animation — staggered
    const corners = [tlRef, trRef, blRef, brRef];
    corners.forEach((r, i) => {
      if (!r.current) return;
      r.current.animate(
        [
          { transform: 'scale(0)',    opacity: '0' },
          { transform: 'scale(1.35)', opacity: '1', offset: 0.45 },
          { transform: 'scale(0.88)',              offset: 0.70 },
          { transform: 'scale(1.06)',              offset: 0.88 },
          { transform: 'scale(1)',    opacity: '1' },
        ],
        { duration: 580, delay: i * 60, easing: 'ease-out', fill: 'both' }
      );
    });

    // SVG border scan trace
    if (!borderRef.current) return;
    const perimeter = 2 * (cfw + cfh);
    borderRef.current.style.strokeDasharray = `${perimeter}`;
    const anim = borderRef.current.animate(
      [{ strokeDashoffset: `${perimeter}` }, { strokeDashoffset: '0' }],
      { duration: 760, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' }
    );
    return () => anim.cancel();
  }, [appState]);

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-[500]"
      style={{ pointerEvents: 'none' }}
      data-html2canvas-ignore="true"
    >
      {size.w > 0 && (<>

        {/* ── Frosted bezel strips ── */}

        {/* Top bezel — Survey Instrument + coordinates */}
        <div style={bezelStyle({
          left: camL, top: camT, width: camW, height: BEZ_T,
          borderRadius: `${CAM_R}px ${CAM_R}px 0 0`,
          borderTop:   `1px solid ${GLASS_BORDER}`,
          borderLeft:  `1px solid ${GLASS_BORDER}`,
          borderRight: `1px solid ${GLASS_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 ${BEZ_S + 4}px`,
        })}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...mono, fontSize: 7.5, color: TEXT_LABEL, letterSpacing: '0.20em', textTransform: 'uppercase' }}>
              Map Area
            </span>
            <span style={{ ...mono, fontSize: 11, color: TEXT_VALUE, letterSpacing: '0.04em', fontWeight: 500 }}>
              {mapCenter
                ? `${toDM(mapCenter.lat, true)} · ${toDM(mapCenter.lng, false)}`
                : '—°——′ · —°——′'}
            </span>
          </div>
        </div>

        {/* Bottom bezel — Status + location + ratio */}
        <div style={bezelStyle({
          left: camL, top: camB - BEZ_B, width: camW, height: BEZ_B,
          borderRadius: `0 0 ${CAM_R}px ${CAM_R}px`,
          borderBottom: `1px solid ${GLASS_BORDER}`,
          borderLeft:   `1px solid ${GLASS_BORDER}`,
          borderRight:  `1px solid ${GLASS_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `0 ${BEZ_S + 4}px`,
        })}>
          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'block', width: 5.5, height: 5.5, borderRadius: '50%',
              backgroundColor: isGen ? ACCENT_GEN : 'rgba(239,68,68,0.75)',
            }} className={isGen ? 'animate-pulse' : ''} />
            <span style={{
              ...mono, fontSize: 9, letterSpacing: '0.12em',
              color: isGen ? ACCENT_GEN : 'rgba(239,68,68,0.65)'
            }}>
              {isGen ? 'GEN' : 'LIVE'}
            </span>
          </div>

          {/* Location display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {isDetecting ? (
              <>
                <span className="animate-pulse" style={{ display: 'block', width: 4.5, height: 4.5, borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                <span style={{ ...mono, fontSize: 9, color: 'rgba(100,116,139,0.70)', letterSpacing: '0.12em' }}>LOCATING</span>
              </>
            ) : locationName ? (
              <>
                <span style={{ display: 'block', width: 4.5, height: 4.5, borderRadius: '50%', backgroundColor: accent }} />
                <span style={{ ...mono, fontSize: 10.5, color: TEXT_VALUE, letterSpacing: '0.07em', fontWeight: 600 }}>
                  {locationName.toUpperCase()}
                </span>
              </>
            ) : mapCenter ? (
              <span style={{ ...mono, fontSize: 9, color: 'rgba(100,116,139,0.55)', letterSpacing: '0.06em' }}>
                SURVEY READY
              </span>
            ) : null}
          </div>

          <span style={{ ...mono, fontSize: 10.5, color: TEXT_VALUE, letterSpacing: '0.08em' }}>
            {aspectRatio}
          </span>
        </div>

        {/* Side bezels */}
        <div style={bezelStyle({
          left: camL, top: camT + BEZ_T,
          width: BEZ_S, height: camH - BEZ_T - BEZ_B,
          borderLeft: `1px solid ${GLASS_BORDER}`,
        })} />
        <div style={bezelStyle({
          left: camR - BEZ_S, top: camT + BEZ_T,
          width: BEZ_S, height: camH - BEZ_T - BEZ_B,
          borderRight: `1px solid ${GLASS_BORDER}`,
        })} />

        {/* ── Blur outside camera frame ── */}
        {(() => {
          const r = CAM_R;
          const W = size.w, H = size.h;
          const outer = `M 0 0 H ${W} V ${H} H 0 Z`;
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
              transition: `clip-path ${TRANS}`,
            }} />
          );
        })()}

        {/* ── Viewfinder glass tint ── */}
        <div style={{
          position: 'absolute',
          left: fl, top: ft, width: fw, height: fh,
          borderRadius: VF_R,
          background: 'rgba(42,69,53,0.03)',
          transition: `left ${TRANS}, top ${TRANS}, width ${TRANS}, height ${TRANS}`,
        }} />

        {/* ── Generating scan beam (@property animated) ── */}
        {isGen && (
          <div
            style={{
              position: 'absolute',
              left: fl, top: ft, width: fw, height: fh,
              overflow: 'hidden',
              borderRadius: VF_R,
              // @property --vf-h used by .vf-scan-beam transform
              '--vf-h': `${fh}`,
            } as React.CSSProperties}
          >
            <div className="vf-scan-beam" />
          </div>
        )}

        {/* ── SVG: border ring (scan-animatable) + alignment dots ── */}
        <svg width={size.w} height={size.h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Outer glow */}
          <rect rx={VF_R + 1} fill="none"
            stroke={isGen ? 'rgba(196,137,42,0.15)' : 'rgba(42,69,53,0.07)'}
            strokeWidth={4}
            style={{ x: fl - 1.5, y: ft - 1.5, width: fw + 3, height: fh + 3,
              transition: `x ${TRANS}, y ${TRANS}, width ${TRANS}, height ${TRANS}` }} />

          {/* Main border — stroke-dashoffset animated via Web Animations API */}
          <rect
            ref={borderRef}
            rx={VF_R} fill="none"
            stroke={isGen ? 'rgba(196,137,42,0.72)' : 'rgba(42,69,53,0.48)'}
            strokeWidth={1.5}
            style={{
              x: fl + 0.75, y: ft + 0.75, width: fw - 1.5, height: fh - 1.5,
              transition: `x ${TRANS}, y ${TRANS}, width ${TRANS}, height ${TRANS}, stroke 0.4s`,
            }}
          />

          {/* Top-center alignment dot */}
          <circle cx={cx} cy={camT + BEZ_T / 2} r={2} fill="rgba(42,69,53,0.45)" />
          <circle cx={cx} cy={camT + BEZ_T / 2} r={4.5} fill="none" stroke="rgba(42,69,53,0.15)" strokeWidth={0.8} />
        </svg>

        {/* ── Corner L-brackets with spring refs ── */}
        {(() => {
          const BKT = 18;
          const BW = '2.5px';
          const ac = `${BW} solid ${accent}`;
          return [
            { ref: tlRef, style: { left: fl - 1, top: ft - 1, borderTop: ac, borderLeft: ac } },
            { ref: trRef, style: { left: fr - BKT + 1, top: ft - 1, borderTop: ac, borderRight: ac } },
            { ref: blRef, style: { left: fl - 1, top: fb - BKT + 1, borderBottom: ac, borderLeft: ac } },
            { ref: brRef, style: { left: fr - BKT + 1, top: fb - BKT + 1, borderBottom: ac, borderRight: ac } },
          ].map((c, i) => (
            <div
              key={i}
              ref={c.ref}
              className="viewfinder-bracket absolute"
              style={{
                ...c.style,
                width: BKT, height: BKT,
                transition: `border-color 0.4s, left ${TRANS}, top ${TRANS}`,
              }}
            />
          ));
        })()}

        {/* Center crosshair */}
        <div className="absolute" style={{ left: cx - 10, top: ft + fh / 2, width: 20, height: 1, backgroundColor: 'rgba(42,69,53,0.18)' }} />
        <div className="absolute" style={{ left: cx, top: ft + fh / 2 - 10, width: 1, height: 20, backgroundColor: 'rgba(42,69,53,0.18)' }} />

      </>)}
    </div>
  );
};

export default ViewfinderOverlay;
