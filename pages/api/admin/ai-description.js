import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { chatComplete, AiProviderError } from '@utils/aiProviders';

const MAX_EXCERPT_CHARS = 10_000;
const MAX_HEADINGS = 30;
const MAX_PREVIOUS = 8;
const TARGET_MAX = 160;

const SYSTEM_PROMPT = [
  'You write meta descriptions for a software engineering blog. Write ONE search-result description for the article the user provides.',
  'Requirements:',
  '- 140 to 158 characters (hard maximum 160), plain text on a single line.',
  "- Lead with the reader's problem or the article's core promise. Use the primary topic keyword naturally within the first 100 characters.",
  '- Be specific: name the technique, technology, or outcome the article actually covers.',
  '- Active voice, present tense. No clickbait, no superlatives ("best", "ultimate", "complete guide") unless the article itself claims it, no first person, no emojis, no quotation marks, no markdown, no trailing ellipsis.',
  '- Do not simply repeat the title.',
  '- Use only information found in the article. Finish on a complete sentence ending with a period.',
  'Respond with ONLY the description text.'
].join('\n');

const excerptOf = (markdown) =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, MAX_EXCERPT_CHARS);

const headingsOf = (markdown) =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n')
    .map((line) => line.match(/^#{1,4}\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean)
    .slice(0, MAX_HEADINGS);

// Models occasionally wrap the answer in quotes/markdown or overshoot the length; normalise both.
const cleanDescription = (raw) => {
  let text = String(raw || '')
    .replace(/^\s*(description|meta description)\s*:\s*/i, '')
    .replace(/[`*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .trim();
  if (text.length > TARGET_MAX) {
    const window = text.slice(0, TARGET_MAX);
    const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
    if (sentenceEnd >= 100) text = window.slice(0, sentenceEnd + 1);
    else {
      const wordEnd = window.slice(0, TARGET_MAX - 1).lastIndexOf(' ');
      text = `${window.slice(0, wordEnd > 0 ? wordEnd : TARGET_MAX - 1).replace(/[\s,;:–—-]+$/, '')}.`;
    }
  }
  return text;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const { title, category, tags, markdown, previous, provider, model, apiKey, baseUrl } = req.body || {};
  const cleanTitle = typeof title === 'string' ? title.trim().slice(0, 300) : '';
  const cleanMarkdown = typeof markdown === 'string' ? markdown : '';
  if (!cleanTitle && !cleanMarkdown.trim())
    return res.status(400).json({ ok: false, message: 'Write a title or some of the article first.' });
  if (!provider || provider === 'builtin')
    return res.status(400).json({ ok: false, message: 'Configure an AI provider in AI settings first.' });

  const tagList = (Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 12);
  const avoid = (Array.isArray(previous) ? previous : [])
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .slice(-MAX_PREVIOUS);
  const headings = headingsOf(cleanMarkdown);

  const userText = [
    `Title: ${cleanTitle || '(untitled)'}`,
    typeof category === 'string' && category.trim() ? `Category: ${category.trim()}` : '',
    tagList.length ? `Tags: ${tagList.join(', ')}` : '',
    headings.length ? `Section headings:\n${headings.map((heading) => `- ${heading}`).join('\n')}` : '',
    `Article text:\n${excerptOf(cleanMarkdown) || '(no body yet)'}`,
    avoid.length
      ? `Descriptions already suggested -- write a clearly different one, with a different opening and angle:\n${avoid
          .map((entry) => `- ${entry}`)
          .join('\n')}`
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const result = await chatComplete(provider, {
      apiKey: typeof apiKey === 'string' ? apiKey.trim() : '',
      baseUrl,
      model,
      systemPrompt: SYSTEM_PROMPT,
      userText,
      // Variety matters here: the writer regenerates until one reads right.
      temperature: 0.8
    });
    const description = cleanDescription(result);
    if (description.length < 20)
      return res.status(200).json({ ok: false, message: 'The AI returned no usable description. Try again.' });
    return res.status(200).json({ ok: true, result: description });
  } catch (error) {
    if (error instanceof AiProviderError) return res.status(200).json({ ok: false, message: error.message });
    return res.status(502).json({ ok: false, message: error.message || 'The description request failed.' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };
