
import React, { useState } from 'react';
import { Eye, EyeOff, ExternalLink, X } from 'lucide-react';
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
    envNote: '已有默认 API Key 可用，你也可以换成自己的。',
    placeholder: '粘贴你的 API Key（AIza...）',
    save: '保存并开始',
    getKey: '获取免费 API Key →',
    cancel: '取消',
    error: '请粘贴你的 Gemini API Key',
  },
  en: {
    title: 'Gemini API Key',
    subtitle: 'A Google Gemini API Key is required to generate postcards. Your key is stored locally in your browser and never sent to any server.',
    envNote: 'A default key is already configured. You can optionally override it with your own.',
    placeholder: 'Paste your API Key (AIza...)',
    save: 'Save & Start',
    getKey: 'Get a free API Key →',
    cancel: 'Cancel',
    error: 'Please paste your Gemini API Key to continue',
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
    <>
      <style>{`
        @keyframes apimodal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .apimodal-card {
          animation: apimodal-in 0.28s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .apimodal-card { animation: none; }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(30,24,16,0.78)', backdropFilter: 'blur(6px)' }}
      >
        <div
          className="apimodal-card relative w-full max-w-sm overflow-hidden"
          style={{
            background: '#f8f3e8',
            border: '1px solid rgba(196,137,42,0.22)',
            boxShadow: '0 16px 56px rgba(30,24,16,0.30), 0 2px 8px rgba(42,69,53,0.10)',
            fontFamily: "'DM Sans', sans-serif",
            borderRadius: 3,
          }}
        >
          {/* Top accent bar: forest → ochre */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #2a4535 0%, #c4892a 100%)' }} />

          <div className="p-6">
            {/* Close button — only when opened from settings */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1 text-[#1e1810]/35 hover:text-[#2a4535] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header */}
            <div className="mb-5">
              <h2
                className="text-xl font-bold text-[#1e1810] leading-tight mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
              >
                {t.title}
              </h2>
              <div style={{ width: 28, height: 2, background: '#c4892a', borderRadius: 1 }} />
            </div>

            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'rgba(30,24,16,0.62)' }}>
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
                className="w-full pr-10 pl-3 py-2.5 text-sm focus:outline-none text-[#1e1810]"
                style={{
                  background: '#ffffff',
                  border: `1px solid ${error ? '#b83535' : 'rgba(42,69,53,0.32)'}`,
                  borderRadius: 2,
                  fontFamily: "'DM Mono', 'Courier New', monospace",
                  fontSize: 12.5,
                  color: '#1e1810',
                  boxShadow: 'inset 0 1px 3px rgba(30,24,16,0.05)',
                  transition: 'border-color 0.15s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(30,24,16,0.35)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2a4535'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(30,24,16,0.35)'; }}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {error && (
              <p className="text-xs mb-3 pl-0.5" style={{ color: '#b83535' }}>{error}</p>
            )}

            {/* Get key link */}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mb-5 mt-2 transition-colors"
              style={{ fontSize: 11.5, color: '#c4892a', fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#a06e1a'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#c4892a'; }}
            >
              {t.getKey} <ExternalLink className="w-3 h-3" />
            </a>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(42,69,53,0.18)', marginBottom: 16 }} />

            {/* Actions */}
            <div className="flex gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(42,69,53,0.22)',
                    borderRadius: 2,
                    color: 'rgba(30,24,16,0.65)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,69,53,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {t.cancel}
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  background: '#2a4535',
                  borderRadius: 2,
                  color: '#f8f3e8',
                  fontFamily: "'DM Sans', sans-serif",
                  border: 'none',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3a5f4a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a4535'; }}
              >
                {t.save}
              </button>
            </div>

            {/* Reset to env key option */}
            {hasEnvKey && onClose && (
              <button
                onClick={handleClearAndUseEnv}
                className="w-full mt-3 py-1 text-center transition-colors"
                style={{ fontSize: 11, color: 'rgba(30,24,16,0.40)', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.color = '#2a4535';
                  b.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.color = 'rgba(30,24,16,0.40)';
                  b.style.opacity = '1';
                }}
              >
                {language === 'zh' ? '恢复使用默认 Key' : 'Reset to default key'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApiKeyModal;
