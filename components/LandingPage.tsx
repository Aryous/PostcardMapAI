import React, { useEffect, useRef } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

// ─── Cartographic SVG background ──────────────────────────────────────────────
const MapBgSVG = () => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    aria-hidden="true"
  >
    <rect width="1440" height="900" fill="#f2ead4" />
    {/* Latitude/longitude grid */}
    {Array.from({ length: 16 }, (_, i) => (
      <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="900" stroke="#d2c490" strokeWidth="0.5" />
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={i * 100} x2="1440" y2={i * 100} stroke="#d2c490" strokeWidth="0.5" />
    ))}
    {/* City blocks */}
    <polygon points="160,110 330,95 370,230 310,278 148,250" fill="#e2d9ba" />
    <polygon points="460,150 615,135 648,295 572,325 440,288" fill="#e6dfc4" />
    <polygon points="800,75 980,96 962,228 818,244" fill="#ddd5b2" />
    <polygon points="130,390 288,370 338,498 192,530 118,462" fill="#e2d9ba" />
    <polygon points="668,352 852,334 896,480 732,506 650,438" fill="#e8e1c8" />
    <polygon points="1048,262 1210,248 1258,415 1128,440 998,372" fill="#ddd5b2" />
    <polygon points="378,545 556,527 598,670 424,692 358,628" fill="#e2d9ba" />
    <polygon points="910,550 1065,542 1098,680 930,695" fill="#e6dfc4" />
    <polygon points="1238,488 1380,476 1400,630 1246,648" fill="#ddd5b2" />
    {/* River */}
    <path d="M-10,305 Q178,258 378,348 Q554,428 766,370 Q968,318 1168,392 Q1330,444 1450,412"
      stroke="#a8bece" strokeWidth="11" fill="none" strokeLinecap="round" />
    <path d="M-10,305 Q178,258 378,348 Q554,428 766,370 Q968,318 1168,392 Q1330,444 1450,412"
      stroke="#c8dce8" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Roads */}
    <path d="M0,468 Q178,450 356,486 Q534,522 712,498 Q890,474 1068,510 Q1246,542 1440,516"
      stroke="#c2aa82" strokeWidth="2.5" fill="none" />
    <path d="M278,0 Q292,178 264,356 Q238,534 272,712 Q289,804 278,900"
      stroke="#c2aa82" strokeWidth="2" fill="none" />
    <path d="M728,0 Q742,200 716,400 Q694,600 706,900"
      stroke="#c2aa82" strokeWidth="2" fill="none" />
    <path d="M0,672 Q200,650 400,686 Q600,722 800,700 Q1000,678 1200,712 Q1340,732 1440,708"
      stroke="#c2aa82" strokeWidth="1.5" fill="none" />
    {/* Contour rings */}
    <ellipse cx="568" cy="258" rx="218" ry="128" stroke="#ccbb8e" strokeWidth="0.8" fill="none" opacity="0.5" />
    <ellipse cx="568" cy="258" rx="152" ry="86" stroke="#ccbb8e" strokeWidth="0.5" fill="none" opacity="0.35" />
    {/* Compass rose */}
    <g transform="translate(1348,108)" opacity="0.22">
      <circle cx="0" cy="0" r="42" stroke="#8a7655" strokeWidth="1.5" fill="none" />
      <circle cx="0" cy="0" r="34" stroke="#8a7655" strokeWidth="0.5" fill="none" />
      <polygon points="0,-38 4.5,0 0,38 -4.5,0" fill="#6a5632" />
      <polygon points="0,-38 3.5,-14 0,-7 -3.5,-14" fill="#8b3020" />
      <text x="0" y="-48" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#4a3820" fontWeight="bold">N</text>
    </g>
    {/* Coordinate labels */}
    <text x="22" y="26" fontFamily="monospace" fontSize="10" fill="#9a8a62" opacity="0.65">48°52′N</text>
    <text x="22" y="126" fontFamily="monospace" fontSize="10" fill="#9a8a62" opacity="0.65">48°51′N</text>
    <text x="82" y="882" fontFamily="monospace" fontSize="10" fill="#9a8a62" opacity="0.65">2°18′E</text>
    <text x="182" y="882" fontFamily="monospace" fontSize="10" fill="#9a8a62" opacity="0.65">2°20′E</text>
  </svg>
);

// ─── Floating hero postcards ───────────────────────────────────────────────────
const HeroPostcard = () => (
  <div style={{ position: 'relative', width: 300, userSelect: 'none' }}>
    {/* Back postcard (peeking) */}
    <div style={{
      position: 'absolute', top: 14, left: 18, right: -14, bottom: -10,
      borderRadius: 4,
      background: 'linear-gradient(145deg, #e6dbc8 0%, #d8cdb8 100%)',
      transform: 'rotate(5deg)',
      boxShadow: '0 10px 32px rgba(30,24,16,0.15)',
      zIndex: 0,
    }} />
    {/* Front postcard */}
    <div style={{
      position: 'relative', zIndex: 1,
      width: 300,
      borderRadius: 4,
      background: 'linear-gradient(148deg, #faf4e4 0%, #f2e8d0 100%)',
      boxShadow: '0 28px 72px rgba(30,24,16,0.38), 0 8px 24px rgba(30,24,16,0.22)',
      transform: 'rotate(-3deg)',
      overflow: 'hidden',
      border: '1px solid rgba(196,168,120,0.45)',
    }}>
      {/* Map area */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 300 180" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden="true">
          <rect width="300" height="180" fill="#ede4cc" />
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="300" y2={i * 20} stroke="#c8b888" strokeWidth="0.5" opacity="0.4" />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="180" stroke="#c8b888" strokeWidth="0.5" opacity="0.4" />
          ))}
          <polygon points="28,18 88,13 94,68 38,76" fill="rgba(176,152,104,0.28)" />
          <polygon points="108,22 182,18 188,88 118,93" fill="rgba(172,148,100,0.28)" />
          <polygon points="208,28 272,24 278,94 212,98" fill="rgba(176,152,104,0.28)" />
          <polygon points="22,98 78,93 86,154 28,160" fill="rgba(172,148,100,0.28)" />
          <polygon points="112,103 194,98 198,163 118,167" fill="rgba(176,152,104,0.28)" />
          <path d="M0,88 Q60,74 120,88 Q180,104 240,86 Q268,78 300,84" stroke="#8aA2b8" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.45" />
          <line x1="0" y1="88" x2="300" y2="88" stroke="#bcaa78" strokeWidth="1.8" opacity="0.35" />
          <line x1="150" y1="0" x2="150" y2="180" stroke="#bcaa78" strokeWidth="1.8" opacity="0.35" />
        </svg>
        <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(42,69,53,0.88)', color: '#f0e8d0', fontFamily: '"DM Mono",monospace', fontSize: 8, padding: '3px 9px', letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 2 }}>
          VINTAGE
        </div>
        <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: '"DM Mono",monospace', fontSize: 9, color: 'rgba(108,92,62,0.55)', letterSpacing: 1 }}>
          41.9°N · 12.5°E
        </div>
      </div>
      {/* Postcard foot */}
      <div style={{ padding: '12px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(176,152,112,0.3)' }}>
        <div>
          <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 19, fontWeight: 700, color: '#2a1e0a', letterSpacing: 0.3 }}>Rome, Italy</div>
          <div style={{ fontFamily: '"DM Mono",monospace', fontSize: 8, color: '#9a8a62', marginTop: 3, letterSpacing: 1 }}>MAPPOSTCARD AI</div>
        </div>
        {/* Stamp box */}
        <div style={{ width: 44, height: 54, border: '1.5px solid #a88a5e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 1 }}>
          <div style={{ width: 28, height: 20, background: 'rgba(42,69,53,0.12)', border: '0.5px solid rgba(42,69,53,0.25)', borderRadius: 1 }} />
          <div style={{ fontFamily: '"DM Mono",monospace', fontSize: 6, color: '#9a8a62', letterSpacing: 0.5 }}>POSTCARD</div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Style card renders ────────────────────────────────────────────────────────
const styleVisuals: Record<string, React.ReactNode> = {
  vintage:    <img src="/gallery/vintage.png"    alt="复古风格明信片示例"   loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />,
  ink:        <img src="/gallery/ink.png"        alt="古韵水墨明信片示例"   loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />,
  watercolor: <img src="/gallery/watercolor.png" alt="水彩明信片示例"       loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />,
  cyberpunk:  <img src="/gallery/cyberpunk.png"  alt="赛博朋克明信片示例"   loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />,
  sketch:     <img src="/gallery/sketch.png"     alt="素描明信片示例"       loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />,
  oil:        <img src="/gallery/oil.png"        alt="油画明信片示例"       loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />,
};
// ─── Gallery card component ────────────────────────────────────────────────────
type StyleCardProps = React.JSX.IntrinsicAttributes & {
  id: string;
  zh: string;
  en: string;
  location: string;
  descZh: string;
  descEn: string;
  delay: number;
};

const StyleCard = ({ id, zh, en, location, descZh, delay }: StyleCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="lp-reveal lp-style-card">
      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
        {styleVisuals[id]}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#1e1810' }}>{zh}</span>
          <span style={{ fontFamily: '"DM Mono",monospace', fontSize: 10, color: '#9a8a72', letterSpacing: 1 }}>{en.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 13, color: '#7a6d5e', lineHeight: 1.5, marginBottom: 4 }}>{descZh}</div>
        <div style={{ fontFamily: '"DM Mono",monospace', fontSize: 10, color: '#b0a492', letterSpacing: 0.5 }}>{location}</div>
      </div>
    </div>
  );
};

// ─── Style card data ───────────────────────────────────────────────────────────
const GALLERY: StyleCardProps[] = [
  { id: 'vintage',    zh: '复古',    en: 'Vintage',    location: 'Paris, France',     descZh: '1950年代版画旅行海报',     descEn: '1950s lithograph travel poster',      delay: 0   },
  { id: 'ink',        zh: '古韵',    en: 'Ancient Ink',location: 'Suzhou, China',     descZh: '传统中国水墨画 · 宣纸质感', descEn: 'Traditional Chinese ink wash',        delay: 80  },
  { id: 'watercolor', zh: '水彩',    en: 'Watercolor', location: 'Amsterdam, NL',     descZh: '城市素描水彩 · 湿涂晕染',   descEn: 'Urban sketching watercolor',          delay: 160 },
  { id: 'cyberpunk',  zh: '赛博朋克',en: 'Cyberpunk',  location: 'Tokyo, Japan',      descZh: '霓虹夜都 · 赛博全息界面',   descEn: 'Sci-fi neon holographic concept art', delay: 240 },
  { id: 'sketch',     zh: '素描',    en: 'Sketch',     location: 'New York, USA',     descZh: '建筑旅行日记 · 铅笔线稿',   descEn: 'Architectural travel journal sketch', delay: 320 },
  { id: 'oil',        zh: '油画',    en: 'Oil Paint',  location: 'Florence, Italy',   descZh: '印象派厚涂油画 · 梵高笔触', descEn: 'Impressionist impasto oil painting',  delay: 400 },
];

// ─── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return ref;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function LandingPage({ onStart }: LandingPageProps) {
  // Allow page to scroll
  useEffect(() => {
    const root = document.getElementById('root');
    const body = document.body;
    const prevRootH = root?.style.height;
    const prevRootOv = root?.style.overflow;
    const prevBodyOv = body.style.overflow;

    if (root) { root.style.height = 'auto'; root.style.overflow = 'auto'; }
    body.style.overflow = 'auto';

    return () => {
      if (root) { root.style.height = prevRootH ?? ''; root.style.overflow = prevRootOv ?? ''; }
      body.style.overflow = prevBodyOv;
    };
  }, []);

  const step1Ref = useReveal(0);
  const step2Ref = useReveal(140);
  const step3Ref = useReveal(280);
  const ctaRef = useReveal(0);

  const TAGS = ['六种艺术风格', '自带 API Key', '开源免费', '中英双语'];

  return (
    <div style={{ fontFamily: '"DM Sans", system-ui, sans-serif', background: '#f8f3e8', color: '#1e1810', overflowX: 'hidden' }}>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MapBgSVG />

        {/* Warm overlay — opaque on left, transparent on right */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(100deg, rgba(248,243,232,0.97) 0%, rgba(248,243,232,0.92) 36%, rgba(248,243,232,0.58) 58%, rgba(248,243,232,0) 80%)',
        }} />

        {/* ── Nav ── */}
        <nav className="lp-hero-nav" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 52px' }}>
          <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 18, letterSpacing: 0.5, color: '#1e1810' }}>
            MapPostcard<span style={{ color: '#2a4535' }}>.</span>AI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="https://github.com/Aryous/Maposter" target="_blank" rel="noopener noreferrer" className="lp-nav-link">GitHub</a>
            <button className="lp-btn-primary" onClick={onStart} style={{ padding: '10px 24px', fontSize: 14 }}>
              开始创作 →
            </button>
          </div>
        </nav>

        {/* ── Hero body ── */}
        <div className="lp-hero-content lp-hero-body" style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', padding: '52px 52px 80px', gap: 56 }}>
          {/* Left column */}
          <div className="lp-hero-left" style={{ flex: '0 0 52%', maxWidth: 600 }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(42,69,53,0.08)', border: '1px solid rgba(42,69,53,0.18)', padding: '6px 14px', borderRadius: 2, marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a4535', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: '"DM Mono",monospace', fontSize: 11, color: '#2a4535', letterSpacing: '0.11em', textTransform: 'uppercase' }}>
                AI × Cartography · Gemini Powered
              </span>
            </div>

            {/* Headline */}
            <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: 'clamp(2.8rem, 5.5vw, 5rem)', lineHeight: 1.08, color: '#1e1810', marginBottom: 10 }}>
              <div>把任何地方</div>
              <div style={{ color: '#2a4535', fontStyle: 'italic' }}>变成一张</div>
              <div>艺术明信片。</div>
            </div>

            {/* English sub */}
            <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 'clamp(1rem, 1.8vw, 1.3rem)', color: '#5a4a36', margin: '20px 0 30px', lineHeight: 1.55 }}>
              Turn any place on earth into a postcard worth keeping.
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
              {TAGS.map(tag => (
                <span key={tag} style={{ background: 'rgba(30,24,16,0.055)', border: '1px solid rgba(30,24,16,0.1)', padding: '4px 12px', borderRadius: 2, fontFamily: '"DM Mono",monospace', fontSize: 11, color: '#5a4a36', letterSpacing: '0.06em' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button className="lp-btn-primary" onClick={onStart}>开始创作 →</button>
              <button className="lp-btn-ghost" onClick={() => document.getElementById('lp-gallery')?.scrollIntoView({ behavior: 'smooth' })}>
                查看作品 ↓
              </button>
            </div>
          </div>

          {/* Right column — floating postcard */}
          <div className="lp-hero-right" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeroPostcard />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          GALLERY
      ════════════════════════════════════════ */}
      <section id="lp-gallery" className="lp-section" style={{ background: '#ede7d5', padding: '96px 52px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontFamily: '"DM Mono",monospace', fontSize: 11, color: '#2a4535', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              Six Artistic Styles
            </div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#1e1810', margin: '0 0 16px' }}>
              六种艺术风格
            </h2>
            <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 16, color: '#7a6d5e', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
              同一片土地，六种截然不同的艺术语言。
            </p>
          </div>

          {/* Magazine grid — alternating [2,1] [1,2] [1,2] spans */}
          {/* Spans: vintage(2) ink(1) / watercolor(1) cyberpunk(2) / sketch(1) oil(2) */}
          <div className="lp-gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {GALLERY.map(({ id, zh, en, location, descZh, descEn, delay }, i) => {
              const spans = [2, 1, 1, 2, 1, 2];
              return (
                <div key={id} className="lp-gallery-item" style={{ gridColumn: `span ${spans[i]}` }}>
                  <StyleCard id={id} zh={zh} en={en} location={location} descZh={descZh} descEn={descEn} delay={delay} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="lp-section" style={{ background: '#f8f3e8', padding: '96px 52px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ fontFamily: '"DM Mono",monospace', fontSize: 11, color: '#2a4535', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              How it works
            </div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#1e1810', margin: 0 }}>
              三步生成你的专属明信片
            </h2>
          </div>

          <div className="lp-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 56 }}>
            {[
              { ref: step1Ref, num: '01', zh: '移动地图到目标区域', en: 'Navigate the map', desc: '移动和缩放地图，将取景框对准你想要的城市街区、山脉或海岸线。' },
              { ref: step2Ref, num: '02', zh: '选择艺术风格', en: 'Choose your style',   desc: '从六种艺术风格中选择：复古版画、古韵水墨、水彩、赛博朋克、素描或油画。' },
              { ref: step3Ref, num: '03', zh: '下载你的明信片', en: 'Download & share', desc: '几秒钟后，正面与背面同时生成。下载留存，或寄给远方的朋友。' },
            ].map(step => (
              <div key={step.num} ref={step.ref} className="lp-reveal" style={{ textAlign: 'center' }}>
                <span className="lp-step-num">{step.num}</span>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: '#1e1810', margin: '0 0 6px' }}>{step.zh}</h3>
                <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 13, color: '#9a8a72', marginBottom: 10 }}>{step.en}</p>
                <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 14, color: '#5a4a36', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA
      ════════════════════════════════════════ */}
      <section className="lp-cta-section" style={{ background: '#2a4535', padding: '100px 52px', textAlign: 'center' }}>
        <div ref={ctaRef} className="lp-reveal" style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ fontFamily: '"DM Mono",monospace', fontSize: 11, color: 'rgba(240,232,200,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 22 }}>
            Open Source · Free to Use · Powered by Gemini
          </p>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontStyle: 'italic', fontSize: 'clamp(2rem,4vw,3.4rem)', fontWeight: 700, color: '#f0e8d0', margin: '0 0 18px', lineHeight: 1.2 }}>
            把旅行的记忆，<br />变成艺术。
          </h2>
          <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 16, color: 'rgba(240,232,200,0.6)', marginBottom: 42, lineHeight: 1.5 }}>
            Turn your journey into art.
          </p>
          <button
            className="lp-btn-primary"
            onClick={onStart}
            style={{ background: '#f0e8d0', color: '#1e1810', fontSize: 16, padding: '16px 52px' }}
          >
            开始创作 →
          </button>
          <div style={{ marginTop: 36, fontFamily: '"DM Mono",monospace', fontSize: 11, color: 'rgba(240,232,200,0.3)', letterSpacing: '0.1em' }}>
            {window.location.hostname}
          </div>
        </div>
      </section>
    </div>
  );
}
