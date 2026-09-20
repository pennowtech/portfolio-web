import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { listModels, AiProviderError } from '@utils/aiProviders';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const { provider, apiKey, baseUrl } = req.body || {};
  if (typeof provider !== 'string') return res.status(400).json({ ok: false, message: 'A provider is required.' });

  try {
    const models = await listModels(provider, { apiKey: typeof apiKey === 'string' ? apiKey.trim() : '', baseUrl });
    return res.status(200).json({ ok: true, models });
  } catch (error) {
    if (error instanceof AiProviderError) return res.status(200).json({ ok: false, message: error.message });
    return res.status(502).json({ ok: false, message: error.message || 'Could not list models.' });
  }
}
