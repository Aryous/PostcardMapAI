
import React, { useState, useEffect } from 'react';
import { X, Zap, Sparkles, DollarSign } from 'lucide-react';
import { HistoryItem, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { STYLE_DEFS } from '../utils/styles';

// Deterministic rotation per slot index
const SLOT_ROTATIONS = [-2.2, 1.6, -1.7, 2.4, -1.1, 1.9, -2.6, 1.3, -1.4, 2.1, -0.8, 2.0];

// ── Metallic ring clamp ─────────────────────────────────────────────────────
const Ring = () => (
  <div style={{
    position: 'relative',
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'conic-gradient(from 200deg, #3d2308 0deg, #8a5a12 50deg, #c89828 95deg, #f0c84a 130deg, #d4a030 165deg, #8a5a12 215deg, #6a4010 260deg, #4a2c08 310deg, #3d2308 360deg)',
    boxShadow: '0 4px 10px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,220,100,0.15)',
    flexShrink: 0,
  }}>
    {/* Inner hole */}
    <div style={{
      position: 'absolute',
      inset: '30%',
      borderRadius: '50%',
      background: '#0a0805',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.95)',
    }} />
  </div>
);

// ── Triangular photo-mount corner ───────────────────────────────────────────
type CornerPos = 'tl' | 'tr' | 'bl' | 'br';
const CLIP: Record<CornerPos, string> = {
  tl: 'polygon(0 0, 100% 0, 0 100%)',
  tr: 'polygon(0 0, 100% 0, 100% 100%)',
  bl: 'polygon(0 0, 0 100%, 100% 100%)',
  br: 'polygon(100% 0, 0 100%, 100% 100%)',
};
const CORNER_POS: Record<CornerPos, React.CSSProperties> = {
  tl: { top: -1, left: -1 },
  tr: { top: -1, right: -1 },
  bl: { bottom: -1, left: -1 },
  br: { bottom: -1, right: -1 },
};

const PhotoCorners = () => (
  <>
    {(['tl', 'tr', 'bl', 'br'] as CornerPos[]).map(pos => (
      <div
        key={pos}
        style={{
          position: 'absolute',
          ...CORNER_POS[pos],
          width: 12,
          height: 12,
          background: 'rgba(196,137,42,0.52)',
          clipPath: CLIP[pos],
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    ))}
  </>
);

// ── Main component ───────────────────────────────────────────────────────────
interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem, originRect: DOMRect) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  language: Language;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Bump this key every time the panel opens to re-trigger card entrance animations
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (isOpen) setOpenKey(k => k + 1);
  }, [isOpen]);

  const getStyleLabel = (styleId: string) => {
    const style = STYLE_DEFS.find(s => s.id === styleId);
    return style?.label[language] ?? styleId;
  };

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14,11,6,0.42)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.32s ease',
        }}
      />

      {/* ── Binder container (handles slide animation) ────────────── */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: 20,
          transform: isOpen
            ? 'translateY(-50%) translateX(0) rotate(0deg)'
            : 'translateY(-50%) translateX(460px) rotate(4deg)',
          transition: isOpen
            ? 'transform 0.52s cubic-bezier(0.34, 1.26, 0.64, 1)'
            : 'transform 0.3s cubic-bezier(0.4, 0, 1, 1)',
          zIndex: 1200,
          width: 400,
          // not overflow:hidden here — lets page-stack layers poke out
        }}
      >
        {/* ── Page-stack depth layers (visible behind the binder) ─── */}
        <div style={{
          position: 'absolute',
          top: 6,
          bottom: 6,
          left: 48,
          right: -5,
          background: 'linear-gradient(to right, #d4ccb8, #ddd5c0)',
          borderRadius: '0 3px 3px 0',
          boxShadow: '3px 0 8px rgba(0,0,0,0.14)',
        }} />
        <div style={{
          position: 'absolute',
          top: 12,
          bottom: 12,
          left: 50,
          right: -9,
          background: '#c8c0ac',
          borderRadius: '0 3px 3px 0',
        }} />

        {/* ── Main binder (spine + page) ─────────────────────────── */}
        <div
          style={{
            display: 'flex',
            height: 'min(860px, 92vh)',
            borderRadius: '3px',
            overflow: 'hidden',
            boxShadow: '0 28px 72px rgba(0,0,0,0.55), 0 10px 28px rgba(0,0,0,0.32), 0 3px 8px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 1,
          }}
        >

          {/* ── Leather spine ──────────────────────────────────────── */}
          <div style={{
            width: 48,
            flexShrink: 0,
            background: 'linear-gradient(105deg, #080604 0%, #160f08 35%, #1e1410 65%, #160f08 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            paddingTop: 28,
            paddingBottom: 28,
            position: 'relative',
          }}>
            {/* Subtle leather grain texture */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='4' height='4' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
              pointerEvents: 'none',
            }} />
            {/* Spine → page boundary glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 1,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(196,137,42,0.2) 15%, rgba(196,137,42,0.5) 40%, rgba(196,137,42,0.65) 50%, rgba(196,137,42,0.5) 60%, rgba(196,137,42,0.2) 85%, transparent 100%)',
            }} />
            <Ring />
            <Ring />
            <Ring />
          </div>

          {/* ── Parchment page ─────────────────────────────────────── */}
          <div style={{
            flex: 1,
            background: '#ede7d5',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // Inset shadow: spine impression on left, subtle depth on top
            boxShadow: 'inset 6px 0 12px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.06)',
          }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{
              background: '#2a4535',
              padding: '15px 18px 15px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              borderBottom: '1px solid rgba(0,0,0,0.18)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 22,
                  color: '#f0e8d0',
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                }}>
                  Collection
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: 'rgba(240,232,208,0.42)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginTop: 5,
                }}>
                  {history.length}&thinsp;{language === 'zh' ? '张明信片' : 'postcards'}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid rgba(240,232,208,0.2)',
                  background: 'transparent',
                  color: 'rgba(240,232,208,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.18s, color 0.18s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,232,208,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#f0e8d0';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(240,232,208,0.5)';
                }}
              >
                <X size={12} />
              </button>
            </div>

            {/* ── Scrollable card grid ─────────────────────────── */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '22px 16px 22px 18px',
              minHeight: 0,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(196,137,42,0.3) transparent',
            }}>
              {history.length === 0 ? (

                /* ── Empty state ─────────────────────────────────── */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: 240,
                  gap: 16,
                }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontSize: 56,
                    color: 'rgba(42,69,53,0.1)',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}>∅</div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: 'rgba(30,24,16,0.36)',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                  }}>
                    {t.noHistory}
                  </div>
                </div>

              ) : (

                /* ── Postcard list (single column) ──────────────── */
                <div
                  key={openKey}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 28,
                  }}
                >
                  {history.map((item, i) => {
                    const rot = SLOT_ROTATIONS[i % SLOT_ROTATIONS.length];
                    const isHov = hoveredId === item.id;
                    const arCss = (item.aspectRatio ?? '4:3').replace(':', '/');
                    const isPro = item.model.includes('pro');

                    return (
                      /* entrance animation wrapper */
                      <div
                        key={item.id}
                        style={{
                          animation: `binder-card-in 0.44s ease ${i * 56}ms both`,
                        }}
                      >
                        {/* polaroid card */}
                        <div
                          onClick={(e) => onSelect(item, e.currentTarget.getBoundingClientRect())}
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{
                            position: 'relative',
                            cursor: 'pointer',
                            background: '#f8f3e8',
                            padding: '5px 5px 44px',
                            borderRadius: '1px',
                            transform: isHov
                              ? 'rotate(0deg) translateY(-5px) scale(1.025)'
                              : `rotate(${rot}deg)`,
                            boxShadow: isHov
                              ? '0 16px 36px rgba(0,0,0,0.28), 0 5px 14px rgba(0,0,0,0.18)'
                              : '0 4px 14px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.12)',
                            transition: 'transform 0.34s cubic-bezier(0.34, 1.42, 0.64, 1), box-shadow 0.34s ease',
                            userSelect: 'none',
                          }}
                        >
                          <PhotoCorners />

                          {/* image */}
                          <div style={{
                            aspectRatio: arCss,
                            overflow: 'hidden',
                            background: '#ddd5be',
                            position: 'relative',
                          }}>
                            <img
                              src={item.imageUrl}
                              alt={item.locationName ?? ''}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                transition: 'transform 0.42s ease',
                                transform: isHov ? 'scale(1.06)' : 'scale(1)',
                              }}
                            />
                            {/* model badge — image overlay top-left */}
                            <div style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              background: 'rgba(0,0,0,0.45)',
                              backdropFilter: 'blur(6px)',
                              WebkitBackdropFilter: 'blur(6px)',
                              color: '#fff',
                              fontSize: 9,
                              fontFamily: "'DM Mono', monospace",
                              letterSpacing: '0.08em',
                              padding: '3px 7px',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              {isPro
                                ? <Sparkles size={9} style={{ color: '#f0c84a' }} />
                                : <Zap size={9} style={{ color: '#93c5fd' }} />
                              }
                              <span>{isPro ? 'PRO' : 'FLASH'}</span>
                            </div>
                          </div>

                          {/* polaroid info area */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 5,
                            right: 5,
                            height: 42,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 3,
                            padding: '0 4px',
                          }}>
                            {/* row 1: location + cost */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                              <div style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 10,
                                fontWeight: 600,
                                color: 'rgba(30,24,16,0.7)',
                                letterSpacing: '0.02em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}>
                                {item.locationName ?? '—'}
                              </div>
                              {item.cost && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  fontFamily: "'DM Mono', monospace",
                                  fontSize: 9,
                                  color: '#2a7a4a',
                                  flexShrink: 0,
                                  marginLeft: 6,
                                }}>
                                  <DollarSign size={8} />
                                  {item.cost.totalCost.toFixed(4)}
                                </div>
                              )}
                            </div>
                            {/* row 2: style */}
                            <div style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 8.5,
                              color: 'rgba(30,24,16,0.38)',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}>
                              {getStyleLabel(item.styleId)}
                            </div>
                          </div>

                          {/* delete button */}
                          <button
                            onClick={(e) => onDelete(item.id, e)}
                            style={{
                              position: 'absolute',
                              top: -9,
                              right: -9,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#c0392b',
                              border: '1.5px solid #f8f3e8',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              opacity: isHov ? 1 : 0,
                              transform: isHov ? 'scale(1)' : 'scale(0.5)',
                              transition: 'opacity 0.2s ease, transform 0.22s cubic-bezier(0.34,1.4,0.64,1)',
                              zIndex: 3,
                            }}
                          >
                            <X size={9} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes binder-card-in {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default HistoryPanel;
