// Single source of truth for the AI provider/persona configuration shared by
// every admin surface (Article Studio, Issueboard, Book Library) — the
// settings are one browser-wide config, not scoped per feature.
//
// Each provider keeps its own independent block (apiKey/baseUrl/model/
// enabled/fetchedModels), so switching the active provider never clobbers
// another provider's key or model choice -- they're configured once and
// remembered, not overwritten by whichever provider you last touched.
const STORAGE_KEY = 'sb_admin_ai_config';
const LEGACY_STORAGE_KEY = 'article_studio_ai_config';

export const PROVIDER_DEFAULTS = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  ollama: { baseUrl: 'http://localhost:11434/v1', model: 'deepseek-r1:14b' },
  unsloth: { baseUrl: 'http://127.0.0.1:8888/v1', model: 'unsloth-model' },
  mistral: { baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-large-latest' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' }
};

export const PROVIDER_IDS = Object.keys(PROVIDER_DEFAULTS);

const emptyProviderBlock = (id) => ({
  apiKey: '',
  baseUrl: PROVIDER_DEFAULTS[id].baseUrl,
  model: PROVIDER_DEFAULTS[id].model,
  enabled: false,
  // Only set by a successful "Test connection" -- entering a key just means
  // it's present, not that it's actually valid, so the two are tracked
  // separately rather than treating "has text" as "configured".
  validated: false
});

const emptyProviders = () =>
  PROVIDER_IDS.reduce((acc, id) => {
    acc[id] = emptyProviderBlock(id);
    return acc;
  }, {});

const MAX_CUSTOM_MODEL_HISTORY = 5;

export const DEFAULT_AI_CONFIG = {
  activeProvider: 'groq',
  providers: emptyProviders(),
  temperature: 0.3,
  systemPrompt:
    'You are a Principal Software Architect and elite technical writer. Provide crisp, pragmatic explanations with concrete code and no fluff.',
  personas: ['architecture'],
  // Manually-typed model IDs the user has applied before, kept per provider
  // so they're offered again as quick picks instead of having to retype.
  customModelHistory: {}
};

// Records a manually-typed model id for this provider (most-recent-first,
// deduped, capped) and returns the updated config -- call before saveAiConfig.
export const rememberCustomModel = (config, provider, modelId) => {
  const trimmed = String(modelId || '').trim();
  if (!trimmed) return config;
  const existing = config.customModelHistory?.[provider] || [];
  const next = [trimmed, ...existing.filter((m) => m !== trimmed)].slice(0, MAX_CUSTOM_MODEL_HISTORY);
  return { ...config, customModelHistory: { ...config.customModelHistory, [provider]: next } };
};

// Migrates both the pre-multi-persona `tone` field and the pre-per-provider
// flat shape ({ provider, apiKey, baseUrl, model, ... } at the top level)
// forward into the current per-provider-block shape.
export const normalizeAiConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return DEFAULT_AI_CONFIG;

  const personas = Array.isArray(raw.personas) ? raw.personas : typeof raw.tone === 'string' ? [raw.tone] : undefined;

  if (raw.providers && typeof raw.providers === 'object') {
    const providers = emptyProviders();
    for (const id of PROVIDER_IDS) {
      providers[id] = { ...providers[id], ...raw.providers[id] };
    }
    return {
      ...DEFAULT_AI_CONFIG,
      ...raw,
      activeProvider: providers[raw.activeProvider] ? raw.activeProvider : DEFAULT_AI_CONFIG.activeProvider,
      providers,
      personas: personas || DEFAULT_AI_CONFIG.personas
    };
  }

  // Legacy flat shape: { provider, apiKey, baseUrl, model, temperature, systemPrompt, tone|personas }
  if (typeof raw.provider === 'string') {
    const providers = emptyProviders();
    if (providers[raw.provider]) {
      providers[raw.provider] = {
        ...providers[raw.provider],
        apiKey: raw.apiKey || '',
        baseUrl: raw.baseUrl || providers[raw.provider].baseUrl,
        model: raw.model || providers[raw.provider].model,
        enabled: Boolean(raw.apiKey) || raw.provider === 'ollama' || raw.provider === 'unsloth'
      };
    }
    return {
      ...DEFAULT_AI_CONFIG,
      activeProvider: providers[raw.provider] ? raw.provider : DEFAULT_AI_CONFIG.activeProvider,
      providers,
      temperature: typeof raw.temperature === 'number' ? raw.temperature : DEFAULT_AI_CONFIG.temperature,
      systemPrompt: typeof raw.systemPrompt === 'string' ? raw.systemPrompt : DEFAULT_AI_CONFIG.systemPrompt,
      personas: personas || DEFAULT_AI_CONFIG.personas
    };
  }

  return {
    ...DEFAULT_AI_CONFIG,
    ...raw,
    activeProvider: PROVIDER_DEFAULTS[raw.activeProvider] ? raw.activeProvider : DEFAULT_AI_CONFIG.activeProvider,
    personas: personas || DEFAULT_AI_CONFIG.personas
  };
};

export const loadAiConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? normalizeAiConfig(JSON.parse(stored)) : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
};

// Lets open AI windows refresh their "provider · model" label as soon as settings are saved.
export const AI_CONFIG_CHANGED_EVENT = 'sbt:ai-config-changed';

export const saveAiConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore -- config just won't persist across reloads
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AI_CONFIG_CHANGED_EVENT));
};

// Flattens the active provider's block into the {provider, apiKey, baseUrl,
// model} shape the /api/admin/ai-* routes and AI Rephrase/Autofill already
// expect, plus the shared writing settings. Callers that used to read
// config.provider/apiKey/baseUrl/model directly should use this instead.
export const getActiveProviderCreds = (config) => {
  const provider =
    config.activeProvider && config.providers?.[config.activeProvider]
      ? config.activeProvider
      : DEFAULT_AI_CONFIG.activeProvider;
  const block = config.providers?.[provider] || emptyProviderBlock(provider);
  return {
    provider,
    apiKey: block.apiKey || '',
    baseUrl: block.baseUrl || '',
    model: block.model || '',
    temperature: config.temperature,
    systemPrompt: config.systemPrompt,
    personas: config.personas
  };
};
