
import React, { useState, useCallback, useRef } from 'react';
import LandingPage from './components/LandingPage';
import PostcardMap from './components/PostcardMap';
import ControlPanel, { STYLE_DEFS } from './components/ControlPanel';
import PostcardResult from './components/PostcardResult';
import HistoryPanel from './components/HistoryPanel';
import LuckyDice from './components/LuckyDice';
import ApiKeyModal from './components/ApiKeyModal';
import { AppState, Language, ModelType, HistoryItem, AspectRatio, DevConfig, UsageStats } from './types';
import { generatePostcard, generatePostcardBack } from './services/geminiService';
import { captureMapElement } from './utils/mapUtils';
import { getRandomLocation } from './utils/locations';
import { TRANSLATIONS } from './utils/translations';
import { Key } from 'lucide-react';

function parseGeminiError(raw: string, lang: Language): string {
  // Extract the human-readable message buried inside raw JSON responses
  let msg = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) msg = parsed.error.message;
    else if (parsed?.message)   msg = parsed.message;
  } catch { /* not JSON, use raw */ }

  const zh = lang === 'zh';
  if (/api.?key.?expired/i.test(msg))
    return zh ? 'API Key 已过期，请在设置中更新。' : 'Your API key has expired. Please update it in settings.';
  if (/api.?key.?invalid|invalid.?api.?key/i.test(msg))
    return zh ? 'API Key 无效，请检查是否正确粘贴。' : 'Invalid API key. Please check that you pasted it correctly.';
  if (/quota|resource.?exhausted/i.test(msg))
    return zh ? 'API 配额已耗尽，请稍后再试或更换 Key。' : 'API quota exhausted. Try again later or use a different key.';
  if (/too.?many.?requests|rate.?limit/i.test(msg))
    return zh ? '请求太频繁，请稍等片刻后重试。' : 'Too many requests. Please wait a moment and try again.';
  if (/permission.?denied|forbidden|403/i.test(msg))
    return zh ? 'API Key 权限不足，请确认已启用 Gemini API。' : 'Permission denied. Check that the Gemini API is enabled for your key.';
  if (/service.?unavailable|503/i.test(msg))
    return zh ? 'Gemini 服务暂时不可用，请稍后重试。' : 'Gemini service is temporarily unavailable. Please try again.';
  if (/network|fetch|ECONNREFUSED|ERR_/i.test(msg))
    return zh ? '网络连接失败，请检查网络后重试。' : 'Network error. Please check your connection and try again.';
  if (/timeout/i.test(msg))
    return zh ? '请求超时，请重试。' : 'Request timed out. Please try again.';
  if (/safety|content.?policy|harm/i.test(msg))
    return zh ? '内容被安全过滤拦截，请尝试其他地图区域。' : 'Content blocked by safety filter. Try a different map area.';
  // Trim to at most 80 chars to avoid wall-of-text fallback
  const clean = msg.replace(/\{.*\}/, '').trim();
  return clean.length > 0 && clean.length <= 120
    ? clean
    : (zh ? '生成失败，请重试。' : 'Generation failed. Please try again.');
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined);
  const [generatedBackImage, setGeneratedBackImage] = useState<string | undefined>(undefined);
  const [generatedAspectRatio, setGeneratedAspectRatio] = useState<AspectRatio>('4:3');
  const [currentUsageStats, setCurrentUsageStats] = useState<UsageStats | undefined>(undefined);
  const [sessionCost, setSessionCost] = useState<number>(0);

  const [errorRaw, setErrorRaw] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<Language>('zh');
  const error = errorRaw ? parseGeminiError(errorRaw, language) : undefined;
  const [targetLocation, setTargetLocation] = useState<{lat: number, lng: number, zoom: number} | undefined>(undefined);
  
  // Stores the detected or manually entered location name
  const [locationName, setLocationName] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const [model, setModel] = useState<ModelType>('gemini-3-pro-image-preview');
  const [userImage, setUserImage] = useState<string | undefined>(undefined);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:3');
  
  // Developer Mode Config
  const [devConfig, setDevConfig] = useState<DevConfig>({
    useCustomPrompt: false,
    customSystemInstruction: "创建一张精美的明信片，要有aa高级感，人物aa自然融入明信片中，适当调整人物表情、服装和姿势，以便更好的融入明信片风格。明信片中需要自然融入当地风光和背景aa地图。",
    useV2Prompt: false // Default to Non-Strict (Artistic Mode)
  });
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [historyOriginRect, setHistoryOriginRect] = useState<DOMRect | undefined>(undefined);
  const [pendingStyleId, setPendingStyleId] = useState<string | null>(null);
  const [isLuckyInProgress, setIsLuckyInProgress] = useState(false);

  // API Key modal — never block on load, only open on demand or auth error
  const hasKey = !!(sessionStorage.getItem('gemini_api_key') || process.env.API_KEY);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
  };

  const handleMapSelection = useCallback((detectedName: string) => {
    setAppState(AppState.REVIEWING);
    setLocationName(detectedName); 
    setErrorRaw(undefined);
  }, []);

  const handleGenerate = useCallback(async (prompt: string, styleId: string, overrideLocationName?: string) => {
    try {
      setAppState(AppState.GENERATING);
      setErrorRaw(undefined);
      setSkipAnimation(false);
      setCurrentUsageStats(undefined);

      if (model === 'gemini-3-pro-image-preview') {
         const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
         if (!hasKey) {
             await (window as any).aistudio?.openSelectKey();
         }
      }

      // 1. Capture Map (once — shared between primary attempt and fallback)
      await new Promise(resolve => setTimeout(resolve, 800));
      const mapBase64 = await captureMapElement('map-container');

      // 2. Determine Name
      const nameToUse = overrideLocationName !== undefined ? overrideLocationName : locationName;

      // 3. Generate — with automatic fallback from Pro → Flash 3.1 on permission errors
      let activeModel = model;
      let frontResult, backResult;
      try {
        [frontResult, backResult] = await Promise.all([
          generatePostcard(mapBase64, prompt, activeModel, userImage, aspectRatio, devConfig, nameToUse),
          generatePostcardBack(STYLE_DEFS.find(s => s.id === styleId)?.backPrompt ?? '', activeModel, aspectRatio)
        ]);
      } catch (innerErr: any) {
        const innerRaw = innerErr.message || '';
        if (activeModel === 'gemini-3-pro-image-preview' && /403|PERMISSION_DENIED/i.test(innerRaw)) {
          // Pro requires a paid key — silently fall back to Flash 3.1
          activeModel = 'gemini-3.1-flash-image-preview';
          setModel(activeModel);
          [frontResult, backResult] = await Promise.all([
            generatePostcard(mapBase64, prompt, activeModel, userImage, aspectRatio, devConfig, nameToUse),
            generatePostcardBack(STYLE_DEFS.find(s => s.id === styleId)?.backPrompt ?? '', activeModel, aspectRatio)
          ]);
        } else {
          throw innerErr;
        }
      }
      setGeneratedImage(frontResult!.imageUrl);
      setGeneratedBackImage(backResult?.imageUrl || undefined);
      setGeneratedAspectRatio(aspectRatio);

      // 4. Calculate Combined Cost (Front + Back)
      const frontUsage = frontResult!.usage;
      const backUsage = backResult?.usage;

      const combinedStats: UsageStats = {
        promptTokens: frontUsage.promptTokens + (backUsage?.promptTokens || 0),
        candidatesTokens: frontUsage.candidatesTokens + (backUsage?.candidatesTokens || 0),
        inputCost: frontUsage.inputCost + (backUsage?.inputCost || 0),
        outputCost: frontUsage.outputCost + (backUsage?.outputCost || 0),
        totalCost: frontUsage.totalCost + (backUsage?.totalCost || 0),
        currency: 'USD'
      };

      setCurrentUsageStats(combinedStats);
      setSessionCost(prev => prev + combinedStats.totalCost);

      setAppState(AppState.COMPLETE);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        imageUrl: frontResult!.imageUrl,
        backImageUrl: backResult?.imageUrl || undefined,
        timestamp: Date.now(),
        styleId: styleId,
        model: activeModel,
        cost: combinedStats,
        locationName: nameToUse || undefined,
        aspectRatio: aspectRatio
      };
      saveHistory([newItem, ...history]);

    } catch (err: any) {
      console.error("Generation pipeline failed:", err);
      const raw = err.message || JSON.stringify(err);

      // Open API key modal when key is missing, invalid, or expired
      if (/API Key is missing|API_KEY_INVALID|api.?key.?invalid|api.?key.?expired/i.test(raw)) {
        setShowApiKeyModal(true);
        setApiKeyError(true);
      }
      // AI Studio pro-model flow
      if (model === 'gemini-3-pro-image-preview' && /403|PERMISSION_DENIED/i.test(raw)) {
        setTimeout(() => { (window as any).aistudio?.openSelectKey(); }, 1500);
      }

      setErrorRaw(raw);
      setAppState(AppState.REVIEWING);
    }
  }, [model, language, history, userImage, aspectRatio, devConfig, locationName]);

  const luckyInProgressRef = useRef(false);

  const handleLucky = useCallback(async () => {
    if (luckyInProgressRef.current) return;
    luckyInProgressRef.current = true;
    setIsLuckyInProgress(true);

    const loc = getRandomLocation();
    setTargetLocation(loc);

    setLocationName(loc.name);

    setGeneratedImage(undefined);
    setGeneratedBackImage(undefined);
    setCurrentUsageStats(undefined);
    setErrorRaw(undefined);
    setAppState(AppState.IDLE);

    const randomStyle = STYLE_DEFS[Math.floor(Math.random() * STYLE_DEFS.length)];
    setPendingStyleId(randomStyle.id);

    setTimeout(async () => {
        setPendingStyleId(null);
        await handleGenerate(randomStyle.frontPrompt, randomStyle.id, loc.name);
        luckyInProgressRef.current = false;
        setIsLuckyInProgress(false);
    }, 4500);

  }, [handleGenerate]);


  const handleCloseResult = useCallback(() => {
    setGeneratedImage(undefined);
    setGeneratedBackImage(undefined);
    setHistoryOriginRect(undefined);
  }, []);

  const handleSelectHistory = useCallback((item: HistoryItem, originRect: DOMRect) => {
    setGeneratedImage(item.imageUrl);
    setGeneratedBackImage(item.backImageUrl);
    setCurrentUsageStats(item.cost);
    if (item.aspectRatio) setGeneratedAspectRatio(item.aspectRatio);
    setSkipAnimation(true);
    setHistoryOriginRect(originRect);
    setShowHistory(false);
  }, []);

  const handleDeleteHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    saveHistory(newHistory);
  }, [history]);

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#ede7d5]">
      <PostcardMap
        appState={appState}
        aspectRatio={aspectRatio}
        locationName={locationName}
        onMapSelection={handleMapSelection}
        targetLocation={targetLocation}
        language={language}
      />
      
      <ControlPanel
        appState={appState}
        onGenerate={handleGenerate}

        onToggleHistory={() => setShowHistory(true)}
        error={error}
        language={language}
        setLanguage={setLanguage}
        model={model}
        setModel={setModel}
        userImage={userImage}
        setUserImage={setUserImage}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        devConfig={devConfig}
        setDevConfig={setDevConfig}
        locationName={locationName}
        setLocationName={setLocationName}
        sessionCost={sessionCost}
        pendingStyleId={pendingStyleId}
        isLuckyInProgress={isLuckyInProgress}
      />

      <LuckyDice
        onLucky={handleLucky}
        isLoading={isLuckyInProgress || appState === AppState.GENERATING}
        label={TRANSLATIONS[language].lucky}
      />

      <HistoryPanel 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        language={language}
      />

      {generatedImage && (
        <PostcardResult
          imageUrl={generatedImage}
          backImageUrl={generatedBackImage}
          onClose={handleCloseResult}
          language={language}
          skipAnimation={skipAnimation}
          aspectRatio={generatedAspectRatio}
          locationName={locationName}
          usageStats={currentUsageStats}
          originRect={historyOriginRect}
        />
      )}

      {/* API Key config button — bottom-left corner */}
      <button
        onClick={() => setShowApiKeyModal(true)}
        className="absolute bottom-4 left-4 z-[1000] p-2 rounded-full bg-black/30 hover:bg-[#2a4535]/80 backdrop-blur-md text-white/60 hover:text-white transition-all duration-200 shadow-lg ring-1 ring-white/10"
        title={language === 'zh' ? '配置 API Key' : 'Configure API Key'}
      >
        <Key className="w-3.5 h-3.5" />
        {!hasKey && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#c4892a] border border-white/60" />
        )}
      </button>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          language={language}
          onSave={() => { setShowApiKeyModal(false); setApiKeyError(false); }}
          onClose={() => { setShowApiKeyModal(false); setApiKeyError(false); }}
          keyError={apiKeyError}
        />
      )}
    </div>
  );
}
