
import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, X } from 'lucide-react';
import { Language } from '../types';

interface ApiKeyModalProps {
  language: Language;
  onSave: (key: string) => void;
  onClose?: () => void;   // undefined = first-time setup (can't dismiss)
}

const T = {
  zh: {
    title: 'Gemini API Key',
    subtitle: '需要 Google Gemini API Key 才能生成明信片。Key 仅存储在你的浏览器本地，不会上传到任何服务器。',
    envNote: '管理员已通过环境变量配置了默认 Key，你也可以覆盖为自己的 Key。',
    placeholder: '粘贴你的 API Key（AIza...）',
    save: '保存并开始',
    getKey: '获取免费 API Key →',
    cancel: '取消',
    error: 'Key 不能为空',
  },
  en: {
    title: 'Gemini API Key',
    subtitle: 'A Google Gemini API Key is required to generate postcards. Your key is stored locally in your browser and never sent to any server.',
    envNote: 'A default key is already configured. You can optionally override it with your own.',
    placeholder: 'Paste your API Key (AIza...)',
    save: 'Save & Start',
    getKey: 'Get a free API Key →',
    cancel: 'Cancel',
    error: 'Key cannot be empty',
  },
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ language, onSave, onClose }) => {
  const t = T[language];
  const hasEnvKey = !!process.env.API_KEY;

  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t.error);
      return;
    }
    sessionStorage.setItem('gemini_api_key', trimmed);
    onSave(trimmed);
  };

  const handleClearAndUseEnv = () => {
    sessionStorage.removeItem('gemini_api_key');
    onSave('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(30,24,16,0.75)', backdropFilter: 'blur(8px)' }}>
      <div
        className="relative w-full max-w-md rounded-lg p-6 shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.99)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(42,69,53,0.06)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Close button — only when opened from settings */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#2a4535]/10 text-[#2a4535]/50 hover:text-[#2a4535] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-[#2a4535]/10">
            <Key className="w-5 h-5 text-[#2a4535]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1e1810]">{t.title}</h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {hasEnvKey ? t.envNote : t.subtitle}
        </p>

        {/* Input */}
        <div className="relative mb-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={t.placeholder}
            className="w-full pr-10 pl-3 py-2.5 rounded-md text-sm bg-white/90 border border-[#2a4535]/25 focus:outline-none focus:border-[#2a4535] focus:ring-2 focus:ring-[#2a4535]/20 text-[#1e1810] placeholder-slate-400 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2a4535]"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mb-3 pl-1">{error}</p>}

        {/* Get key link */}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#2a4535] hover:text-[#1a3228] mb-5 mt-2"
        >
          {t.getKey} <ExternalLink className="w-3 h-3" />
        </a>

        {/* Actions */}
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-md text-sm font-medium text-slate-500 bg-white/60 hover:bg-white border border-slate-200 transition-colors"
            >
              {t.cancel}
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-md text-sm font-semibold text-[#f8f3e8] bg-[#2a4535] hover:bg-[#3a5f4a] transition-colors shadow-sm"
          >
            {t.save}
          </button>
        </div>

        {/* Use env key option (only if env key exists and user wants to reset) */}
        {hasEnvKey && onClose && (
          <button
            onClick={handleClearAndUseEnv}
            className="w-full mt-2 text-xs text-slate-400 hover:text-[#2a4535] transition-colors py-1"
          >
            {language === 'zh' ? '恢复使用默认 Key' : 'Reset to default key'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiKeyModal;
