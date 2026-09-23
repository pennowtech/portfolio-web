import React, { useEffect, useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiKey, FiRefreshCw, FiServer, FiX, FiZap } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { AI_PERSONAS } from './aiPersonas';
import { DEFAULT_AI_CONFIG, loadAiConfig, saveAiConfig } from '@utils/admin/aiConfigStore';

const PROVIDER_PRESETS = {
  groq: {
    label: 'Groq (Ultra-Fast)',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    fallbackModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    defaultBaseUrl: 'https://api.openai.com/v1',
    fallbackModels: ['gpt-4o', 'gpt-4o-mini', 'o1-mini']
  },
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-3-5-sonnet-latest',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    fallbackModels: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']
  },
  ollama: {
    label: 'Ollama (Local)',
    defaultModel: 'deepseek-r1:14b',
    defaultBaseUrl: 'http://localhost:11434/v1',
    fallbackModels: ['deepseek-r1:14b', 'llama3.2:latest', 'qwen2.5-coder:7b']
  },
  mistral: {
    label: 'Mistral',
    defaultModel: 'mistral-large-latest',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    fallbackModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest']
  },
  gemini: {
    label: 'Gemini',
    defaultModel: 'gemini-2.0-flash',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    fallbackModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
  },
  builtin: {
    label: 'Built-in Rules (No API Key)',
    defaultModel: 'heuristic-transformer',
    defaultBaseUrl: '',
    fallbackModels: ['heuristic-transformer']
  }
};

export const AIConfigModal = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState(DEFAULT_AI_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [testingStatus, setTestingStatus] = useState(null); // 'testing' | 'success' | 'error' | null
  const [testMessage, setTestMessage] = useState('');
  const [fetchedModels, setFetchedModels] = useState(null); // null = not fetched yet this session
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setConfig(loadAiConfig());
    setFetchedModels(null);
    setModelsError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPreset = PROVIDER_PRESETS[config.provider] || PROVIDER_PRESETS.groq;
  const canListModels = config.provider !== 'builtin' && (config.provider === 'ollama' || config.apiKey.trim());
  const modelOptions = fetchedModels || currentPreset.fallbackModels;

  const fetchModels = async () => {
    if (!canListModels || modelsLoading) return;
    setModelsLoading(true);
    setModelsError('');
    try {
      const response = await fetch('/api/admin/ai-list-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.provider, apiKey: config.apiKey, baseUrl: config.baseUrl })
      });
      const result = await response.json();
      if (result.ok && Array.isArray(result.models) && result.models.length > 0) {
        setFetchedModels(result.models);
        // Keep the current model if it's still offered; otherwise default to the first real one.
        if (!result.models.includes(config.model)) {
          setConfig((p) => ({ ...p, model: result.models[0] }));
        }
      } else {
        setModelsError(result.message || 'Could not list models for this provider.');
      }
    } catch {
      setModelsError('Could not reach the server to list models.');
    } finally {
      setModelsLoading(false);
    }
  };

  const handleProviderChange = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    setConfig((prev) => ({
      ...prev,
      provider,
      model: preset?.defaultModel || prev.model,
      baseUrl: preset?.defaultBaseUrl ?? prev.baseUrl
    }));
    setFetchedModels(null);
    setModelsError('');
  };

  const togglePersona = (id) => {
    setConfig((prev) => ({
      ...prev,
      personas: prev.personas.includes(id) ? prev.personas.filter((p) => p !== id) : [...prev.personas, id]
    }));
  };

  const handleSave = () => {
    saveAiConfig(config);
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
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className='w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection & API Key */}
          {config.provider !== 'builtin' && (
            <div className='space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40'>
              {/* API key / base URL first -- models are fetched using whichever of these is set below */}
              {config.provider !== 'ollama' ? (
                <div>
                  <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>
                    API Key (Stored locally in browser)
                  </label>
                  <div className='relative'>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => {
                        setConfig((p) => ({ ...p, apiKey: e.target.value }));
                        setFetchedModels(null);
                        setModelsError('');
                      }}
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
              ) : (
                <div>
                  <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1'>
                    Ollama Base URL / IP
                  </label>
                  <div className='relative'>
                    <input
                      type='url'
                      value={config.baseUrl}
                      onChange={(e) => {
                        setConfig((p) => ({ ...p, baseUrl: e.target.value }));
                        setFetchedModels(null);
                        setModelsError('');
                      }}
                      placeholder='http://localhost:11434/v1'
                      className='w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    />
                    <FiServer className='absolute left-2.5 top-2 size-3.5 text-slate-400' />
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                <div>
                  <div className='mb-1 flex items-center justify-between gap-2'>
                    <label className='block font-semibold text-slate-700 dark:text-slate-200'>Target Model</label>
                    <button
                      type='button'
                      onClick={fetchModels}
                      disabled={!canListModels || modelsLoading}
                      title={
                        canListModels
                          ? 'Fetch the real list of models from this provider'
                          : 'Enter an API key (or Ollama URL) first'
                      }
                      className='inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-40 dark:text-purple-400 dark:hover:text-purple-200'
                    >
                      <FiRefreshCw className={`size-3 ${modelsLoading ? 'animate-spin' : ''}`} />
                      {fetchedModels ? 'Refresh' : 'Fetch models'}
                    </button>
                  </div>
                  <select
                    value={config.model}
                    onFocus={() => {
                      if (!fetchedModels) fetchModels();
                    }}
                    onChange={(e) => setConfig((p) => ({ ...p, model: e.target.value }))}
                    className='w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                  >
                    {modelOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {modelsError && <p className='mt-1 text-[10px] text-rose-600 dark:text-rose-400'>{modelsError}</p>}
                  {fetchedModels && !modelsError && (
                    <p className='mt-1 text-[10px] text-emerald-600 dark:text-emerald-400'>
                      {fetchedModels.length} live model(s) from the provider.
                    </p>
                  )}
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
            </div>
          )}

          {/* Persona Presets -- shared with the AI Rephrase popover, multi-select */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='block font-semibold text-slate-700 dark:text-slate-200'>Writing Tone Personas</label>
              <span className='text-[10px] text-slate-400'>{config.personas.length} selected</span>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
              {AI_PERSONAS.map((persona) => {
                const selected = config.personas.includes(persona.id);
                return (
                  <button
                    key={persona.id}
                    type='button'
                    onClick={() => togglePersona(persona.id)}
                    aria-pressed={selected}
                    className={`flex items-start gap-2 rounded-lg border p-2 text-left transition ${
                      selected
                        ? 'border-purple-500 bg-purple-50/60 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-500/60 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-3.5 shrink-0 place-items-center rounded border ${
                        selected
                          ? 'border-purple-500 bg-purple-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {selected && <FiCheck className='size-2.5' />}
                    </span>
                    <span className='min-w-0'>
                      <span className='block font-bold'>{persona.label}</span>
                      <span className='block text-[10px] text-slate-400 mt-0.5'>{persona.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className='mt-1.5 text-[10px] text-slate-400'>
              These are the defaults offered when you open AI Rephrase on selected text -- you can adjust the selection
              per-rephrase there too.
            </p>
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
