
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Wand2, RefreshCw, Palette, Zap, Sparkles, History, Upload, X, User, MousePointer2, RectangleHorizontal, RectangleVertical, Square, Settings, ChevronDown, ChevronUp, Type, Loader2, Coins } from 'lucide-react';
import { AppState, Language, ModelType, AspectRatio, DevConfig } from '../types';
import { TRANSLATIONS } from '../utils/translations';

// REFACTORED STYLE DEFINITIONS: Focus on Medium, Mood, and Lighting.
export const STYLE_DEFS = [
  { 
    id: 'vintage', 
    prompt: 'Style: 1950s Travel Poster. Medium: Lithograph / Screen Print. Features: Bold flat colors, grain texture, heavy retro typography header, nostalgic golden hour lighting. The map roads become charming winding streets.' 
  },
  { 
    id: 'ink', 
    prompt: 'Style: Traditional Chinese "Shan-Shui" & Architectural Art. Medium: Ink wash on aged Rice Paper. Features: Axonometric projection, delicate line work, desaturated earth tones (sage, ochre), red seal stamps. Atmospheric and poetic.' 
  },
  { 
    id: 'watercolor', 
    prompt: 'Style: Urban Sketching / Plein Air. Medium: Watercolor & Ink. Features: Loose wet-on-wet washes, paint splatters, unfinished edges, handwritten calligraphy typography. Dreamy, airy, and artistic.' 
  },
  { 
    id: 'cyberpunk', 
    prompt: 'Style: Sci-Fi Concept Art. Medium: Digital Painting. Features: Neon-soaked night, holographic map interface overlaying real city structures, glowing road networks, rain reflections, "Blade Runner" atmosphere.' 
  },
  { 
    id: 'sketch', 
    prompt: 'Style: Renaissance Architectural Study. Medium: Sepia Ink & Graphite on Parchment. Features: Detailed cross-hatching, construction lines, technical annotations, Da Vinci aesthetic. Precision meets art.' 
  },
  { 
    id: 'oil', 
    prompt: 'Style: Impressionist Masterpiece. Medium: Oil on Canvas. Features: Thick impasto texture (palette knife), visible brush strokes, vibrant light vibration, emotional landscape. Like a Van Gogh or Monet painting.' 
  },
];

interface ControlPanelProps {
  appState: AppState;
  onGenerate: (prompt: string, styleId: string) => void;
  onReset: () => void;
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
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  appState,
  onGenerate,
  onReset,
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
  sessionCost
}) => {
  const [selectedStyleId, setSelectedStyleId] = useState(STYLE_DEFS[0].id);
  
  // Dev Mode State
  const [isDevEnabled, setIsDevEnabled] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [showDevToast, setShowDevToast] = useState(false);

  const isProcessing = appState === AppState.GENERATING;
  const isAreaSelected = appState === AppState.REVIEWING || appState === AppState.GENERATING || appState === AppState.COMPLETE;
  
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Dev Mode state
  useEffect(() => {
    const storedDev = localStorage.getItem('map_postcard_dev_mode');
    if (storedDev === 'true') {
      setIsDevEnabled(true);
    }
  }, []);

  const handleTitleClick = () => {
    if (isDevEnabled) return;

    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);

    if (newCount >= 5) {
      setIsDevEnabled(true);
      setShowDevMode(true);
      setShowDevToast(true);
      localStorage.setItem('map_postcard_dev_mode', 'true');
      setTimeout(() => setShowDevToast(false), 2000);
    }
  };

  const currentStyles = useMemo(() => {
    return STYLE_DEFS.map(def => ({
      ...def,
      label: t.styles[def.id as keyof typeof t.styles]
    }));
  }, [language, t]);

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
      <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-white/50 max-h-[90vh] overflow-y-auto">
        
        {/* Header - Always Visible */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <div 
                className="flex items-center gap-2 text-indigo-700 cursor-pointer select-none active:scale-95 transition-transform"
                onClick={handleTitleClick}
                title={isDevEnabled ? "Developer Mode Active" : "MapPostcard AI"}
            >
                <MapPin className="w-4 h-4" />
                <span className="font-bold text-sm tracking-tight">{t.title}</span>
            </div>
            {sessionCost > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span>{t.sessionCost}: ${sessionCost.toFixed(3)}</span>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
             {/* Dev Mode Toggle (Hidden until activated) */}
             {isDevEnabled && (
                <button
                  onClick={() => setShowDevMode(!showDevMode)}
                  className={`p-1.5 rounded-full transition-colors ${showDevMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                  title="Developer Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
             )}

             {/* History Button */}
             <button 
                onClick={onToggleHistory}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors border border-slate-200"
                title={t.history}
             >
                <History className="w-3.5 h-3.5" />
             </button>

             {/* Language Toggle */}
             <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                title="Switch Language"
             >
                <span className={`text-xs ${language === 'en' ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}>🇺🇸</span>
                <span className="w-[1px] h-3 bg-slate-300"></span>
                <span className={`text-xs ${language === 'zh' ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}>🇨🇳</span>
             </button>
          </div>
        </div>

        {/* Developer Mode Panel */}
        {showDevMode && isDevEnabled && (
          <div className="bg-slate-50 border-b border-slate-200 p-3 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Settings className="w-3 h-3" /> {t.devMode}
              </span>
              <button onClick={() => setShowDevMode(false)}><ChevronUp className="w-3 h-3 text-slate-400" /></button>
            </div>
            
            {/* Location Name Input (Moved to Dev Mode) */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3" /> {language === 'zh' ? '地点名称 (调试)' : 'Location Name (Debug)'}
                </label>
                <div className="relative">
                    <input 
                    type="text" 
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder={isAreaSelected && !locationName ? (language === 'zh' ? '正在识别...' : 'Detecting...') : (language === 'zh' ? '手动输入' : 'Manual Input')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                    {isAreaSelected && !locationName && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* V2 Prompt Toggle */}
            <label className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-indigo-300">
               <span className="text-xs text-slate-600 font-medium">{t.v2Prompt}</span>
               <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${devConfig.useV2Prompt ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${devConfig.useV2Prompt ? 'translate-x-4' : 'translate-x-0'}`} 
                       onClick={(e) => {
                         e.preventDefault();
                         setDevConfig({...devConfig, useV2Prompt: !devConfig.useV2Prompt});
                       }}
                  />
               </div>
            </label>

            {/* Custom Prompt Toggle */}
            <div className="space-y-1">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={devConfig.useCustomPrompt}
                  onChange={(e) => setDevConfig({...devConfig, useCustomPrompt: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">{t.customPrompt}</span>
              </label>
              
              {devConfig.useCustomPrompt && (
                <textarea 
                  value={devConfig.customSystemInstruction}
                  onChange={(e) => setDevConfig({...devConfig, customSystemInstruction: e.target.value})}
                  className="w-full h-24 text-[10px] p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              {model === 'gemini-2.5-flash-image' ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {t.selectModel}
            </label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setModel('gemini-2.5-flash-image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  model === 'gemini-2.5-flash-image'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Zap className="w-3 h-3" />
                {t.models.flash}
              </button>
              <button
                onClick={() => setModel('gemini-3-pro-image-preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  model === 'gemini-3-pro-image-preview'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {t.models.pro}
              </button>
            </div>
          </div>

          {/* 2. Aspect Ratio Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <RectangleHorizontal className="w-3 h-3" /> {t.selectRatio}
            </label>
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1 overflow-x-auto no-scrollbar">
              {ratioOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAspectRatio(opt.id)}
                  title={opt.label}
                  className={`flex-1 flex-shrink-0 flex flex-col items-center justify-center py-1.5 px-1 min-w-[32px] rounded-md transition-all gap-0.5 ${
                    aspectRatio === opt.id
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3 h-3" /> {t.selectStyle}
            </label>
            <div className="flex flex-wrap gap-2">
              {currentStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    selectedStyleId === style.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. User Photo Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> {t.uploadPhoto}
            </label>
            
            {!userImage ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-600"
              >
                <Upload className="w-3.5 h-3.5" />
                {t.uploadHint}
              </button>
            ) : (
              <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-200 group">
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

          <div className="pt-2 border-t border-slate-100">
             {/* 5. Action Buttons */}
            {isProcessing ? (
               // GENERATING STATE
               <div className="flex flex-col items-center justify-center py-2 space-y-3">
                 <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-medium text-indigo-600 animate-pulse text-center">
                   {t.generating.replace('{style}', selectedStyle.label)}
                 </p>
               </div>
            ) : appState === AppState.COMPLETE ? (
               // COMPLETE STATE
               <div className="space-y-2 animate-in fade-in">
                  <button
                    onClick={() => onGenerate(selectedStyle.prompt, selectedStyleId)} 
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> {t.retry}
                  </button>
                  <div className="flex gap-2">
                    <button
                        onClick={onReset}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-lg transition-colors text-xs"
                      >
                        {t.newLocation}
                    </button>
                  </div>
               </div>
            ) : (
               // IDLE, DRAWING, or REVIEWING STATE
               <div className="space-y-2">
                 <button
                   onClick={() => onGenerate(selectedStyle.prompt, selectedStyleId)}
                   disabled={!isAreaSelected}
                   className={`w-full py-2.5 font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
                     isAreaSelected 
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white active:scale-95 shadow-indigo-200' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                   }`}
                 >
                   {isAreaSelected ? <Wand2 className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
                   {isAreaSelected ? t.generate : t.drawPrompt}
                 </button>
                 
                 {isAreaSelected && (
                    <button onClick={onReset} className="w-full text-[10px] text-slate-400 hover:text-red-500 font-medium transition-colors text-center">
                      {t.redraw}
                    </button>
                 )}
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
