import React, { useEffect, useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiKey, FiServer, FiSliders, FiX, FiZap } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';

const DEFAULT_AI_CONFIG = {
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  apiKey: '',
  baseUrl: 'https://api.groq.com/openai/v1',
  temperature: 0.3,
  systemPrompt:
    'You are a Principal Software Architect and elite technical writer. Provide crisp, pragmatic explanations with concrete code and no fluff.',
  tone: 'architecture'
};

const PROVIDER_PRESETS = {
  groq: {
    label: 'Groq (Ultra-Fast)',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini']
  },
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-3-5-sonnet-latest',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']
  },
  ollama: {
    label: 'Ollama (Local)',
    defaultModel: 'deepseek-r1:14b',
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: ['deepseek-r1:14b', 'llama3.2:latest', 'qwen2.5-coder:7b']
  },
  builtin: {
    label: 'Built-in Rules (No API Key)',
    defaultModel: 'heuristic-transformer',
    defaultBaseUrl: '',
    models: ['heuristic-transformer']
  }
};

const TONE_PRESETS = [
  { id: 'architecture', label: 'Architecture & Trade-offs', desc: 'Rigorous engineering depth with ADR style' },
  { id: 'concise', label: 'Crisp & Direct', desc: 'Short sentences, active voice, zero jargon' },
  { id: 'tutorial', label: 'Step-by-Step Guide', desc: 'Educational progression with clear checkpoints' },
  { id: 'deepdive', label: 'Systems Deep Dive', desc: 'Internal mechanics, memory, latency, and scale' }
];

export const AIConfigModal = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState(DEFAULT_AI_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [testingStatus, setTestingStatus] = useState(null); // 'testing' | 'success' | 'error' | null
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('article_studio_ai_config');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    setConfig((prev) => ({
      ...prev,
      provider,
      model: preset?.defaultModel || prev.model,
      baseUrl: preset?.defaultBaseUrl ?? prev.baseUrl
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('article_studio_ai_config', JSON.stringify(config));
    } catch {
      // ignore
    }
    onSave?.(config);
    onClose();
  };

  const handleTestConnection = async () => {
    if (config.provider === 'builtin') {
      setTestingStatus('success');
      setTestMessage('Built-in rules need no connection.');
      setTimeout(() => setTestingStatus(null), 3000);
      return;
    }
    const needsApiKey = config.provider !== 'ollama';
    if (needsApiKey && !config.apiKey.trim()) {
      setTestingStatus('error');
      setTestMessage('Enter an API key first.');
      setTimeout(() => setTestingStatus(null), 3000);
      return;
    }
    setTestingStatus('testing');
    try {
      const response = await fetch('/api/admin/ai-test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, apiKey: config.apiKey, baseUrl: config.baseUrl })
      });
      const result = await response.json();
      setTestingStatus(result.ok ? 'success' : 'error');
      setTestMessage(result.message || (result.ok ? 'Connected.' : 'Connection failed.'));
    } catch {
      setTestingStatus('error');
      setTestMessage('Could not reach the server to run the test.');
    }
    setTimeout(() => setTestingStatus(null), 4000);
  };

  const currentPreset = PROVIDER_PRESETS[config.provider] || PROVIDER_PRESETS.groq;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs'>
      <div
        className='w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white'
        role='dialog'
        aria-modal='true'
        aria-labelledby='ai-config-title'
      >
        {/* Modal Header */}
        <div className='flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800'>
          <div className='flex items-center gap-2.5'>
            <div className='grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'>
              <LuSparkles className='size-4' />
            </div>
            <div>
              <h3 id='ai-config-title' className='text-sm font-bold text-slate-900 dark:text-white leading-tight'>
                AI Assistant & Engine Settings
              </h3>
              <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                Configure provider, tone persona, and writing assistants
              </p>
            </div>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            aria-label='Close AI configuration'
          >
            <FiX className='size-4' />
          </button>
        </div>

        {/* Modal Body */}
        <div className='max-h-[70vh] overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs'>
          {/* Provider Selection */}
          <div>
            <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1.5'>
              AI Inference Provider
            </label>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-1.5'>
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => handleProviderChange(key)}
                  className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                    config.provider === key
                      ? 'border-purple-500 bg-purple-50/60 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-500/60 shadow-2xs'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
                  }`}
                >
                  <span className='font-bold truncate w-full'>{preset.label.split(' ')[0]}</span>
                  <span className='text-[10px] text-slate-400 truncate w-full'>
                    {preset.label.includes('(') ? preset.label.match(/\((.*?)\)/)?.[1] : 'Cloud API'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection & API Key */}
          {config.provider !== 'builtin' && (
            <div className='space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                <div>
                  <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>Target Model</label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig((p) => ({ ...p, model: e.target.value }))}
                    className='w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                  >
                    {currentPreset.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>
                    Temperature ({config.temperature})
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='1'
                    step='0.05'
                    value={config.temperature}
                    onChange={(e) => setConfig((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                    className='w-full accent-purple-600 mt-1 cursor-pointer'
                  />
                </div>
              </div>

              {config.provider !== 'ollama' && (
                <div>
                  <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>
                    API Key (Stored locally in browser)
                  </label>
                  <div className='relative'>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => setConfig((p) => ({ ...p, apiKey: e.target.value }))}
                      placeholder={`Enter your ${currentPreset.label.split(' ')[0]} API Key…`}
                      className='w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    />
                    <FiKey className='absolute left-2.5 top-2 size-3.5 text-slate-400' />
                    <button
                      type='button'
                      onClick={() => setShowKey((v) => !v)}
                      className='absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    >
                      {showKey ? <FiEyeOff className='size-3.5' /> : <FiEye className='size-3.5' />}
                    </button>
                  </div>
                </div>
              )}

              {config.provider === 'ollama' && (
                <div>
                  <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>Ollama Base URL</label>
                  <div className='relative'>
                    <input
                      type='url'
                      value={config.baseUrl}
                      onChange={(e) => setConfig((p) => ({ ...p, baseUrl: e.target.value }))}
                      placeholder='http://localhost:11434/v1'
                      className='w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    />
                    <FiServer className='absolute left-2.5 top-2 size-3.5 text-slate-400' />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tone Preset */}
          <div>
            <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1.5'>
              Writing Tone Persona
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
              {TONE_PRESETS.map((tone) => (
                <button
                  key={tone.id}
                  type='button'
                  onClick={() => setConfig((p) => ({ ...p, tone: tone.id }))}
                  className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                    config.tone === tone.id
                      ? 'border-purple-500 bg-purple-50/60 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-500/60 shadow-2xs'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
                  }`}
                >
                  <span className='font-bold'>{tone.label}</span>
                  <span className='text-[10px] text-slate-400 mt-0.5'>{tone.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom System Prompt */}
          <div>
            <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>System Persona Prompt</label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig((p) => ({ ...p, systemPrompt: e.target.value }))}
              rows={2}
              className='w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-purple-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className='flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
          <button
            type='button'
            onClick={handleTestConnection}
            disabled={testingStatus === 'testing'}
            title={testMessage || undefined}
            className='inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 disabled:opacity-50'
          >
            {testingStatus === 'testing' ? (
              <span className='animate-pulse'>Testing connection…</span>
            ) : testingStatus === 'success' ? (
              <span className='inline-flex items-center gap-1 text-emerald-600 font-semibold'>
                <FiCheck className='size-3.5' /> {testMessage || 'Connected'}
              </span>
            ) : testingStatus === 'error' ? (
              <span className='inline-flex items-center gap-1 text-rose-600 font-semibold'>
                <FiX className='size-3.5' /> {testMessage || 'Connection failed'}
              </span>
            ) : (
              <>
                <FiZap className='size-3.5' />
                <span>Test engine</span>
              </>
            )}
          </button>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSave}
              className='rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500'
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;
