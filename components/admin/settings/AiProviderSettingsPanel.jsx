import React, { useEffect, useState } from 'react';
import { FiCheck, FiChevronDown, FiEye, FiEyeOff, FiKey, FiRefreshCw, FiServer, FiZap } from 'react-icons/fi';
import { AI_PERSONAS } from '../aiPersonas';
import {
  DEFAULT_AI_CONFIG,
  PROVIDER_IDS,
  loadAiConfig,
  saveAiConfig,
  rememberCustomModel
} from '@utils/admin/aiConfigStore';

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
  gemini: { label: 'Gemini', hint: '', fallbackModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] }
};

// "Has credentials entered" -- used to gate the fetch/test actions. This is
// NOT the same as "verified working"; see block.validated for that.
const hasCredentials = (provider, block) => {
  if (provider === 'ollama') return Boolean(block.baseUrl?.trim());
  return Boolean(block.apiKey?.trim());
};

// One provider's card: its own key/baseUrl/model, its own fetched-models
// list and test-connection result -- fully independent of every other
// provider's block, so configuring or testing one never touches another's.
const ProviderCard = ({
  provider,
  block,
  isActive,
  expanded,
  onToggleExpand,
  onSetActive,
  onChange,
  customModelHistory,
  onApplyCustomModel,
  standalone = false
}) => {
  const meta = PROVIDER_META[provider];
  const [showKey, setShowKey] = useState(false);
  const [fetchedModels, setFetchedModels] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [testingStatus, setTestingStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');

  const configured = hasCredentials(provider, block);
  const canActivate = block.validated;
  const canListModels = configured;
  // Always include the currently-set model, even if it came from manual entry
  // and isn't in the fetched/fallback list, so the dropdown never silently
  // shows something other than what's actually configured.
  const knownModels = fetchedModels || meta.fallbackModels;
  const modelOptions = block.model && !knownModels.includes(block.model) ? [block.model, ...knownModels] : knownModels;

  const applyCustomModel = () => {
    const trimmed = customModelInput.trim();
    if (!trimmed) return;
    onApplyCustomModel(trimmed);
    setCustomModelInput('');
  };

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
          disabled={!canActivate}
          title={isActive ? 'Active provider' : canActivate ? 'Set as active provider' : 'Verify this connection first'}
          aria-label={
            isActive ? 'Active provider' : canActivate ? 'Set as active provider' : 'Verify this connection first'
          }
          className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${
            isActive ? 'border-purple-600 bg-purple-600' : 'border-slate-300 dark:border-slate-600'
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isActive && <span className='size-1.5 rounded-full bg-white' />}
        </button>

        <button
          type='button'
          onClick={standalone ? undefined : onToggleExpand}
          aria-disabled={standalone}
          className={`flex flex-1 items-center justify-between gap-2 text-left ${standalone ? 'cursor-default' : ''}`}
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
            {!standalone && (
              <FiChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            )}
          </span>
        </button>
      </div>

      {expanded && (
        <div className='space-y-2.5 border-t border-slate-100 p-3 dark:border-slate-800'>
          {provider !== 'ollama' ? (
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
          )}

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
            <select
              value={block.model}
              onFocus={() => {
                if (!fetchedModels) fetchModels();
              }}
              onChange={(e) => onChange({ ...block, model: e.target.value })}
              className='w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {modelsError && (
              <p className='mt-1 text-[10px] text-rose-600 dark:text-rose-400'>
                {modelsError} Use Custom Model ID below instead.
              </p>
            )}
            {fetchedModels && !modelsError && (
              <p className='mt-1 text-[10px] text-emerald-600 dark:text-emerald-400'>
                {fetchedModels.length} live model(s) from the provider.
              </p>
            )}

            {/* Always-available manual entry -- the escape hatch for when a
                  corporate firewall/proxy blocks the models-list request but
                  chat completions still work, or for a model id not in the
                  fetched/fallback list yet. */}
            <div className='mt-2 border-t border-slate-100 pt-2 dark:border-slate-800'>
              <label className='block font-semibold text-slate-700 dark:text-slate-200 text-xs mb-1'>
                Custom Model ID
              </label>
              <div className='flex gap-1.5'>
                <input
                  type='text'
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCustomModel()}
                  placeholder='e.g. gpt-4o-2024-11-20'
                  className='min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                />
                <button
                  type='button'
                  onClick={applyCustomModel}
                  disabled={!customModelInput.trim()}
                  className='shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40'
                >
                  Apply
                </button>
              </div>
              {customModelHistory.length > 0 && (
                <div className='mt-1.5 flex flex-wrap gap-1'>
                  {customModelHistory.map((m) => (
                    <button
                      key={m}
                      type='button'
                      onClick={() => onApplyCustomModel(m)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                        block.model === m
                          ? 'border-purple-500 bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
    setExpandedProvider(loaded.activeProvider);
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

  // Changing the model doesn't invalidate an already-verified key/baseUrl --
  // only editing the credentials themselves does (handled in ProviderCard).
  const handleApplyCustomModel = (provider, modelId) => {
    setConfig((prev) => {
      const nextBlock = { ...prev.providers[provider], model: modelId };
      const withHistory = rememberCustomModel(prev, provider, modelId);
      return { ...withHistory, providers: { ...prev.providers, [provider]: nextBlock } };
    });
  };

  const handleSave = () => {
    saveAiConfig(config);
    onSaved?.(config);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const selectedProvider = expandedProvider || config.activeProvider;
  const selectedBlock = config.providers[selectedProvider];
  const selectedConfigured = hasCredentials(selectedProvider, selectedBlock);
  const selectedVerified = selectedBlock.validated;
  const activeBlock = config.providers[config.activeProvider];
  let selectedStatusClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  if (selectedConfigured) {
    selectedStatusClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300';
  }
  if (selectedVerified) {
    selectedStatusClass = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300';
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs'>
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100'>
          <span className='font-bold'>Active provider</span>
          <span className='text-right'>
            <strong>{PROVIDER_META[config.activeProvider].label}</strong>
            <span className='mx-1.5 text-emerald-400'>·</span>
            <span className='text-[10px] text-emerald-800 dark:text-emerald-300'>{activeBlock.model}</span>
          </span>
        </div>
        <div className='grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 lg:grid-cols-[210px_minmax(0,1fr)]'>
          <aside className='border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40 lg:border-b-0 lg:border-r'>
            <h4 className='mb-0.5 font-bold text-slate-900 dark:text-white'>Providers</h4>
            <p className='mb-3 text-[9px] leading-relaxed text-slate-500'>Each keeps its own key and model.</p>
            <div className='grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1'>
              {PROVIDER_IDS.map((provider) => {
                const block = config.providers[provider];
                const configured = hasCredentials(provider, block);
                const verified = block.validated;
                return (
                  <button
                    key={provider}
                    type='button'
                    onClick={() => setExpandedProvider(provider)}
                    aria-pressed={selectedProvider === provider}
                    className={`flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                      selectedProvider === provider
                        ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${verified ? 'bg-emerald-500' : configured ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate font-bold'>{PROVIDER_META[provider].label}</span>
                      <span className='block truncate text-[8px] opacity-70'>
                        {verified ? 'Verified' : configured ? 'Needs test' : 'Not configured'}
                      </span>
                    </span>
                    {config.activeProvider === provider && (
                      <span className='rounded-full bg-emerald-700 px-1 py-0.5 text-[7px] font-bold text-white'>
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className='p-3 sm:p-4'>
            <div className='mb-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <h4 className='text-sm font-bold text-slate-900 dark:text-white'>
                  {PROVIDER_META[selectedProvider].label} connection
                </h4>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${selectedStatusClass}`}>
                  {selectedVerified
                    ? 'Verified'
                    : selectedConfigured
                      ? 'Credentials present · test required'
                      : 'Not configured'}
                </span>
              </div>
              <p className='mt-1 text-[10px] text-slate-500'>Configure and test before activating this provider.</p>
            </div>
            <ProviderCard
              provider={selectedProvider}
              block={selectedBlock}
              isActive={config.activeProvider === selectedProvider}
              expanded
              standalone
              onToggleExpand={() => {}}
              onSetActive={(id) => setConfig((prev) => ({ ...prev, activeProvider: id }))}
              onChange={(nextBlock) => handleProviderChange(selectedProvider, nextBlock)}
              customModelHistory={config.customModelHistory?.[selectedProvider] || []}
              onApplyCustomModel={(modelId) => handleApplyCustomModel(selectedProvider, modelId)}
            />
          </section>
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
