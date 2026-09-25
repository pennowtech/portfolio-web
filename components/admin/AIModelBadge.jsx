import React, { useEffect, useState } from 'react';
import { LuCpu } from 'react-icons/lu';
import {
  AI_CONFIG_CHANGED_EVENT,
  DEFAULT_AI_CONFIG,
  PROVIDER_DEFAULTS,
  getActiveProviderCreds,
  loadAiConfig
} from '@utils/admin/aiConfigStore';

const PROVIDER_LABELS = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
  unsloth: 'Unsloth',
  mistral: 'Mistral',
  gemini: 'Gemini',
  builtin: 'Built-in'
};

const describe = (config) => {
  const creds = getActiveProviderCreds(config);
  const provider = creds.provider;
  const label = PROVIDER_LABELS[provider] || provider;
  // An empty model means "use the provider's default", which is what the server will call.
  const model = creds.model || PROVIDER_DEFAULTS[provider]?.model || '';
  return { provider, label, model, builtin: provider === 'builtin' };
};

// The provider and model AI requests will use right now. Reads on mount (modals re-mount each time they open)
// and refreshes when AI settings are saved, from this tab or another.
export const useActiveAiModel = () => {
  const [info, setInfo] = useState(() => describe(DEFAULT_AI_CONFIG));
  useEffect(() => {
    const refresh = () => setInfo(describe(loadAiConfig()));
    refresh();
    window.addEventListener(AI_CONFIG_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(AI_CONFIG_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return info;
};

export default function AIModelBadge({ className = '' }) {
  const { label, model, builtin } = useActiveAiModel();
  const text = builtin ? 'No AI provider selected' : `${label}${model ? ` · ${model}` : ''}`;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight ${
        builtin
          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-emerald-500/30 bg-emerald-50/60 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
      } ${className}`}
      title={builtin ? 'Choose a provider in AI settings' : `Using ${text}`}
      data-ai-model-badge
    >
      <LuCpu className='size-3 shrink-0' aria-hidden='true' />
      <span className='truncate'>
        <span className='sr-only'>AI model in use: </span>
        {text}
      </span>
    </span>
  );
}
