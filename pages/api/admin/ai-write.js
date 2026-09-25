import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { chatComplete, AiProviderError } from '@utils/aiProviders';
import { AI_ARTICLE_LENGTHS, buildCombinedInstruction } from '@components/admin/aiPersonas';

const MAX_BRIEF = 4000;
const MAX_NOTES = 8000;

const WRITE_CONTRACT = [
  'You are writing a complete article for a software engineering blog, in clean Markdown, following the writing directives above.',
  '- Start directly with the introduction. Do NOT include a top-level "# " title (the title is set separately); use "## " and "### " headings for sections.',
  '- Use fenced code blocks with a language tag for any code. Keep code correct and minimal.',
  '- Be concrete and useful for a working engineer: reasoning, trade-offs, and examples over generalities.',
  '- Do not invent statistics, benchmarks, quotes, citations, product features, or links. When a specific fact is unknown, stay general.',
  '- Follow the outline or key points if given; cover every one of them.',
  '- End with a short conclusion or next step.',
  'Respond with ONLY the article Markdown -- no preamble, no closing remarks, and no code fence wrapped around the whole answer.'
].join('\n');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const {
    brief,
    notes,
    lengthId,
    personaIds,
    title,
    category,
    tags,
    provider,
    model,
    apiKey,
    baseUrl,
    systemPrompt,
    temperature
  } = req.body || {};

  const cleanBrief = typeof brief === 'string' ? brief.trim() : '';
  const cleanNotes = typeof notes === 'string' ? notes.trim() : '';
  if (!cleanBrief) return res.status(400).json({ ok: false, message: 'Describe what the article should cover.' });
  if (cleanBrief.length > MAX_BRIEF || cleanNotes.length > MAX_NOTES)
    return res.status(400).json({ ok: false, message: 'The brief or notes are too long.' });
  const length = AI_ARTICLE_LENGTHS.find((entry) => entry.id === lengthId);
  if (!length) return res.status(400).json({ ok: false, message: 'Choose an article length.' });
  const cleanPersonaIds = Array.isArray(personaIds) ? personaIds.filter((id) => typeof id === 'string') : [];
  if (cleanPersonaIds.length === 0) return res.status(400).json({ ok: false, message: 'Select at least one tone.' });
  if (!provider || provider === 'builtin')
    return res.status(400).json({ ok: false, message: 'Configure an AI provider in AI settings first.' });

  const tagList = (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 12);

  const userText = [
    typeof title === 'string' && title.trim() ? `Working title: ${title.trim().slice(0, 300)}` : '',
    typeof category === 'string' && category.trim() ? `Category: ${category.trim()}` : '',
    tagList.length ? `Tags: ${tagList.join(', ')}` : '',
    `Length: ${length.instruction}`,
    `What the article should cover:\n${cleanBrief}`,
    cleanNotes ? `Outline / key points to include:\n${cleanNotes}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  const combinedSystemPrompt = [
    typeof systemPrompt === 'string' ? systemPrompt.trim() : '',
    buildCombinedInstruction(cleanPersonaIds, ''),
    WRITE_CONTRACT
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const result = await chatComplete(provider, {
      apiKey: typeof apiKey === 'string' ? apiKey.trim() : '',
      baseUrl,
      model,
      systemPrompt: combinedSystemPrompt,
      userText,
      temperature: typeof temperature === 'number' ? temperature : 0.6,
      maxOutputTokens: length.maxTokens
    });
    const article = result.trim();
    if (article.length < 50)
      return res.status(200).json({ ok: false, message: 'The AI returned no usable article. Try again.' });
    return res.status(200).json({ ok: true, result: article });
  } catch (error) {
    if (error instanceof AiProviderError) return res.status(200).json({ ok: false, message: error.message });
    return res.status(502).json({ ok: false, message: error.message || 'The article request failed.' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '256kb' } } };
