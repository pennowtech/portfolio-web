// Shared server-side logic for talking to AI providers: listing models and
// running a chat completion. Used by pages/api/admin/ai-test-connection.js,
// ai-list-models.js, and ai-rephrase.js so provider-specific request shapes
// (OpenAI-style chat/completions vs Anthropic's Messages API) live in one
// place instead of three.
const DEFAULT_BASE_URLS = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434/v1',
  unsloth: 'http://127.0.0.1:8888/v1',
  anthropic: 'https://api.anthropic.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  // Google's OpenAI-compatibility layer: same /chat/completions and /models
  // shapes as OpenAI, so it doesn't need a bespoke integration like Anthropic.
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai'
};

const OPENAI_COMPATIBLE = new Set(['groq', 'openai', 'ollama', 'unsloth', 'mistral', 'gemini']);

export const resolveBaseUrl = (provider, baseUrl) => baseUrl?.trim() || DEFAULT_BASE_URLS[provider] || '';

export class AiProviderError extends Error {}

// Builds a diagnostic message for a failed response, distinguishing "the
// provider rejected this" from "something between us and the provider
// intercepted this" (a corporate proxy/firewall doing SSL inspection or
// category blocking, which shows up as a redirect to an unrelated host and/or
// an HTML block page instead of the provider's real JSON response) -- the
// latter looks identical to a generic HTTP error otherwise and is genuinely
// confusing to debug from the error code alone.
// Response headers added by known SSL-inspection/security proxies, checked
// regardless of content-type or redirect target -- some of these proxies
// serve a block page with a JSON-looking content-type or without changing
// the host, so content-type/redirect checks alone can miss them.
const PROXY_VENDOR_HEADER_SIGNATURES = [
  { header: 'server', pattern: /zscaler/i, vendor: 'Zscaler' },
  { header: 'x-via', pattern: /zscaler/i, vendor: 'Zscaler' },
  { header: 'server', pattern: /forcepoint/i, vendor: 'Forcepoint' },
  { header: 'server', pattern: /fortinet|fortigate/i, vendor: 'Fortinet' },
  { header: 'x-proxy-error', pattern: /.+/i, vendor: 'a network proxy' }
];

const detectProxyVendor = (response) => {
  for (const { header, pattern, vendor } of PROXY_VENDOR_HEADER_SIGNATURES) {
    const value = response.headers.get(header);
    if (value && pattern.test(value)) return vendor;
  }
  return null;
};

const describeFailedResponse = async (response, requestedHost) => {
  const bodyText = await response.text().catch(() => '');
  const contentType = response.headers.get('content-type') || '';
  const finalHost = (() => {
    try {
      return new URL(response.url).host;
    } catch {
      return '';
    }
  })();

  const proxyVendor = detectProxyVendor(response);
  const redirectedElsewhere = response.redirected && finalHost && finalHost !== requestedHost;
  if (proxyVendor || !contentType.includes('json') || redirectedElsewhere) {
    const where = redirectedElsewhere
      ? `redirected to ${finalHost} instead of reaching ${requestedHost}`
      : `got HTTP ${response.status} back as ${contentType || 'a non-JSON response'} instead of ${requestedHost}'s API response`;
    const via = proxyVendor
      ? `this network's ${proxyVendor} security proxy`
      : `a network security proxy (e.g. a corporate firewall doing SSL inspection)`;
    return (
      `Request ${where} -- this looks like ${via} intercepted the request, not a rejection from the provider itself. ` +
      `Check network/VPN/proxy settings, or try a different network. You can still enter a model ID by hand below.`
    );
  }

  try {
    const parsed = JSON.parse(bodyText);
    const message = parsed?.error?.message || parsed?.message;
    if (message) return `HTTP ${response.status}: ${message}`;
  } catch {
    // fall through to the raw-text message below
  }
  return `HTTP ${response.status}. ${bodyText.slice(0, 300)}`;
};

export const listModels = async (provider, { apiKey, baseUrl } = {}) => {
  const resolvedBaseUrl = resolveBaseUrl(provider, baseUrl);

  if (OPENAI_COMPATIBLE.has(provider)) {
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const response = await fetch(`${resolvedBaseUrl.replace(/\/$/, '')}/models`, { headers });
    if (!response.ok) throw new AiProviderError(await describeFailedResponse(response, new URL(resolvedBaseUrl).host));
    const data = await response.json();
    return (data.data || []).map((m) => m.id).sort();
  }

  if (provider === 'anthropic') {
    if (!apiKey) throw new AiProviderError('API key is required for Anthropic.');
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    });
    if (!response.ok) throw new AiProviderError(await describeFailedResponse(response, 'api.anthropic.com'));
    const data = await response.json();
    return (data.data || []).map((m) => m.id).sort();
  }

  throw new AiProviderError(`Unknown provider "${provider}".`);
};

// Rough token estimate (chars/3.2 is a reasonable average for English prose)
// used only to size max_tokens generously enough that a whole-article
// rephrase isn't truncated.
const estimateTokens = (text) => Math.ceil((text || '').length / 3.2);

// Parses a data: URL (e.g. "data:image/jpeg;base64,...") into its media type
// and raw base64 payload, as Anthropic's image blocks need them split apart.
const parseImageDataUrl = (imageDataUrl) => {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl || '');
  if (!match) throw new AiProviderError('Invalid image data.');
  return { mediaType: match[1], data: match[2] };
};

export const chatComplete = async (
  provider,
  { apiKey, baseUrl, model, systemPrompt, userText, temperature = 0.3, imageDataUrl, maxOutputTokens }
) => {
  // Rewrites are sized from the input; generation from a short brief needs an explicit output budget.
  const maxTokens = Math.min(8192, maxOutputTokens || Math.max(1024, estimateTokens(userText) * 2));

  if (OPENAI_COMPATIBLE.has(provider)) {
    const resolvedBaseUrl = resolveBaseUrl(provider, baseUrl);
    const headers = { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) };
    const userContent = imageDataUrl
      ? [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ]
      : userText;
    const response = await fetch(`${resolvedBaseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ]
      })
    });
    if (!response.ok) throw new AiProviderError(await describeFailedResponse(response, new URL(resolvedBaseUrl).host));
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AiProviderError('Provider response did not include any content.');
    return content;
  }

  if (provider === 'anthropic') {
    if (!apiKey) throw new AiProviderError('API key is required for Anthropic.');
    const userContent = imageDataUrl
      ? (() => {
          const { mediaType, data } = parseImageDataUrl(imageDataUrl);
          return [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            { type: 'text', text: userText }
          ];
        })()
      : userText;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });
    if (!response.ok) throw new AiProviderError(await describeFailedResponse(response, 'api.anthropic.com'));
    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new AiProviderError('Anthropic response did not include any content.');
    return content;
  }

  throw new AiProviderError(`Unknown provider "${provider}".`);
};
