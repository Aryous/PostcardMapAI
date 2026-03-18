
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Wand2, RefreshCw, Zap, Sparkles, History, Upload, X,
         RectangleHorizontal, RectangleVertical, Square, Settings, ChevronLeft,
         ChevronRight, Type, Loader2, Coins } from 'lucide-react';
import { AppState, Language, ModelType, AspectRatio, DevConfig } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { STYLE_DEFS } from '../utils/styles';

export { STYLE_DEFS };

interface ControlPanelProps {
  appState: AppState;
  onGenerate: (prompt: string, styleId: string) => void;
  onToggleHistory: () => void;
  error?: string;
  language: Language;
  setLanguage: (lang: Language) => void;
  model: ModelType;
  setModel: (model: ModelType) => void;
  userImage: string | undefined;
  setUserImage: (img: string | undefined) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  devConfig: DevConfig;
  setDevConfig: (config: DevConfig) => void;
  locationName: string;
  setLocationName: (name: string) => void;
  sessionCost: number;
  pendingStyleId?: string | null;
  isLuckyInProgress?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  appState, onGenerate, onToggleHistory, error,
  language, setLanguage, model, setModel,
  userImage, setUserImage, aspectRatio, setAspectRatio,
  devConfig, setDevConfig, locationName, setLocationName,
  sessionCost, pendingStyleId, isLuckyInProgress,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );
  const [selectedStyleId, setSelectedStyleId] = useState(STYLE_DEFS[0].id);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    if (!pendingStyleId) return;
    const styleIds = STYLE_DEFS.map(s => s.id);
    const steps: { id: string; delay: number }[] = [];
    for (let i = 0; i < 14; i++) {
      steps.push({ id: styleIds[Math.floor(Math.random() * styleIds.length)], delay: 80 });
    }
    [110, 150, 200, 265, 340, 430].forEach((delay, i, arr) => {
      const id = i >= arr.length - 2 ? pendingStyleId : styleIds[Math.floor(Math.random() * styleIds.length)];
      steps.push({ id, delay });
    });
    setIsSpinning(true);
    let cumulative = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(step => {
      cumulative += step.delay;
      timers.push(setTimeout(() => setSelectedStyleId(step.id), cumulative));
    });
    timers.push(setTimeout(() => setIsSpinning(false), cumulative + 100));
    return () => timers.forEach(clearTimeout);
  }, [pendingStyleId]);

  const [isDevEnabled, setIsDevEnabled] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [showDevToast, setShowDevToast] = useState(false);
  const titleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isProcessing = appState === AppState.GENERATING || !!isLuckyInProgress;
  const isAreaSelected = appState === AppState.REVIEWING || appState === AppState.GENERATING || appState === AppState.COMPLETE;

  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleClick = () => {
    if (isDevEnabled) return;
    if (titleClickTimer.current) clearTimeout(titleClickTimer.current);
    titleClickTimer.current = setTimeout(() => setTitleClickCount(0), 2000);
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    if (newCount >= 5) {
      if (titleClickTimer.current) clearTimeout(titleClickTimer.current);
      setIsDevEnabled(true);
      setShowDevMode(true);
      setShowDevToast(true);
      setTimeout(() => setShowDevToast(false), 2000);
    }
  };

  const currentStyles = useMemo(() => STYLE_DEFS.map(def => ({ ...def, label: def.label[language] })), [language]);
  const selectedStyle = currentStyles.find(s => s.id === selectedStyleId) || currentStyles[0];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { if (e.target?.result) setUserImage(e.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const ratioOptions: { id: AspectRatio; label: string; icon: React.ReactNode }[] = [
    { id: '1:1',  label: t.ratios.square,         icon: <Square className="w-3 h-3" /> },
    { id: '3:2',  label: t.ratios.classic,         icon: <RectangleHorizontal className="w-3 h-3 scale-x-110" /> },
    { id: '2:3',  label: t.ratios.classicPortrait, icon: <RectangleVertical className="w-3 h-3 scale-y-110" /> },
    { id: '4:3',  label: t.ratios.landscape,       icon: <RectangleHorizontal className="w-3 h-3" /> },
    { id: '3:4',  label: t.ratios.portrait,        icon: <RectangleVertical className="w-3 h-3" /> },
    { id: '16:9', label: t.ratios.wide,            icon: <RectangleHorizontal className="w-3 h-3 scale-x-125" /> },
    { id: '9:16', label: t.ratios.tall,            icon: <RectangleVertical className="w-3 h-3 scale-y-125" /> },
  ];

  const mono: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' };
  const DIVIDER = <div style={{ height: '0.5px', background: 'rgba(42,69,53,0.12)', margin: '0 -16px' }} />;

  // ── Generate-ready pulse (fires once when area becomes selected) ──────────
  const prevAreaSelectedRef = useRef(false);
  const [generatePulse, setGeneratePulse] = useState(false);
  useEffect(() => {
    if (isAreaSelected && !prevAreaSelectedRef.current) {
      setGeneratePulse(true);
      const t = setTimeout(() => setGeneratePulse(false), 700);
      return () => clearTimeout(t);
    }
    prevAreaSelectedRef.current = isAreaSelected;
  }, [isAreaSelected]);

  const SectionLabel = ({ label }: { label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ ...mono, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'rgba(42,69,53,0.38)', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '0.5px', background: 'rgba(42,69,53,0.15)' }} />
    </div>
  );

  // ── Shared keyframes (always in DOM) ─────────────────────────────────────
  const KEYFRAMES = (
    <style>{`
      @keyframes cp-tab-in {
        from { opacity: 0; transform: translateX(-10px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes cp-panel-in {
        from { opacity: 0; transform: translateX(-16px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes cp-panel-out {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(-10px); }
      }
      @keyframes cp-ready-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(42,69,53,0.45); }
        55%  { box-shadow: 0 0 0 8px rgba(42,69,53,0); }
        100% { box-shadow: 0 0 0 0 rgba(42,69,53,0); }
      }
      @keyframes cp-item-in {
        from { opacity: 0; transform: translateY(5px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        [style*="cp-tab-in"], [style*="cp-panel-in"],
        [style*="cp-panel-out"], [style*="cp-item-in"] { animation: none !important; }
      }
    `}</style>
  );

  // ── Exit state (panel plays out-animation before switching to tab) ────────
  const [isExiting, setIsExiting] = useState(false);

  const handleCollapse = () => {
    setIsExiting(true);
    setTimeout(() => { setIsCollapsed(true); setIsExiting(false); }, 220);
  };

  // ── Collapsed tab ─────────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <>
        {KEYFRAMES}
        <div className="absolute top-4 left-4 z-[1000]" style={{ animation: 'cp-tab-in 0.28s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div
          className="rounded-xl overflow-hidden shadow-[0_16px_48px_rgba(30,24,16,0.16),0_4px_16px_rgba(30,24,16,0.07)]"
          style={{ background: '#f8f3e8', borderTop: '2px solid #2a4535', fontFamily: "'DM Sans', sans-serif" }}
        >
          {/* Expand button */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-12 h-12 flex items-center justify-center hover:bg-[#e2d9cc] transition-colors active:scale-95 rounded-t-xl"
            aria-label="Expand panel"
            style={{ animation: 'cp-item-in 0.22s cubic-bezier(0.16,1,0.3,1) 0.04s both' }}
          >
            <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 13, color: '#2a4535' }}>✦</div>
          </button>

          <div style={{ height: '0.5px', background: 'rgba(42,69,53,0.1)', margin: '0 10px' }} />

          {/* History */}
          <button
            onClick={onToggleHistory}
            className="w-12 h-12 flex items-center justify-center text-[#2a4535]/40 hover:text-[#2a4535] hover:bg-[#e2d9cc] transition-colors active:scale-95"
            aria-label={t.history}
            style={{ animation: 'cp-item-in 0.22s cubic-bezier(0.16,1,0.3,1) 0.08s both' }}
          >
            <History className="w-4 h-4" />
          </button>

          <div style={{ height: '0.5px', background: 'rgba(42,69,53,0.1)', margin: '0 10px' }} />

          {/* Generate / state indicator */}
          <button
            onClick={() => !isProcessing && onGenerate(selectedStyle.frontPrompt, selectedStyleId)}
            className={`w-12 h-12 flex items-center justify-center transition-colors active:scale-95 rounded-b-xl ${
              isProcessing ? 'text-[#2a4535]/40' : 'text-[#2a4535] hover:bg-[#e2d9cc]'
            }`}
            aria-label={t.generate}
            style={{ animation: 'cp-item-in 0.22s cubic-bezier(0.16,1,0.3,1) 0.12s both' }}
          >
            {isProcessing
              ? <div className="w-4 h-4 border-2 border-[#2a4535]/15 border-t-[#2a4535] rounded-full animate-spin" />
              : <Wand2 className="w-4 h-4" />
            }
          </button>
        </div>
        </div>
      </>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <>
    {KEYFRAMES}
    <div className="absolute top-4 left-4 z-[1000] w-full max-w-xs"
      style={{ animation: isExiting ? 'cp-panel-out 0.22s cubic-bezier(0.4,0,1,1) both' : 'cp-panel-in 0.38s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div
        className="rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto shadow-[0_16px_48px_rgba(30,24,16,0.16),0_4px_16px_rgba(30,24,16,0.07)]"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: '#f8f3e8',
          borderTop: '2px solid #2a4535',
        }}
      >

        {/* ── Header ── */}
        <div
          className="px-4 pt-3 pb-3 sticky top-0 z-10 flex items-center justify-between"
          style={{
            background: 'rgba(248,243,232,0.97)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '0.5px solid rgba(42,69,53,0.15)',
          }}
        >
          <div
            className="cursor-pointer select-none active:scale-95 transition-transform"
            onClick={handleTitleClick}
          >
            <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 15, color: '#1e1810', letterSpacing: 0.3 }}>
              <span style={{ color: '#2a4535', marginRight: 5 }}>✦</span>
              MapPostcard<span style={{ color: '#2a4535' }}>.</span>AI
            </div>
            {isDevEnabled && sessionCost > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Coins className="w-3 h-3 text-amber-500" />
                <span style={{ ...mono, fontSize: 9, color: 'rgba(42,69,53,0.45)' }}>{t.sessionCost}:</span>
                <span style={{ ...mono, fontSize: 9, fontWeight: 600, color: '#c4892a' }}>~${sessionCost.toFixed(4)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {isDevEnabled && (
              <button
                onClick={() => setShowDevMode(!showDevMode)}
                aria-label="Developer Settings"
                className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${showDevMode ? 'bg-[#2a4535]/10 text-[#2a4535]' : 'text-[#2a4535]/35 hover:text-[#2a4535]/65 hover:bg-[#e2d9cc]'}`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onToggleHistory}
              aria-label={t.history}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#2a4535]/40 hover:text-[#2a4535] hover:bg-[#e2d9cc] transition-colors"
            >
              <History className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              aria-label="Switch language"
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 rounded-lg hover:bg-[#e2d9cc] transition-colors"
            >
              <span style={{ ...mono, fontSize: 10, fontWeight: language === 'en' ? 700 : 400, letterSpacing: '0.05em', color: language === 'en' ? '#c4892a' : 'rgba(42,69,53,0.30)', borderBottom: language === 'en' ? '1.5px solid #c4892a' : '1.5px solid transparent', paddingBottom: 1, lineHeight: 1.2 }}>EN</span>
              <span style={{ ...mono, fontSize: 10, color: '#c8bfad' }}>·</span>
              <span style={{ ...mono, fontSize: 10, fontWeight: language === 'zh' ? 700 : 400, letterSpacing: '0.05em', color: language === 'zh' ? '#c4892a' : 'rgba(42,69,53,0.30)', borderBottom: language === 'zh' ? '1.5px solid #c4892a' : '1.5px solid transparent', paddingBottom: 1, lineHeight: 1.2 }}>中</span>
            </button>
            {/* Collapse button */}
            <button
              onClick={handleCollapse}
              aria-label="Collapse panel"
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#2a4535]/35 hover:text-[#2a4535] hover:bg-[#e2d9cc] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Dev Panel ── */}
        {showDevMode && isDevEnabled && (
          <div className="px-4 py-3 space-y-3 animate-in slide-in-from-top-2"
            style={{ background: 'rgba(42,69,53,0.04)', borderBottom: '0.5px solid rgba(42,69,53,0.12)' }}>
            <div className="flex items-center justify-between">
              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(42,69,53,0.55)' }}
                className="flex items-center gap-1.5">
                <Settings className="w-3 h-3" /> {t.devMode}
              </span>
              <button onClick={() => setShowDevMode(false)}>
                <ChevronLeft className="w-3 h-3 text-[#2a4535]/35 rotate-90" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(42,69,53,0.38)' }}
                className="flex items-center gap-1.5">
                <Type className="w-3 h-3" /> {language === 'zh' ? '地点名称 (调试)' : 'Location Name'}
              </label>
              <div className="relative">
                <input
                  type="text" value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder={isAreaSelected && !locationName ? (language === 'zh' ? '正在识别...' : 'Detecting...') : (language === 'zh' ? '手动输入' : 'Manual Input')}
                  className="w-full px-3 py-2 text-xs border border-[#c8bfad] rounded focus:ring-1 focus:ring-[#2a4535] bg-[#f8f3e8]"
                />
                {isAreaSelected && !locationName && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3 h-3 text-[#2a4535] animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(42,69,53,0.38)' }}>
                {language === 'zh' ? '提示词模式' : 'Prompt Mode'}
              </label>
              <div className="flex bg-[#e2d9cc] rounded p-0.5">
                {([
                  { id: 'default', label: language === 'zh' ? '默认' : 'Default' },
                  { id: 'v2',      label: 'V2' },
                  { id: 'custom',  label: language === 'zh' ? '自定义' : 'Custom' },
                ] as const).map(({ id, label }) => {
                  const active = devConfig.useCustomPrompt ? 'custom' : devConfig.useV2Prompt ? 'v2' : 'default';
                  return (
                    <button key={id}
                      onClick={() => setDevConfig({ ...devConfig, useV2Prompt: id === 'v2', useCustomPrompt: id === 'custom' })}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${active === id ? 'bg-[#f8f3e8] text-[#2a4535] shadow-sm' : 'text-[#2a4535]/45 hover:text-[#2a4535]/75'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              {devConfig.useCustomPrompt && (
                <textarea value={devConfig.customSystemInstruction}
                  onChange={e => setDevConfig({ ...devConfig, customSystemInstruction: e.target.value })}
                  className="w-full h-24 text-[10px] p-2 border border-[#c8bfad] rounded focus:ring-1 focus:ring-[#2a4535] font-mono bg-[#f8f3e8]"
                  placeholder="Enter system instructions here..." />
              )}
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="px-4 pt-4 pb-0 space-y-4">

          {/* GRADE — collapsible */}
          {(() => {
            const modelDefs = [
              { id: 'gemini-3-pro-image-preview',     icon: <Sparkles className="w-3 h-3" />, label: t.models.pro     },
              { id: 'gemini-3.1-flash-image-preview', icon: <Zap className="w-3 h-3" />,      label: t.models.flash31 },
              { id: 'gemini-2.5-flash-image',        icon: <Zap className="w-3 h-3" />,      label: t.models.flash   },
            ] as const;
            const currentLabel = modelDefs.find(m => m.id === model)?.label ?? model;
            return (
              <div>
                <button
                  onClick={() => setShowModelPicker(v => !v)}
                  className="w-full flex items-center justify-between group"
                >
                  <SectionLabel label={language === 'zh' ? '模型质量' : 'Grade'} />
                  <span className="flex items-center gap-1 text-[10px] text-[#2a4535]/55 group-hover:text-[#2a4535] transition-colors pb-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {currentLabel}
                    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showModelPicker ? 'rotate-90' : ''}`} />
                  </span>
                </button>
                {showModelPicker && (
                  <div className="flex gap-1.5 mt-1.5">
                    {modelDefs.map(m => (
                      <button key={m.id} onClick={() => setModel(m.id)}
                        className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 rounded transition-all ${
                          model === m.id
                            ? 'bg-[#2a4535] text-[#f8f3e8] shadow-sm'
                            : 'text-[#2a4535]/45 hover:text-[#2a4535] hover:bg-[#e2d9cc]'
                        }`}>
                        {m.icon}{m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* FORMAT */}
          <div>
            <SectionLabel label={language === 'zh' ? '图片比例' : 'Format'} />
            <div className="flex gap-1">
              {ratioOptions.map(opt => (
                <button key={opt.id} onClick={() => setAspectRatio(opt.id)} title={opt.label}
                  className={`flex-1 flex-shrink-0 flex flex-col items-center py-2 px-1 min-w-[32px] rounded transition-all gap-0.5 ${
                    aspectRatio === opt.id
                      ? 'bg-[#2a4535] text-[#f8f3e8] shadow-sm'
                      : 'text-[#2a4535]/38 hover:text-[#2a4535] hover:bg-[#e2d9cc]'
                  }`}>
                  {opt.icon}
                  <span style={{ ...mono, fontSize: 8, fontWeight: 600 }}>{opt.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STYLE */}
          <div>
            <SectionLabel label={language === 'zh' ? '艺术风格' : 'Style'} />
            <div className="grid grid-cols-3 gap-x-2 gap-y-1">
              {currentStyles.map(style => (
                <button key={style.id} onClick={() => setSelectedStyleId(style.id)}
                  className={`flex items-center gap-2 py-1.5 text-left transition-all rounded px-1 ${
                    selectedStyleId === style.id
                      ? isSpinning ? 'text-[#c4892a]' : 'text-[#2a4535]'
                      : 'text-[#2a4535]/45 hover:text-[#2a4535]/80'
                  }`}
                  style={{ transition: 'color 0.18s ease' }}
                >
                  <span style={{ fontSize: 7, flexShrink: 0, lineHeight: 1, color: 'inherit' }}>
                    {selectedStyleId === style.id ? (isSpinning ? '◈' : '●') : '○'}
                  </span>
                  <span style={{ ...mono, fontSize: 11, fontWeight: selectedStyleId === style.id ? 600 : 400 }}>
                    {style.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {DIVIDER}

          {/* PORTRAIT */}
          <div>
            <SectionLabel label={language === 'zh' ? '个人照片' : 'Portrait'} />
            {!userImage ? (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded border border-dashed border-[#c8bfad] hover:border-[#2a4535] bg-transparent hover:bg-[#e2d9cc]/25 transition-all flex items-center justify-center gap-2 text-xs text-[#2a4535]/40 hover:text-[#2a4535]/65">
                <Upload className="w-3.5 h-3.5" />
                {t.uploadHint}
              </button>
            ) : (
              <div className="relative w-full h-16 rounded overflow-hidden border border-[#d4c9b8] group">
                <img src={userImage} alt="User" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setUserImage(undefined)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-[10px] flex items-center gap-1 hover:bg-red-700">
                    <X className="w-3 h-3" /> {t.removePhoto}
                  </button>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        {/* ── Generate ── */}
        <div className="mt-4 sticky bottom-0" style={{ borderTop: '1px solid rgba(42,69,53,0.14)' }}>
          {isProcessing ? (
            <div className="flex flex-col items-center py-5 space-y-3">
              <div className="w-5 h-5 border-2 border-[#2a4535]/15 border-t-[#2a4535] rounded-full animate-spin" />
              <p style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}
                className="text-[#2a4535]/50 animate-pulse text-center">
                {t.generating.replace('{style}', selectedStyle.label)}
              </p>
            </div>
          ) : appState === AppState.COMPLETE ? (
            <button onClick={() => onGenerate(selectedStyle.frontPrompt, selectedStyleId)}
              className="w-full py-3.5 bg-[#2a4535] hover:bg-[#3a5f4a] text-[#f8f3e8] transition-all active:scale-[0.99] flex items-center gap-3 px-4">
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span style={{ ...mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>{t.retry}</span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(248,243,232,0.3)' }} />
            </button>
          ) : (
            <button
              onClick={() => onGenerate(selectedStyle.frontPrompt, selectedStyleId)}
              className="w-full py-3.5 bg-[#2a4535] hover:bg-[#3a5f4a] text-[#f8f3e8] transition-all active:scale-[0.99] flex items-center gap-3 px-4"
              style={generatePulse ? { animation: 'cp-ready-pulse 0.7s ease-out' } : undefined}
            >
              <Wand2 className="w-4 h-4 flex-shrink-0" />
              <span style={{ ...mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                {t.generate}
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(248,243,232,0.3)' }} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-3">
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.06em' }}
              className="text-[#a83232] bg-[#f9ebe8] p-2 rounded border border-[#e8c8c0] text-center animate-in slide-in-from-top-1 mt-3">
              {error}
            </div>
          </div>
        )}

        {/* Dev toast */}
        {showDevToast && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2a4535]/90 text-[#f8f3e8] text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-in fade-in zoom-in duration-300">
            {t.devModeEnabled}
          </div>
        )}

      </div>
    </div>
    </>
  );
};

export default ControlPanel;
