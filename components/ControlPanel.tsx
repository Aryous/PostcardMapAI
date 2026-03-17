
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Wand2, RefreshCw, Palette, Zap, Sparkles, History, Upload, X, User, MousePointer2, RectangleHorizontal, RectangleVertical, Square, Settings, ChevronUp, Type, Loader2, Coins } from 'lucide-react';
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
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  appState,
  onGenerate,

  onToggleHistory,
  error,
  language,
  setLanguage,
  model,
  setModel,
  userImage,
  setUserImage,
  aspectRatio,
  setAspectRatio,
  devConfig,
  setDevConfig,
  locationName,
  setLocationName,
  sessionCost,
  pendingStyleId
}) => {
  const [selectedStyleId, setSelectedStyleId] = useState(STYLE_DEFS[0].id);
  const [isSpinning, setIsSpinning] = useState(false);

  // Slot-machine animation when pendingStyleId changes
  useEffect(() => {
    if (!pendingStyleId) return;

    const styleIds = STYLE_DEFS.map(s => s.id);
    const steps: { id: string; delay: number }[] = [];

    // Fast phase: 14 random steps × 80ms
    for (let i = 0; i < 14; i++) {
      steps.push({ id: styleIds[Math.floor(Math.random() * styleIds.length)], delay: 80 });
    }
    // Slowing phase: increasing delays, last 2 steps forced to target
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

  // Dev Mode State
  const [isDevEnabled, setIsDevEnabled] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [showDevToast, setShowDevToast] = useState(false);
  const titleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isProcessing = appState === AppState.GENERATING;
  const isAreaSelected = appState === AppState.REVIEWING || appState === AppState.GENERATING || appState === AppState.COMPLETE;
  
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleTitleClick = () => {
    if (isDevEnabled) return;

    // Reset the 2-second consecutive-click window
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

  const currentStyles = useMemo(() => {
    return STYLE_DEFS.map(def => ({
      ...def,
      label: def.label[language]
    }));
  }, [language]);

  const selectedStyle = currentStyles.find(s => s.id === selectedStyleId) || currentStyles[0];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUserImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const ratioOptions: { id: AspectRatio, label: string, icon: React.ReactNode }[] = [
    { id: '1:1', label: t.ratios.square, icon: <Square className="w-3 h-3" /> },
    { id: '3:2', label: t.ratios.classic, icon: <RectangleHorizontal className="w-3 h-3 scale-x-110" /> },
    { id: '2:3', label: t.ratios.classicPortrait, icon: <RectangleVertical className="w-3 h-3 scale-y-110" /> },
    { id: '4:3', label: t.ratios.landscape, icon: <RectangleHorizontal className="w-3 h-3" /> },
    { id: '3:4', label: t.ratios.portrait, icon: <RectangleVertical className="w-3 h-3" /> },
    { id: '16:9', label: t.ratios.wide, icon: <RectangleHorizontal className="w-3 h-3 scale-x-125" /> },
    { id: '9:16', label: t.ratios.tall, icon: <RectangleVertical className="w-3 h-3 scale-y-125" /> }
  ];

  return (
    <div className="absolute top-4 left-4 z-[1000] w-full max-w-xs transition-all duration-300">
      <div className="bg-[#f8f3e8] shadow-[0_16px_48px_rgba(0,0,0,0.14),0_4px_16px_rgba(0,0,0,0.07)] rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        
        {/* Header - Always Visible */}
        <div className="px-4 py-3 border-b border-[#d4c9b8] flex items-center justify-between sticky top-0 bg-[#f8f3e8]/98 z-10">
          <div className="flex flex-col">
            <div 
                className="flex items-center gap-2 text-[#2a4535] cursor-pointer select-none active:scale-95 transition-transform"
                onClick={handleTitleClick}
                title={isDevEnabled ? "Developer Mode Active" : "MapPostcard AI"}
            >
                <MapPin className="w-4 h-4" />
                <span className="font-bold text-sm tracking-tight">{t.title}</span>
            </div>
            {isDevEnabled && sessionCost > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-[#2a4535]/50">{t.sessionCost}:</span>
                    <span className="text-[10px] font-mono font-semibold text-amber-600">~${sessionCost.toFixed(4)}</span>
                    <span className="text-[9px] text-[#2a4535]/50">est.</span>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
             {/* Dev Mode Toggle (Hidden until activated) */}
             {isDevEnabled && (
                <button
                  onClick={() => setShowDevMode(!showDevMode)}
                  className={`p-1.5 rounded-full transition-colors ${showDevMode ? 'bg-[#2a4535]/10 text-[#2a4535]' : 'bg-[#e2d9cc] text-[#2a4535]/50 hover:text-[#2a4535]/60'}`}
                  title="Developer Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
             )}

             {/* History Button */}
             <button 
                onClick={onToggleHistory}
                className="p-1.5 rounded-full bg-[#e2d9cc] hover:bg-[#2a4535]/10 text-[#2a4535]/60 hover:text-[#2a4535] transition-colors border border-[#d4c9b8]"
                title={t.history}
             >
                <History className="w-3.5 h-3.5" />
             </button>

             {/* Language Toggle */}
             <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#e2d9cc] hover:bg-[#d4c9b8] transition-colors border border-[#d4c9b8]"
                title="Switch Language"
             >
                <span className={`text-xs ${language === 'en' ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}>🇺🇸</span>
                <span className="w-[1px] h-3 bg-[#c8bfad]"></span>
                <span className={`text-xs ${language === 'zh' ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}>🇨🇳</span>
             </button>
          </div>
        </div>

        {/* Developer Mode Panel */}
        {showDevMode && isDevEnabled && (
          <div className="bg-[#ede7d5] border-b border-[#d4c9b8] p-3 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2a4535] flex items-center gap-1">
                <Settings className="w-3 h-3" /> {t.devMode}
              </span>
              <button onClick={() => setShowDevMode(false)}><ChevronUp className="w-3 h-3 text-[#2a4535]/50" /></button>
            </div>
            
            {/* Location Name Input (Moved to Dev Mode) */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#2a4535]/50 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3" /> {language === 'zh' ? '地点名称 (调试)' : 'Location Name (Debug)'}
                </label>
                <div className="relative">
                    <input 
                    type="text" 
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
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

            {/* Prompt Mode Tabs */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#2a4535]/50 uppercase tracking-wider">
                {language === 'zh' ? '提示词模式' : 'Prompt Mode'}
              </label>
              <div className="flex bg-[#e2d9cc] rounded-md p-1">
                {([
                  { id: 'default', label: language === 'zh' ? '默认' : 'Default' },
                  { id: 'v2',      label: 'V2' },
                  { id: 'custom',  label: language === 'zh' ? '自定义' : 'Custom' },
                ] as const).map(({ id, label }) => {
                  const active = devConfig.useCustomPrompt ? 'custom' : devConfig.useV2Prompt ? 'v2' : 'default';
                  return (
                    <button
                      key={id}
                      onClick={() => setDevConfig({
                        ...devConfig,
                        useV2Prompt: id === 'v2',
                        useCustomPrompt: id === 'custom',
                      })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                        active === id
                          ? 'bg-[#f8f3e8] text-[#2a4535] shadow-sm'
                          : 'text-[#2a4535]/50 hover:text-[#2a4535]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {devConfig.useCustomPrompt && (
                <textarea
                  value={devConfig.customSystemInstruction}
                  onChange={(e) => setDevConfig({...devConfig, customSystemInstruction: e.target.value})}
                  className="w-full h-24 text-[10px] p-2 border border-[#c8bfad] rounded focus:ring-1 focus:ring-[#2a4535] focus:border-[#2a4535] font-mono"
                  placeholder="Enter system instructions here..."
                />
              )}
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          
          {/* Location Name Input MOVED TO DEV PANEL ABOVE */}

          {/* 1. Model Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#2a4535]/50 uppercase tracking-wider flex items-center gap-1">
              {model === 'gemini-3-pro-image-preview' ? <Sparkles className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
              {t.selectModel}
            </label>
            <div className="flex bg-[#e2d9cc] rounded-md p-1">
              <button
                onClick={() => setModel('gemini-2.5-flash-image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  model === 'gemini-2.5-flash-image'
                    ? 'bg-[#f8f3e8] text-[#2a4535] shadow-sm'
                    : 'text-[#2a4535]/50 hover:text-[#2a4535]'
                }`}
              >
                <Zap className="w-3 h-3" />
                {t.models.flash}
              </button>
              <button
                onClick={() => setModel('gemini-3.1-flash-image-preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  model === 'gemini-3.1-flash-image-preview'
                    ? 'bg-[#f8f3e8] text-[#2a4535] shadow-sm'
                    : 'text-[#2a4535]/50 hover:text-[#2a4535]'
                }`}
              >
                <Zap className="w-3 h-3" />
                {t.models.flash31}
              </button>
              <button
                onClick={() => setModel('gemini-3-pro-image-preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  model === 'gemini-3-pro-image-preview'
                    ? 'bg-[#f8f3e8] text-[#2a4535] shadow-sm'
                    : 'text-[#2a4535]/50 hover:text-[#2a4535]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {t.models.pro}
              </button>
            </div>
          </div>

          {/* 2. Aspect Ratio Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#2a4535]/50 uppercase tracking-wider flex items-center gap-1">
              <RectangleHorizontal className="w-3 h-3" /> {t.selectRatio}
            </label>
            <div className="flex bg-[#e2d9cc] rounded-md p-1 gap-1 overflow-x-auto no-scrollbar">
              {ratioOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAspectRatio(opt.id)}
                  title={opt.label}
                  className={`flex-1 flex-shrink-0 flex flex-col items-center justify-center py-1.5 px-1 min-w-[32px] rounded-md transition-all gap-0.5 ${
                    aspectRatio === opt.id
                      ? 'bg-[#f8f3e8] text-[#2a4535] shadow-sm ring-1 ring-[#2a4535]/15'
                      : 'text-[#2a4535]/50 hover:text-[#2a4535]/60 hover:bg-[#d4c9b8]/50'
                  }`}
                >
                  {opt.icon}
                  <span className="text-[8px] font-bold leading-none">{opt.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Style Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#2a4535]/50 uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3 h-3" /> {t.selectStyle}
            </label>
            <div className="flex flex-wrap gap-2">
              {currentStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    selectedStyleId === style.id
                      ? isSpinning
                        ? 'bg-[#c4892a] text-white border-[#c4892a] shadow-lg scale-110 ring-2 ring-[#e5b06e] ring-offset-1'
                        : 'bg-[#2a4535] text-[#f8f3e8] border-[#2a4535] shadow-md transform scale-105'
                      : 'bg-[#ede7d5] text-[#2a4535]/60 border-[#d4c9b8] hover:bg-[#e2d9cc]'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. User Photo Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#2a4535]/50 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> {t.uploadPhoto}
            </label>
            
            {!userImage ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border-2 border-dashed border-[#c8bfad] rounded-lg bg-[#ede7d5] hover:bg-[#2a4535]/5 hover:border-[#2a4535] transition-colors flex items-center justify-center gap-2 text-xs text-[#2a4535]/50 hover:text-[#2a4535]"
              >
                <Upload className="w-3.5 h-3.5" />
                {t.uploadHint}
              </button>
            ) : (
              <div className="relative w-full h-16 rounded-lg overflow-hidden border border-[#d4c9b8] group">
                <img src={userImage} alt="User" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setUserImage(undefined)}
                    className="px-2 py-1 bg-red-500 text-white rounded-md text-[10px] flex items-center gap-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" /> {t.removePhoto}
                  </button>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="pt-2 border-t border-[#d4c9b8]">
             {/* 5. Action Buttons */}
            {isProcessing ? (
               // GENERATING STATE
               <div className="flex flex-col items-center justify-center py-2 space-y-3">
                 <div className="w-6 h-6 border-2 border-[#2a4535]/15 border-t-[#2a4535] rounded-full animate-spin"></div>
                 <p className="text-[10px] font-medium text-[#2a4535] animate-pulse text-center">
                   {t.generating.replace('{style}', selectedStyle.label)}
                 </p>
               </div>
            ) : appState === AppState.COMPLETE ? (
               // COMPLETE STATE
               <div className="space-y-2 animate-in fade-in">
                  <button
                    onClick={() => onGenerate(selectedStyle.frontPrompt, selectedStyleId)} 
                    className="w-full py-2.5 bg-[#2a4535] hover:bg-[#3a5f4a] text-[#f8f3e8] font-semibold rounded-md transition-all active:scale-[0.98] shadow-[0_2px_12px_rgba(42,69,53,0.30)] hover:shadow-[0_4px_16px_rgba(42,69,53,0.38)] flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> {t.retry}
                  </button>
               </div>
            ) : (
               // IDLE, DRAWING, or REVIEWING STATE
               <div className="space-y-2">
                 <button
                   onClick={() => onGenerate(selectedStyle.frontPrompt, selectedStyleId)}
                   disabled={!isAreaSelected}
                   className={`w-full py-2.5 font-semibold rounded-md transition-all flex items-center justify-center gap-2 text-sm ${
                     isAreaSelected
                      ? 'bg-[#2a4535] hover:bg-[#3a5f4a] text-[#f8f3e8] active:scale-[0.98] shadow-[0_2px_12px_rgba(42,69,53,0.30)] hover:shadow-[0_4px_16px_rgba(42,69,53,0.38)]'
                      : 'bg-[#d4c9b8] text-[#2a4535]/50 cursor-not-allowed shadow-none'
                   }`}
                 >
                   {isAreaSelected ? <Wand2 className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
                   {isAreaSelected ? t.generate : t.drawPrompt}
                 </button>
                 
               </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 text-center animate-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {/* Activation Toast */}
          {showDevToast && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-in fade-in zoom-in duration-300">
                {t.devModeEnabled}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
