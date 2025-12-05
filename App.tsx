
import React, { useState, useCallback, useEffect } from 'react';
import PostcardMap from './components/PostcardMap';
import ControlPanel, { STYLE_DEFS } from './components/ControlPanel';
import PostcardResult from './components/PostcardResult';
import HistoryPanel from './components/HistoryPanel';
import LuckyDice from './components/LuckyDice';
import { AppState, Language, ModelType, HistoryItem, AspectRatio, DevConfig } from './types';
import { generatePostcard, generatePostcardBack } from './services/geminiService';
import { captureMapElement } from './utils/mapUtils';
import { getRandomLocation } from './utils/locations';
import { TRANSLATIONS } from './utils/translations';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined);
  const [generatedBackImage, setGeneratedBackImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<Language>('zh');
  const [targetLocation, setTargetLocation] = useState<{lat: number, lng: number, zoom: number} | undefined>(undefined);
  
  // Stores the detected or manually entered location name
  const [locationName, setLocationName] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const [model, setModel] = useState<ModelType>('gemini-2.5-flash-image');
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('postcard_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load history", e);
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      const limitedHistory = newHistory.slice(0, 5); 
      localStorage.setItem('postcard_history', JSON.stringify(limitedHistory));
    } catch (e) {
      console.warn("Failed to save history (likely quota exceeded)", e);
    }
  };

  // Called when user finishes drawing a box on the map
  // NOW ACCEPTS THE DETECTED NAME AUTOMATICALLY
  const handleMapSelection = useCallback((detectedName: string) => {
    setAppState(AppState.REVIEWING);
    // Auto-fill the detected name from Nominatim
    setLocationName(detectedName); 
    setError(undefined);
  }, []);

  const handleGenerate = useCallback(async (prompt: string, styleId: string, overrideLocationName?: string) => {
    try {
      setAppState(AppState.GENERATING);
      setError(undefined);
      setSkipAnimation(false);

      if (model === 'gemini-3-pro-image-preview') {
         const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
         if (!hasKey) {
             await (window as any).aistudio?.openSelectKey();
         }
      }
      
      // 1. Capture Map
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const mapBase64 = await captureMapElement('map-container');

      // 2. Determine Name
      // Use override if provided, otherwise state
      const nameToUse = overrideLocationName !== undefined ? overrideLocationName : locationName;

      // 3. Generate
      const [frontResult, backResult] = await Promise.all([
        generatePostcard(mapBase64, prompt, model, userImage, aspectRatio, devConfig, nameToUse),
        generatePostcardBack(styleId, model, aspectRatio)
      ]);
      
      setGeneratedImage(frontResult);
      setGeneratedBackImage(backResult || undefined);
      setAppState(AppState.COMPLETE);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        imageUrl: frontResult,
        backImageUrl: backResult || undefined,
        timestamp: Date.now(),
        styleId: styleId,
        model: model
      };
      saveHistory([newItem, ...history]);

    } catch (err: any) {
      console.error("Generation pipeline failed:", err);
      const errorMessage = err.message || JSON.stringify(err);
      if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
        if (model === 'gemini-3-pro-image-preview') {
           setError(language === 'zh' ? "权限不足。请选择有效的付费 API Key。" : "Permission denied. Please select a valid paid API Key.");
           setTimeout(() => { (window as any).aistudio?.openSelectKey(); }, 1500);
        } else {
           setError(language === 'zh' ? "API Key 权限不足。" : "Permission denied. Please check your API Key.");
        }
      } else {
        setError(err.message || "Something went wrong during generation.");
      }
      setAppState(AppState.REVIEWING); 
    }
  }, [model, language, history, userImage, aspectRatio, devConfig, locationName]);

  const handleLucky = useCallback(async () => {
    // 1. Logic for Lucky Mode
    const loc = getRandomLocation();
    setTargetLocation(loc);
    
    // Update state for UI immediately
    setLocationName(loc.name);
    
    setGeneratedImage(undefined);
    setGeneratedBackImage(undefined);
    setError(undefined);
    setAppState(AppState.IDLE);

    // 2. Delay for fly animation + tile loading
    setTimeout(async () => {
        const randomStyle = STYLE_DEFS[Math.floor(Math.random() * STYLE_DEFS.length)];
        await handleGenerate(randomStyle.prompt, randomStyle.id, loc.name);
    }, 4500); 

  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    setAppState(AppState.DRAWING);
    setGeneratedImage(undefined);
    setGeneratedBackImage(undefined);
    setError(undefined);
    setLocationName(""); 
  }, []);

  const handleCloseResult = useCallback(() => {
    setGeneratedImage(undefined);
    setGeneratedBackImage(undefined);
  }, []);

  const handleSelectHistory = useCallback((item: HistoryItem) => {
    setGeneratedImage(item.imageUrl);
    setGeneratedBackImage(item.backImageUrl);
    setSkipAnimation(true);
    setShowHistory(false);
  }, []);

  const handleDeleteHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    saveHistory(newHistory);
  }, [history]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-50">
      <PostcardMap 
        appState={appState} 
        onMapSelection={handleMapSelection}
        targetLocation={targetLocation}
      />
      
      <ControlPanel 
        appState={appState}
        onGenerate={handleGenerate}
        onReset={handleReset}
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
      />

      <LuckyDice 
        onLucky={handleLucky} 
        isLoading={appState === AppState.IDLE && targetLocation !== undefined && generatedImage === undefined}
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
          aspectRatio={aspectRatio}
          locationName={locationName}
        />
      )}
    </div>
  );
}
