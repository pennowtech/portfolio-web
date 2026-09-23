import React, { useEffect, useState } from 'react';
import { FiCheck, FiChevronDown, FiEye, FiEyeOff, FiKey, FiRefreshCw, FiServer, FiZap } from 'react-icons/fi';
import { AI_PERSONAS } from '../aiPersonas';
import { DEFAULT_AI_CONFIG, PROVIDER_IDS, loadAiConfig, saveAiConfig } from '@utils/admin/aiConfigStore';

const PROVIDER_META = {
  groq: {
    label: 'Groq',
    hint: 'Ultra-Fast',
    fallbackModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  openai: { label: 'OpenAI', hint: '', fallbackModels: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'] },
  anthropic: { label: 'Anthropic', hint: '', fallbackModels: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'] },
  ollama: {
    label: 'Ollama',
    hint: 'Local',
    fallbackModels: ['deepseek-r1:14b', 'llama3.2:latest', 'qwen2.5-coder:7b']
  },
  mistral: {
    label: 'Mistral',
    hint: '',
    fallbackModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest']
  },
  gemini: { label: 'Gemini', hint: '', fallbackModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  builtin: { label: 'Built-in Rules', hint: 'No API key needed', fallbackModels: ['heuristic-transformer'] }
};

// "Has credentials entered" -- used to gate the fetch/test actions. This is
// NOT the same as "verified working"; see block.validated for that.
const hasCredentials = (provider, block) => {
  if (provider === 'builtin') return true;
  if (provider === 'ollama') return Boolean(block.baseUrl?.trim());
  return Boolean(block.apiKey?.trim());
};

// One provider's card: its own key/baseUrl/model, its own fetched-models
// list and test-connection result -- fully independent of every other
// provider's block, so configuring or testing one never touches another's.
const ProviderCard = ({ provider, block, isActive, expanded, onToggleExpand, onSetActive, onChange }) => {
  const meta = PROVIDER_META[provider];
  const [showKey, setShowKey] = useState(false);
  const [fetchedModels, setFetchedModels] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [testingStatus, setTestingStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');

  const configured = hasCredentials(provider, block);
  const canListModels = provider !== 'builtin' && configured;
  const modelOptions = fetchedModels || meta.fallbackModels;

  const fetchModels = async () => {
    if (!canListModels || modelsLoading) return;
    setModelsLoading(true);
    setModelsError('');
    try {
      const response = await fetch('/api/admin/ai-list-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: block.apiKey, baseUrl: block.baseUrl })
      });
      const result = await response.json();
      if (result.ok && Array.isArray(result.models) && result.models.length > 0) {
        setFetchedModels(result.models);
      } else {
        setModelsError(result.message || 'Could not list models for this provider.');
      }
    } catch {
      setModelsError('Could not reach the server to list models.');
    } finally {
      setModelsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (provider === 'builtin') {
      setTestingStatus('success');
      setTestMessage('Built-in rules need no connection.');
      setTimeout(() => setTestingStatus(null), 3000);
      return;
    }
    if (!configured) {
      setTestingStatus('error');
      setTestMessage(provider === 'ollama' ? 'Enter a base URL first.' : 'Enter an API key first.');
      setTimeout(() => setTestingStatus(null), 3000);
      return;
    }
    setTestingStatus('testing');
    try {
      const response = await fetch('/api/admin/ai-test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: block.apiKey, baseUrl: block.baseUrl })
      });
      const result = await response.json();
      setTestingStatus(result.ok ? 'success' : 'error');
      setTestMessage(result.message || (result.ok ? 'Connected.' : 'Connection failed.'));
      // Only a real successful round-trip marks this provider as verified --
      // typing a key never does, however plausible-looking it is.
      onChange({ ...block, validated: Boolean(result.ok) });
    } catch {
      setTestingStatus('error');
      setTestMessage('Could not reach the server to run the test.');
      onChange({ ...block, validated: false });
    }
    setTimeout(() => setTestingStatus(null), 5000);
  };

  return (
    <div
      className={`rounded-xl border transition ${
        isActive
          ? 'border-purple-400 bg-purple-50/40 dark:border-purple-500/50 dark:bg-purple-950/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className='flex items-center gap-2 p-2.5'>
        <button
          type='button'
          onClick={() => onSetActive(provider)}
          title={isActive ? 'Active provider' : 'Set as active provider'}
          aria-label={isActive ? 'Active provider' : 'Set as active provider'}
          className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${
            isActive ? 'border-purple-600 bg-purple-600' : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {isActive && <span className='size-1.5 rounded-full bg-white' />}
        </button>

        <button
          type='button'
          onClick={onToggleExpand}
          className='flex flex-1 items-center justify-between gap-2 text-left'
        >
          <span className='flex items-center gap-1.5'>
            <span className='text-xs font-bold text-slate-800 dark:text-slate-100'>{meta.label}</span>
            {meta.hint && <span className='text-[10px] text-slate-400'>{meta.hint}</span>}
            {block.validated ? (
              <span className='inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'>
                <FiCheck className='size-2.5' /> Verified
              </span>
            ) : configured ? (
              <span className='rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'>
                Not verified
              </span>
            ) : (
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
                Not configured
              </span>
            )}
          </span>
          <span className='flex items-center gap-1.5 text-[10px] text-slate-400'>
            {configured && block.model}
            <FiChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </div>

      {expanded && (
        <div className='space-y-2.5 border-t border-slate-100 p-3 dark:border-slate-800'>
          {provider !== 'builtin' &&
            (provider !== 'ollama' ? (
              <div>
                <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1 text-xs'>
                  API Key (stored locally in browser)
                </label>
                <div className='relative'>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={block.apiKey}
                    onChange={(e) => {
                      onChange({ ...block, apiKey: e.target.value, validated: false });
                      setFetchedModels(null);
                      setModelsError('');
                    }}
                    placeholder={`Enter your ${meta.label} API key…`}
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
                <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1 text-xs'>
                  Ollama Base URL / IP
                </label>
                <div className='relative'>
                  <input
                    type='url'
                    value={block.baseUrl}
                    onChange={(e) => {
                      onChange({ ...block, baseUrl: e.target.value, validated: false });
                      setFetchedModels(null);
                      setModelsError('');
                    }}
                    placeholder='http://localhost:11434/v1'
                    className='w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                  />
                  <FiServer className='absolute left-2.5 top-2 size-3.5 text-slate-400' />
                </div>
              </div>
            ))}

          {provider !== 'builtin' && (
            <div>
              <div className='mb-1 flex items-center justify-between gap-2'>
                <label className='block font-semibold text-slate-700 dark:text-slate-200 text-xs'>Model</label>
                <button
                  type='button'
                  onClick={fetchModels}
                  disabled={!canListModels || modelsLoading}
                  title={canListModels ? 'Fetch the real list of models from this provider' : 'Enter credentials first'}
                  className='inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-40 dark:text-purple-400 dark:hover:text-purple-200'
                >
                  <FiRefreshCw className={`size-3 ${modelsLoading ? 'animate-spin' : ''}`} />
                  {fetchedModels ? 'Refresh' : 'Fetch models'}
                </button>
              </div>
              {/* A free-text field (not a locked dropdown) so a model ID can always be
                  entered by hand -- the escape hatch for when a corporate firewall/proxy
                  blocks the models-list request but chat completions still work, or for
                  a brand-new model id not in our fallback list yet. */}
              <input
                list={`models-${provider}`}
                type='text'
                value={block.model}
                onFocus={() => {
                  if (!fetchedModels) fetchModels();
                }}
                onChange={(e) => onChange({ ...block, model: e.target.value })}
                placeholder='Model ID'
                className='w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
              />
              <datalist id={`models-${provider}`}>
                {modelOptions.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {modelsError && (
                <p className='mt-1 text-[10px] text-rose-600 dark:text-rose-400'>
                  {modelsError} You can still type a model ID above by hand.
                </p>
              )}
              {fetchedModels && !modelsError && (
                <p className='mt-1 text-[10px] text-emerald-600 dark:text-emerald-400'>
                  {fetchedModels.length} live model(s) from the provider.
                </p>
              )}
            </div>
          )}

          <button
            type='button'
            onClick={handleTestConnection}
            disabled={testingStatus === 'testing'}
            className='inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 disabled:opacity-50'
          >
            {testingStatus === 'testing' ? (
              <span className='animate-pulse'>Testing connection…</span>
            ) : testingStatus === 'success' ? (
              <span className='inline-flex items-center gap-1 text-emerald-600 font-semibold'>
                <FiCheck className='size-3.5' /> {testMessage || 'Connected'}
              </span>
            ) : testingStatus === 'error' ? (
              <span className='text-rose-600 font-semibold'>{testMessage || 'Connection failed'}</span>
            ) : (
              <>
                <FiZap className='size-3.5' />
                <span>Test connection</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// The AI provider/persona settings form, shared by the standalone AIConfigModal
// and as one tab of the common SettingsModal -- kept as a single panel
// component so the logic lives in exactly one place regardless of which
// shell renders it. Each provider keeps its own independent block (API key,
// base URL, model); switching the active provider never touches another
// provider's saved credentials.
export const AiProviderSettingsPanel = ({ onSaved }) => {
  const [config, setConfig] = useState(DEFAULT_AI_CONFIG);
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const loaded = loadAiConfig();
    setConfig(loaded);
    setExpandedProvider(loaded.activeProvider !== 'builtin' ? loaded.activeProvider : null);
  }, []);

  const togglePersona = (id) => {
    setConfig((prev) => ({
      ...prev,
      personas: prev.personas.includes(id) ? prev.personas.filter((p) => p !== id) : [...prev.personas, id]
    }));
  };

  const handleProviderChange = (provider, nextBlock) => {
    setConfig((prev) => ({
      ...prev,
      providers: { ...prev.providers, [provider]: { ...nextBlock, enabled: hasCredentials(provider, nextBlock) } }
    }));
  };

  const handleSave = () => {
    saveAiConfig(config);
    onSaved?.(config);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className='flex flex-col'>
      <div className='max-h-[60vh] overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs'>
        <div>
          <label className='block font-semibold text-slate-700 dark:text-slate-200 mb-1.5'>
            AI Providers -- each keeps its own key/model
          </label>
          <div className='space-y-1.5'>
            {PROVIDER_IDS.map((provider) => (
              <ProviderCard
                key={provider}
                provider={provider}
                block={config.providers[provider]}
                isActive={config.activeProvider === provider}
                expanded={expandedProvider === provider}
                onToggleExpand={() => setExpandedProvider((prev) => (prev === provider ? null : provider))}
                onSetActive={(id) => setConfig((prev) => ({ ...prev, activeProvider: id }))}
                onChange={(nextBlock) => handleProviderChange(provider, nextBlock)}
              />
            ))}
          </div>
        </div>

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
                      selected ? 'border-purple-500 bg-purple-600 text-white' : 'border-slate-300 dark:border-slate-600'
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

        <div className='grid grid-cols-2 gap-2.5'>
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

      <div className='flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40'>
        <button
          type='button'
          onClick={handleSave}
          className='inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-500'
        >
          {savedFlash ? (
            <>
              <FiCheck className='size-3.5' /> Saved
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>
    </div>
  );
};

export default AiProviderSettingsPanel;
