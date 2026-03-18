
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
import { X, Download, RotateCw, Coins } from 'lucide-react';
import { Language, AspectRatio, UsageStats } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface PostcardResultProps {
  imageUrl: string;
  backImageUrl?: string;
  onClose: () => void;
  language: Language;
  skipAnimation?: boolean;
  aspectRatio?: AspectRatio;
  locationName?: string;
  usageStats?: UsageStats;
  originRect?: DOMRect;
}

const PostcardResult: React.FC<PostcardResultProps> = ({
  imageUrl,
  backImageUrl,
  onClose,
  language,
  skipAnimation = false,
  aspectRatio = '4:3',
  locationName = 'MapPostcard',
  usageStats,
  originRect,
}) => {
  const [animationStage, setAnimationStage] = useState<'envelope' | 'opening' | 'revealing' | 'settling' | 'done'>('envelope');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (skipAnimation) {
      // Show mini card first, then let the existing expand transition play
      setAnimationStage('done');
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => setIsExpanded(true));
        return () => cancelAnimationFrame(id2);
      });
      return () => cancelAnimationFrame(id1);
    }

    // Sequence the animation stages
    const sequence = async () => {
      // 1. Envelope slides in
      await new Promise(r => setTimeout(r, 600));
      setAnimationStage('opening');

      // 2. Flap opens
      await new Promise(r => setTimeout(r, 500));
      setAnimationStage('revealing');

      // 3. Card slides out
      await new Promise(r => setTimeout(r, 700));
      setAnimationStage('settling');

      // 4. Envelope drops, card settles
      await new Promise(r => setTimeout(r, 700));
      setAnimationStage('done');
    };

    sequence();
  }, [skipAnimation]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Format: postcard-YYMMDD-Site-Time.png
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');

    // Format time as HHmmss
    const time = date.toTimeString().split(' ')[0].replace(/:/g, '');

    // Sanitize location name (remove spaces/special chars)
    const site = locationName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '');

    const suffix = isFlipped ? 'back' : 'front';
    const filename = `postcard-${yy}${mm}${dd}-${site}-${time}-${suffix}.png`;

    const link = document.createElement('a');
    link.href = isFlipped && backImageUrl ? backImageUrl : imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (backImageUrl) {
      setIsFlipped(!isFlipped);
    }
  };

  const aspectRatioClass = useMemo(() => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      case '16:9': return 'aspect-[16/9]';
      case '9:16': return 'aspect-[9/16]';
      case '3:2': return 'aspect-[3/2]';
      case '2:3': return 'aspect-[2/3]';
      default: return 'aspect-[4/3]';
    }
  }, [aspectRatio]);

  // Compute exact px size for expanded view, respecting both viewport constraints
  const expandedSize = useMemo(() => {
    const [aw, ah] = (aspectRatio || '4:3').split(':').map(Number);
    const ratio = aw / ah;
    const maxW = window.innerWidth * 0.90;
    const maxH = window.innerHeight * 0.85;
    let w = maxH * ratio;
    let h = maxH;
    if (w > maxW) { w = maxW; h = maxW / ratio; }
    return { width: Math.round(w), height: Math.round(h) };
  }, [aspectRatio]);

  const [isHovered, setIsHovered] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  // Track whether the card has ever been in expanded state.
  // Once expanded, collapsing always returns to mini (bottom-right), not the hero origin.
  // Using a ref (updated in an effect) avoids state-batching race conditions.
  const everExpandedRef = useRef(false);
  useEffect(() => { if (isExpanded) everExpandedRef.current = true; }, [isExpanded]);
  const autoDismissTimer = useRef<number>();

  const startDismiss = useCallback(() => {
    if (isDismissing) return;
    clearTimeout(autoDismissTimer.current);
    setIsDismissing(true);
    setTimeout(onClose, 460);
  }, [isDismissing, onClose]);

  const handleClose = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      setTimeout(startDismiss, 460);
    } else {
      startDismiss();
    }
  }, [isExpanded, startDismiss]);

  // Auto-dismiss 5s after entering mini state
  useEffect(() => {
    if (animationStage !== 'done' || isExpanded || isDismissing) return;
    autoDismissTimer.current = window.setTimeout(startDismiss, 5000);
    return () => clearTimeout(autoDismissTimer.current);
  }, [animationStage, isExpanded, isDismissing]);

  // Mini card dimensions — smaller on mobile to leave room for controls
  const MINI_W = isMobile ? 200 : 272;
  const miniH = useMemo(() => {
    const [aw, ah] = (aspectRatio || '4:3').split(':').map(Number);
    return Math.round(MINI_W * ah / aw);
  }, [aspectRatio]);

  // Transform that positions the (always-expanded-size) card at bottom-right
  const miniTransform = useMemo(() => {
    const scale = MINI_W / expandedSize.width;
    const dx = window.innerWidth / 2 - MINI_W / 2 - 16;
    const dy = window.innerHeight / 2 - miniH / 2 - 16;
    const rotate = isHovered ? 0 : 2;
    const extraScale = isHovered ? 1.05 : 1;
    return `translate(${dx}px, ${dy}px) scale(${scale * extraScale}) rotate(${rotate}deg)`;
  }, [expandedSize, miniH, isHovered]);

  // Hero transform: card starts at the clicked history item's position and scale
  const heroTransform = useMemo(() => {
    if (!originRect) return null;
    const scale = originRect.width / expandedSize.width;
    const dx = originRect.left + originRect.width / 2 - window.innerWidth / 2;
    const dy = originRect.top + originRect.height / 2 - window.innerHeight / 2;
    return `translate(${Math.round(dx)}px, ${Math.round(dy)}px) scale(${scale.toFixed(4)}) rotate(0deg)`;
  }, [originRect, expandedSize]);

  // Hero is used only for the initial entrance (before the card has ever been expanded).
  // Once expanded (everExpandedRef=true), closing always collapses to mini (bottom-right).
  const useHero = !!heroTransform && !everExpandedRef.current;
  const activeScale = useHero
    ? (originRect!.width / expandedSize.width)
    : (MINI_W / expandedSize.width);
  const buttonCounterScale = isExpanded ? 1 : (1 / activeScale);

  const cardTransform = isExpanded
    ? 'translate(0,0) scale(1) rotate(0deg)'
    : (useHero ? heroTransform! : miniTransform);

  // Envelope Components
  if (animationStage !== 'done' && !isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-[1500] w-48 sm:w-64 md:w-72 aspect-[3/2] perspective-1000">
        <div
          className={`relative w-full h-full transition-all duration-700 preserve-3d ${animationStage === 'settling' ? 'animate-[envelope-drop_0.8s_forwards]' : 'animate-[envelope-in_0.8s_ease-out_forwards]'
            }`}
        >
          {/* Envelope Body (Back) */}
          <div className="absolute inset-0 bg-[#e6dac8] shadow-2xl rounded-sm border-2 border-[#d4c5b0] flex items-end justify-center overflow-hidden">
            {/* Airmail stripes */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #b91c1c 0, #b91c1c 10px, #f8fafc 10px, #f8fafc 20px, #1d4ed8 20px, #1d4ed8 30px, #f8fafc 30px, #f8fafc 40px)' }}>
            </div>
          </div>

          {/* Postcard (Inside) */}
          <div
            className={`absolute top-2 left-2 right-2 bottom-2 bg-white shadow-md transition-transform duration-700 ease-in-out z-10 ${animationStage === 'revealing' || animationStage === 'settling' ? 'translate-y-[-120%]' : 'translate-y-0'
              }`}
          >
            <img src={imageUrl} className="w-full h-full object-cover" alt="Generated Postcard" />
          </div>

          {/* Envelope Front (Bottom pocket) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-full h-3/4 bg-[#f0e6d6] shadow-inner"
              style={{ clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)' }}></div>
          </div>

          {/* Envelope Flap (Top) */}
          <div
            className={`absolute top-0 left-0 w-full h-1/2 origin-top z-30 transition-transform duration-500 ease-in-out ${animationStage === 'opening' || animationStage === 'revealing' || animationStage === 'settling' ? 'rotate-x-180' : ''
              }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 bg-[#e6dac8] border-t-2 border-[#d4c5b0]"
              style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)', backfaceVisibility: 'hidden' }}>
            </div>
            {/* Inner flap color (visible when open) */}
            <div className="absolute inset-0 bg-[#f5efe6]"
              style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final Result Card with Flip
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: isExpanded ? 2000 : 1500, pointerEvents: 'none' }}
    >
      {/* Backdrop — fades in when expanded */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-400"
        style={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none' }}
        onClick={() => setIsExpanded(false)}
      />

      {/* Cost Breakdown Panel - Skeuomorphic Paper Receipt */}
      {isExpanded && usageStats && (() => {
        const receiptNo = String(usageStats.promptTokens + usageStats.candidatesTokens).padStart(6, '0').slice(-6);

        // Safe formatters — guard against NaN / Infinity from malformed API responses
        const fmtCost = (n: number): string => {
          if (!Number.isFinite(n)) return '$—';
          if (n >= 10)    return `$${n.toFixed(2)}`;
          if (n >= 0.001) return `$${n.toFixed(4)}`;
          return `$${n.toFixed(5)}`;
        };
        const fmtTks = (n: number): string =>
          Number.isFinite(n) ? n.toLocaleString() : '—';

        // Size tokens: desktop vs mobile
        const W   = isMobile ? 190  : 230;
        const pad = isMobile ? '13px 16px 12px' : '16px 20px 15px';
        const iconSz   = isMobile ? 26  : 30;
        const coinSz   = isMobile ? 12  : 14;
        const titleSz  = isMobile ? 10.5 : 12;
        const noSz     = isMobile ? 8   : 9;
        const labelSz  = isMobile ? 8.5 : 9.5;
        const amtSz    = isMobile ? 11.5 : 13;
        const tksSz    = isMobile ? 7.5 : 8.5;
        const totLblSz = isMobile ? 10.5 : 12;
        const totAmtSz = isMobile ? 14  : 16;
        const footSz   = isMobile ? 7   : 8;
        const itemGap  = isMobile ? 7   : 9;
        const ruleGap  = isMobile ? '0 0 9px' : '0 0 11px';
        const sepGap   = isMobile ? '9px 0 8px' : '11px 0 10px';
        const hdrMb    = isMobile ? 9   : 11;
        const footMt   = isMobile ? 10  : 12;

        const perfEdge = {
          height: 13,
          background: 'radial-gradient(circle at center, transparent 4.5px, #f1e9d8 5px)',
          backgroundSize: '15px 13px',
          backgroundPosition: '7.5px 50%',
          backgroundRepeat: 'repeat-x',
        };
        return (
          <>
            <style>{`
              @keyframes receipt-appear {
                from { opacity: 0; transform: translateY(-18px) rotate(-2.5deg); }
                to   { opacity: 1; transform: translateY(0)    rotate(-1.5deg); }
              }
              @keyframes receipt-appear-up {
                from { opacity: 0; transform: translateY(14px) rotate(-2.5deg); }
                to   { opacity: 1; transform: translateY(0)   rotate(-1.5deg); }
              }
              .receipt-skeu        { animation: receipt-appear    0.44s cubic-bezier(0.34, 1.2, 0.64, 1) forwards; }
              .receipt-skeu-mobile { animation: receipt-appear-up 0.44s cubic-bezier(0.34, 1.2, 0.64, 1) forwards; }
              @media (prefers-reduced-motion: reduce) {
                .receipt-skeu, .receipt-skeu-mobile {
                  animation: none;
                  opacity: 1;
                  transform: rotate(-1.5deg);
                }
              }
            `}</style>
            <div
              className={`${isMobile ? 'receipt-skeu-mobile' : 'receipt-skeu'} absolute z-[2100] cursor-default`}
              style={{
                // Desktop: top-left (away from postcard action buttons at top-right)
                // Mobile:  bottom-right (below the postcard, clear of top-corner buttons)
                left:   isMobile ? undefined : 16,
                right:  isMobile ? 16 : undefined,
                top:    isMobile ? undefined : 16,
                bottom: isMobile ? 20 : undefined,
                width: W,
                fontFamily: "'DM Mono', 'Courier New', monospace",
                userSelect: 'none',
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div style={perfEdge} />

              <div style={{
                background: '#f1e9d8',
                backgroundImage: 'repeating-linear-gradient(transparent 0, transparent 3px, rgba(155,135,95,0.045) 3px, rgba(155,135,95,0.045) 4px)',
                padding: pad,
                boxShadow: '0 6px 20px rgba(30,24,16,0.22), 0 1px 4px rgba(30,24,16,0.1), inset 0 0 0 0.5px rgba(30,24,16,0.06)',
              }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: hdrMb }}>
                  <div style={{
                    width: iconSz, height: iconSz, borderRadius: '50%',
                    border: '1.5px solid rgba(42,69,53,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 6px',
                    color: 'rgba(42,69,53,0.5)',
                  }}>
                    <Coins style={{ width: coinSz, height: coinSz }} />
                  </div>
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: titleSz, fontWeight: 700, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: '#1e1810', lineHeight: 1,
                  }}>
                    {language === 'zh' ? '生成账单' : 'AI RECEIPT'}
                  </div>
                  <div style={{ fontSize: noSz, color: '#a8936a', letterSpacing: '0.06em', marginTop: 4 }}>
                    No. {receiptNo}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(30,24,16,0.11)', margin: ruleGap }} />

                {/* INPUT */}
                <div style={{ marginBottom: itemGap }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    gap: 6, minWidth: 0,
                    fontSize: labelSz, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a8762',
                  }}>
                    <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{t.input}</span>
                    <span style={{ flexShrink: 0, fontSize: amtSz, fontWeight: 600, color: '#2a1e10', letterSpacing: '-0.01em', textTransform: 'none' }}>
                      {fmtCost(usageStats.inputCost)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: tksSz, color: '#b8a47e', marginTop: 2, letterSpacing: '0.04em' }}>
                    {fmtTks(usageStats.promptTokens)} tks
                  </div>
                </div>

                {/* OUTPUT */}
                <div style={{ marginBottom: 2 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    gap: 6, minWidth: 0,
                    fontSize: labelSz, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a8762',
                  }}>
                    <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{t.output}</span>
                    <span style={{ flexShrink: 0, fontSize: amtSz, fontWeight: 600, color: '#2a1e10', letterSpacing: '-0.01em', textTransform: 'none' }}>
                      {fmtCost(usageStats.outputCost)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: tksSz, color: '#b8a47e', marginTop: 2, letterSpacing: '0.04em' }}>
                    {fmtTks(usageStats.candidatesTokens)} tks
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed rgba(30,24,16,0.18)', margin: sepGap }} />

                {/* TOTAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                  <span style={{
                    flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: totLblSz, fontWeight: 700, color: '#1e1810',
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                  }}>
                    {t.total}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: totAmtSz, fontWeight: 700, color: '#c4892a', letterSpacing: '-0.01em', lineHeight: 1 }}>
                    {fmtCost(usageStats.totalCost)}
                  </span>
                </div>

                <div style={{
                  textAlign: 'center', marginTop: footMt,
                  fontSize: footSz, color: '#b8a47e', fontStyle: 'italic', letterSpacing: '0.05em',
                }}>
                  {language === 'zh' ? '* 费用为估算值' : '* estimated cost'}
                </div>
              </div>

              <div style={perfEdge} />
            </div>
          </>
        );
      })()}

      {/* Dismiss wrapper — circular arc to bottom-right
          ── 调参区 ──────────────────────────────────── */}
      <style>{(() => {
        const R = 1200;   // ← 旋转半径 (px)，越大弧线越平缓
        const ALPHA = -2;    // ← 卡片底边法线角度 (deg)，对应卡片自身旋转角
        const THETA = 52;    // ← 弧线总扫角 (deg)，越大退出距离越远
        const ROT = 10;    // ← 退出过程中额外旋转量 (deg)
        const a = ALPHA * Math.PI / 180;
        const steps = [0, 0.25, 0.5, 0.75, 1];
        const lines = steps.map(t => {
          const th = t * THETA * Math.PI / 180;
          const dx = Math.round(R * (Math.sin(a) + Math.sin(th - a)));
          const dy = Math.round(R * (Math.cos(a) - Math.cos(th - a)));
          const rot = Math.round(t * ROT);
          const op = +(1 - t).toFixed(2);
          return `${t * 100}% { transform: translateX(${dx}px) translateY(${dy}px) rotate(${rot}deg); opacity: ${op}; }`;
        });
        return `@keyframes postcard-arc-out {\n${lines.map(l => '          ' + l).join('\n')}\n        }`;
      })()}</style>
      <div style={{
        animation: isDismissing ? 'postcard-arc-out 1.25s linear forwards' : 'none',
      }}>
        <div
          className="relative group"
          style={{
            width: expandedSize.width,
            height: expandedSize.height,
            transform: cardTransform,
            transformOrigin: 'center center',
            transition: 'transform 0.48s cubic-bezier(0.34,1.3,0.64,1)',
            pointerEvents: 'auto',
            cursor: isExpanded ? 'default' : 'pointer',
            zIndex: 10,
            flexShrink: 0,
          }}
          onClick={(e) => !isExpanded && setIsExpanded(true)}
          onMouseEnter={() => !isExpanded && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 3D Wrapper */}
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d preserve-3d shadow-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* FRONT SIDE */}
            <div className="absolute inset-0 backface-hidden postcard-shadow bg-white group">
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Postcard Front"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay Actions (Hover) - Front — outside overflow-hidden so counter-scale isn't clipped */}
              <div className={`absolute inset-0 pointer-events-none flex items-start justify-between p-2 duration-200 transition-opacity ${isExpanded ? 'opacity-100' : (isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}>
                {/* Close — left side to avoid accidental clicks */}
                <div
                  className="pointer-events-auto"
                  style={{ transform: `scale(${buttonCounterScale})`, transformOrigin: 'top left' }}
                >
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleClose(); }}
                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-500 transition-transform hover:scale-110"
                    title={t.close}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Flip + Download — right side */}
                <div
                  className="flex gap-2 pointer-events-auto"
                  style={{ transform: `scale(${buttonCounterScale})`, transformOrigin: 'top right' }}
                >
                  {backImageUrl && (
                    <button
                      onClick={handleFlip}
                      className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-[#2a4535] transition-transform hover:scale-110"
                      title={t.flip}
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-slate-700 transition-transform hover:scale-110"
                    title={t.download}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="absolute bottom-1.5 right-3 text-[8px] sm:text-[10px] text-white/90 font-serif italic tracking-wider select-none drop-shadow-md">
                {t.footer}
              </div>
              <div className="absolute bottom-2 left-3 w-6 h-6 sm:w-8 sm:h-8 opacity-60 border border-white rounded-full flex items-center justify-center rotate-[-12deg] pointer-events-none select-none drop-shadow-md">
                <span className="text-[5px] sm:text-[6px] text-white font-bold shadow-black">AIR</span>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 paper-texture postcard-shadow bg-[#fcfaf5] group">
              {backImageUrl ? (
                <>
                  <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                    <img
                      src={backImageUrl}
                      alt="Postcard Back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Overlay Actions (Hover) - Back — outside overflow-hidden */}
                  <div className={`absolute inset-0 pointer-events-none flex items-start justify-between p-2 duration-200 transition-opacity ${isExpanded ? 'opacity-100' : (isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}>
                    {/* Close — left */}
                    <div
                      className="pointer-events-auto"
                      style={{ transform: `scale(${buttonCounterScale})`, transformOrigin: 'top left' }}
                    >
                      <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleClose(); }}
                        className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-500 transition-transform hover:scale-110"
                        title={t.close}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Flip + Download — right */}
                    <div
                      className="flex gap-2 pointer-events-auto"
                      style={{ transform: `scale(${buttonCounterScale})`, transformOrigin: 'top right' }}
                    >
                      <button
                        onClick={handleFlip}
                        className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-[#2a4535] transition-transform hover:scale-110"
                        title={t.flip}
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-slate-700 transition-transform hover:scale-110"
                        title={t.download}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  No Back Design
                </div>
              )}
            </div>
          </div>
        </div>
      </div>{/* end dismiss wrapper */}
    </div>
  );
};

export default PostcardResult;

