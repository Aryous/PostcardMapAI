
import React from 'react';
import { X, Trash2, Calendar, Zap, Sparkles, Image as ImageIcon } from 'lucide-react';
import { HistoryItem, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { STYLE_DEFS } from './ControlPanel';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  language: Language;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  history, 
  onSelect, 
  onDelete, 
  language 
}) => {
  const t = TRANSLATIONS[language];

  const getStyleLabel = (styleId: string) => {
    const style = STYLE_DEFS.find(s => s.id === styleId);
    if (!style) return styleId;
    return t.styles[style.id as keyof typeof t.styles] || styleId;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[1100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[1200] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="font-bold text-lg">{t.history}</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
              {history.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm">{t.noHistory}</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                onClick={() => onSelect(item)}
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer active:scale-[0.98]"
              >
                {/* Image Aspect Ratio Container */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt="History" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <div className="bg-black/40 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        {item.model.includes('pro') ? <Sparkles className="w-2.5 h-2.5 text-amber-300" /> : <Zap className="w-2.5 h-2.5 text-blue-300" />}
                        <span className="font-medium">{item.model.includes('pro') ? 'PRO' : 'FLASH'}</span>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => onDelete(item.id, e)}
                      className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-sm backdrop-blur-sm"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-800">
                      {getStyleLabel(item.styleId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
