import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { chatComplete, AiProviderError } from '@utils/aiProviders';
import { buildCombinedInstruction } from '@components/admin/aiPersonas';

const MAX_INPUT_CHARS = 60_000; // generous enough for a whole long-form article

const OUTPUT_CONTRACT =
  'Rewrite the text the user provides according to the directives above. ' +
  'Preserve the original meaning, facts, and any code blocks verbatim. ' +
  'Respond with ONLY the rewritten text in clean Markdown -- no preamble, no explanation, ' +
  'no "Here is the rewritten text" framing, and no wrapping code fence around the whole answer.';

// No network call: a small set of mechanical, deterministic rewrites so the
// "Built-in Rules" provider is honest about what it can do without an API key,
// rather than pretending to be a real model.
const builtinRewrite = (text, personaIds) => {
  let result = text;
  if (personaIds.includes('brevity') || personaIds.includes('concise')) {
    result = result
      .replace(/in order to/gi, 'to')
      .replace(/due to the fact that/gi, 'because')
      .replace(/at this point in time/gi, 'now')
      .replace(/utilize/gi, 'use')
      .replace(/\butilizes\b/gi, 'uses');
  }
  if (personaIds.includes('grammar') || personaIds.includes('clarity')) {
    result = result
      .split('\n')
      .map((line) => (line.trim() ? line.charAt(0).toUpperCase() + line.slice(1) : line))
      .join('\n');
    if (result.trim() && !/[.!?:`)]$/.test(result.trim())) result = `${result.trim()}.`;
  }
  return result;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const { text, personaIds, customPrompt, provider, model, apiKey, baseUrl, systemPrompt, temperature } =
    req.body || {};

  if (typeof text !== 'string' || !text.trim())
    return res.status(400).json({ ok: false, message: 'No text was provided to rephrase.' });
  if (text.length > MAX_INPUT_CHARS)
    return res
      .status(400)
      .json({ ok: false, message: `Text is too long (max ${MAX_INPUT_CHARS.toLocaleString()} characters).` });
  const cleanPersonaIds = Array.isArray(personaIds) ? personaIds.filter((id) => typeof id === 'string') : [];
  if (cleanPersonaIds.length === 0 && !customPrompt?.trim())
    return res.status(400).json({ ok: false, message: 'Select at least one persona or provide a custom instruction.' });

  const directive = buildCombinedInstruction(cleanPersonaIds, customPrompt || '');

  if (!provider || provider === 'builtin') {
    return res.status(200).json({ ok: true, result: builtinRewrite(text, cleanPersonaIds) });
  }

  const combinedSystemPrompt = [systemPrompt?.trim(), directive, OUTPUT_CONTRACT].filter(Boolean).join('\n\n');

  try {
    const result = await chatComplete(provider, {
      apiKey: typeof apiKey === 'string' ? apiKey.trim() : '',
      baseUrl,
      model,
      systemPrompt: combinedSystemPrompt,
      userText: text,
      temperature: typeof temperature === 'number' ? temperature : 0.3
    });
    return res.status(200).json({ ok: true, result: result.trim() });
  } catch (error) {
    if (error instanceof AiProviderError) return res.status(200).json({ ok: false, message: error.message });
    return res.status(502).json({ ok: false, message: error.message || 'The rephrase request failed.' });
  }
}
