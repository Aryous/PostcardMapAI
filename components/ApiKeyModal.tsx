
import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, X } from 'lucide-react';
import { Language } from '../types';

interface ApiKeyModalProps {
  language: Language;
  hasServerKey: boolean;
  onSave: (key: string) => void;
  onUseServerKey?: () => void;
  onClose?: () => void;   // undefined = first-time setup (can't dismiss)
}

const T = {
  zh: {
    title: 'Gemini API Key',
    subtitle: '需要 Google Gemini API Key 才能生成明信片。你输入的 Key 仅保存在当前浏览器会话中，并会直接从你的设备发送给 Gemini。',
    serverNote: '已检测到服务器端默认 Key。它保存在 Vercel Function 中，不会暴露给浏览器；你也可以临时改用自己的 Key。',
    placeholder: '粘贴你的 API Key（AIza...）',
    save: '保存并使用我的 Key',
    getKey: '获取免费 API Key →',
    cancel: '取消',
    error: 'Key 不能为空',
    reset: '恢复使用服务器端 Key',
  },
  en: {
    title: 'Gemini API Key',
    subtitle: 'A Google Gemini API Key is required to generate postcards. Any key you enter is stored only for this browser session and sent directly to Gemini from your device.',
    serverNote: 'A server-side default key is available. It stays inside the Vercel Function and is never exposed to the browser; you can still override it with your own key.',
    placeholder: 'Paste your API Key (AIza...)',
    save: 'Save & Use My Key',
    getKey: 'Get a free API Key →',
    cancel: 'Cancel',
    error: 'Key cannot be empty',
    reset: 'Use server key instead',
  },
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ language, hasServerKey, onSave, onUseServerKey, onClose }) => {
  const t = T[language];

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

  const handleClearAndUseServerKey = () => {
    sessionStorage.removeItem('gemini_api_key');
    onUseServerKey?.();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,15,35,0.70)', backdropFilter: 'blur(8px)' }}>
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          background: 'rgba(238,240,255,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(99,102,241,0.28)',
        }}
      >
        {/* Close button — only when opened from settings */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-100">
            <Key className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-indigo-900">{t.title}</h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {hasServerKey ? t.serverNote : t.subtitle}
        </p>

        {/* Input */}
        <div className="relative mb-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={t.placeholder}
            className="w-full pr-10 pl-3 py-2.5 rounded-xl text-sm bg-white/80 border border-indigo-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-slate-800 placeholder-slate-400 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
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
          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mb-5 mt-2"
        >
          {t.getKey} <ExternalLink className="w-3 h-3" />
        </a>

        {/* Actions */}
        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-white/60 hover:bg-white border border-slate-200 transition-colors"
            >
              {t.cancel}
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm"
          >
            {t.save}
          </button>
        </div>

        {/* Reset to the secure server-side key when available */}
        {hasServerKey && onUseServerKey && (
          <button
            onClick={handleClearAndUseServerKey}
            className="w-full mt-2 text-xs text-slate-400 hover:text-indigo-500 transition-colors py-1"
          >
            {t.reset}
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiKeyModal;
