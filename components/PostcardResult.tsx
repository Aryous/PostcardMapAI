
import React, { useState, useEffect, useMemo } from 'react';
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
}

const PostcardResult: React.FC<PostcardResultProps> = ({ 
  imageUrl, 
  backImageUrl,
  onClose, 
  language, 
  skipAnimation = false, 
  aspectRatio = '4:3',
  locationName = 'MapPostcard',
  usageStats
}) => {
  const [animationStage, setAnimationStage] = useState<'envelope' | 'opening' | 'revealing' | 'settling' | 'done'>('envelope');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (skipAnimation) {
      setAnimationStage('done');
      setIsExpanded(true);
      return;
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

  const containerClasses = isExpanded 
    ? "fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300"
    : "fixed bottom-4 right-4 z-[1500] pointer-events-none";

  // Adaptive sizing for the minimized card
  const minimizedClasses = "w-48 sm:w-64 md:w-72"; 
  
  const cardContainerClasses = isExpanded
    ? `relative w-full max-w-4xl max-h-[85vh] ${aspectRatioClass} pointer-events-auto transition-all duration-500 transform scale-100 rotate-0 perspective-1000`
    : `relative ${minimizedClasses} ${aspectRatioClass} pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right cursor-pointer ${
        animationStage === 'envelope' ? 'opacity-0 translate-y-full' :
        animationStage === 'opening' ? 'opacity-100' :
        animationStage === 'done' ? 'transform rotate-2 hover:rotate-0 hover:scale-105 hover:-translate-y-2' : ''
      }`;

  // Envelope Components
  if (animationStage !== 'done' && !isExpanded) {
    return (
      <div className={`fixed bottom-6 right-6 z-[1500] ${minimizedClasses} aspect-[3/2] perspective-1000`}>
        <div 
          className={`relative w-full h-full transition-all duration-700 preserve-3d ${
            animationStage === 'settling' ? 'animate-[envelope-drop_0.8s_forwards]' : 'animate-[envelope-in_0.8s_ease-out_forwards]'
          }`}
        >
          {/* Envelope Body (Back) */}
          <div className="absolute inset-0 bg-[#e6dac8] shadow-2xl rounded-sm border-2 border-[#d4c5b0] flex items-end justify-center overflow-hidden">
             {/* Airmail stripes */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10" 
                  style={{backgroundImage: 'repeating-linear-gradient(45deg, #b91c1c 0, #b91c1c 10px, #f8fafc 10px, #f8fafc 20px, #1d4ed8 20px, #1d4ed8 30px, #f8fafc 30px, #f8fafc 40px)'}}>
             </div>
          </div>

          {/* Postcard (Inside) */}
          <div 
            className={`absolute top-2 left-2 right-2 bottom-2 bg-white shadow-md transition-transform duration-700 ease-in-out z-10 ${
              animationStage === 'revealing' || animationStage === 'settling' ? 'translate-y-[-120%]' : 'translate-y-0'
            }`}
          >
             <img src={imageUrl} className="w-full h-full object-cover" alt="Generated Postcard" />
          </div>

          {/* Envelope Front (Bottom pocket) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
             <div className="absolute bottom-0 left-0 w-full h-3/4 bg-[#f0e6d6] shadow-inner" 
                  style={{clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)'}}></div>
          </div>

          {/* Envelope Flap (Top) */}
          <div 
            className={`absolute top-0 left-0 w-full h-1/2 origin-top z-30 transition-transform duration-500 ease-in-out ${
              animationStage === 'opening' || animationStage === 'revealing' || animationStage === 'settling' ? 'rotate-x-180' : ''
            }`}
            style={{transformStyle: 'preserve-3d'}}
          >
            <div className="absolute inset-0 bg-[#e6dac8] border-t-2 border-[#d4c5b0]" 
                 style={{clipPath: 'polygon(0 0, 50% 100%, 100% 0)', backfaceVisibility: 'hidden'}}>
            </div>
             {/* Inner flap color (visible when open) */}
            <div className="absolute inset-0 bg-[#f5efe6]" 
                 style={{clipPath: 'polygon(0 0, 50% 100%, 100% 0)', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden'}}>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final Result Card with Flip
  return (
    <div className={containerClasses} onClick={() => isExpanded && setIsExpanded(false)}>
      
      {/* Cost Breakdown Panel - Separate UI */}
      {isExpanded && usageStats && (
        <div 
            className="absolute top-4 left-4 z-[2100] bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 min-w-[220px] border border-white/50 animate-in slide-in-from-left-4 fade-in duration-500 cursor-default"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-full shadow-sm">
                    <Coins className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">{t.cost}</span>
            </div>

            {/* Details */}
            <div className="space-y-3">
                {/* Input */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-medium">
                        <span>{t.input}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{usageStats.promptTokens.toLocaleString()} tks</span>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-700 font-medium tracking-tight">
                        ${usageStats.inputCost.toFixed(5)}
                    </div>
                </div>

                {/* Output */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-medium">
                        <span>{t.output}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{usageStats.candidatesTokens.toLocaleString()} tks</span>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-700 font-medium tracking-tight">
                        ${usageStats.outputCost.toFixed(5)}
                    </div>
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-800">{t.total}</span>
                    <span className="font-mono text-sm font-bold text-emerald-600 tracking-tight">
                        ${usageStats.totalCost.toFixed(5)}
                    </span>
                </div>
            </div>
        </div>
      )}

      <div 
        className={`${cardContainerClasses}`}
        onClick={(e) => !isExpanded && setIsExpanded(true)}
      >
         {/* 3D Wrapper */}
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d preserve-3d shadow-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT SIDE */}
            <div className="absolute inset-0 backface-hidden postcard-shadow bg-white">
                <div className="relative w-full h-full overflow-hidden group flex items-center justify-center">
                    <img 
                        src={imageUrl} 
                        alt="Postcard Front" 
                        className="w-full h-full object-cover" 
                    />
                    
                    {/* Overlay Actions (Hover) - Front */}
                    <div className={`absolute inset-0 bg-black/0 transition-colors flex items-start justify-end p-2 duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="flex gap-2">
                            {backImageUrl && (
                                <button 
                                    onClick={handleFlip}
                                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-indigo-600 transition-transform hover:scale-110"
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
                            {isExpanded && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-600 transition-transform hover:scale-110"
                                    title={t.close}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
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
            <div className="absolute inset-0 backface-hidden rotate-y-180 paper-texture postcard-shadow bg-[#fcfaf5]">
                {backImageUrl ? (
                     <div className="relative w-full h-full overflow-hidden group flex items-center justify-center">
                        <img 
                            src={backImageUrl} 
                            alt="Postcard Back" 
                            className="w-full h-full object-cover" 
                        />
                         {/* Overlay Actions (Hover) - Back */}
                        <div className={`absolute inset-0 bg-black/0 transition-colors flex items-start justify-end p-2 duration-200 opacity-100`}>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleFlip}
                                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-indigo-600 transition-transform hover:scale-110"
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
                                {isExpanded && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                                        className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-600 transition-transform hover:scale-110"
                                        title={t.close}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                         No Back Design
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostcardResult;
