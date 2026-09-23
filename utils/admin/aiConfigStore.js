// Single source of truth for the AI provider/persona configuration shared by
// every admin surface (Article Studio, Issueboard, Book Library) — the
// settings are one browser-wide config, not scoped per feature.
const STORAGE_KEY = 'sb_admin_ai_config';
const LEGACY_STORAGE_KEY = 'article_studio_ai_config';

export const DEFAULT_AI_CONFIG = {
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  apiKey: '',
  baseUrl: 'https://api.groq.com/openai/v1',
  temperature: 0.3,
  systemPrompt:
    'You are a Principal Software Architect and elite technical writer. Provide crisp, pragmatic explanations with concrete code and no fluff.',
  personas: ['architecture']
};

// Migrates the old single-select `tone` field (pre-multi-persona) forward.
export const normalizeAiConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return DEFAULT_AI_CONFIG;
  if (Array.isArray(raw.personas)) return { ...DEFAULT_AI_CONFIG, ...raw };
  if (typeof raw.tone === 'string') {
    const { tone, ...rest } = raw;
    return { ...DEFAULT_AI_CONFIG, ...rest, personas: [tone] };
  }
  return { ...DEFAULT_AI_CONFIG, ...raw };
};

export const loadAiConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? normalizeAiConfig(JSON.parse(stored)) : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
};

export const saveAiConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore -- config just won't persist across reloads
  }
};
