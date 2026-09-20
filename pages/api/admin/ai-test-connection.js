import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';

// Real connectivity/auth probes per provider -- a cheap, read-only call that
// proves the key and base URL actually work, without spending real
// completion tokens. Each returns { ok, message }.
const PROBES = {
  groq: async ({ apiKey, baseUrl }) => probeOpenAiCompatible(baseUrl || 'https://api.groq.com/openai/v1', apiKey),
  openai: async ({ apiKey, baseUrl }) => probeOpenAiCompatible(baseUrl || 'https://api.openai.com/v1', apiKey),
  ollama: async ({ baseUrl }) => probeOpenAiCompatible(baseUrl || 'http://localhost:11434/v1', null),
  anthropic: async ({ apiKey }) => {
    if (!apiKey) return { ok: false, message: 'API key is required for Anthropic.' };
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    });
    if (response.status === 401 || response.status === 403)
      return { ok: false, message: 'Anthropic rejected the API key.' };
    if (!response.ok) return { ok: false, message: `Anthropic returned HTTP ${response.status}.` };
    return { ok: true, message: 'Connected to Anthropic.' };
  }
};

const probeOpenAiCompatible = async (baseUrl, apiKey) => {
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
  let response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, { headers });
  } catch {
    return { ok: false, message: `Could not reach ${baseUrl}.` };
  }
  if (response.status === 401 || response.status === 403)
    return { ok: false, message: 'The provider rejected the API key.' };
  if (!response.ok) return { ok: false, message: `Provider returned HTTP ${response.status}.` };
  return { ok: true, message: 'Connection verified.' };
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const { provider, apiKey, baseUrl } = req.body || {};
  const probe = PROBES[provider];
  if (!probe) return res.status(400).json({ ok: false, message: `Unknown provider "${provider}".` });

  try {
    const result = await probe({ apiKey: typeof apiKey === 'string' ? apiKey.trim() : '', baseUrl });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ ok: false, message: error.message || 'Connection test failed.' });
  }
}
