import { z } from 'zod';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { chatComplete, AiProviderError } from '@utils/aiProviders';
import { lookupByIsbn, lookupByTitleAuthor, BookLookupError } from '@utils/books/bookMetadataLookup';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

const requestSchema = z.object({
  mode: z.enum(['isbn', 'title-author', 'image']),
  isbn: z.string().trim().max(32).optional(),
  title: z.string().trim().max(300).optional(),
  author: z.string().trim().max(300).optional(),
  imageDataUrl: z
    .string()
    .max(6_000_000)
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/)
    .optional(),
  provider: z.string().trim().min(1),
  apiKey: z.string().max(500).optional(),
  baseUrl: z.string().max(500).optional(),
  model: z.string().max(200).optional()
});

const parseJsonLoose = (text) => {
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(cleaned);
};

const extractTitleAuthorFromImage = async (provider, creds, imageDataUrl) => {
  let raw;
  try {
    raw = await chatComplete(provider, {
      ...creds,
      systemPrompt: 'You identify books from cover photos.',
      userText:
        'Identify this book from its cover. Respond with ONLY valid JSON (no markdown fences): ' +
        '{"title": "...", "author": "..."}. If you cannot read the cover clearly, use empty strings for the fields you are unsure of.',
      imageDataUrl,
      temperature: 0
    });
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    throw new AiProviderError('Could not reach the AI provider to read the cover photo.');
  }
  try {
    const parsed = parseJsonLoose(raw);
    return { title: String(parsed.title || '').trim(), author: String(parsed.author || '').trim() };
  } catch {
    throw new AiProviderError('Could not read a title/author from that photo. Try a clearer shot of the front cover.');
  }
};

const ENRICHMENT_INSTRUCTION =
  'Based only on what you already know about this specific book, respond with ONLY valid JSON (no markdown fences) ' +
  'in this exact shape: {"keyThemes": string[], "targetAudience": string[], "similarBooks": string[]} -- ' +
  '3-6 keyThemes, 2-4 targetAudience phrases, 3-5 similarBooks as "Title by Author". ' +
  'If you are not confident about this specific book, return empty arrays instead of guessing.';

const enrichWithAi = async (provider, creds, book) => {
  if (!provider || provider === 'builtin') return { keyThemes: [], targetAudience: [], similarBooks: [] };
  try {
    const raw = await chatComplete(provider, {
      ...creds,
      systemPrompt:
        'You are a precise library cataloging assistant. You never invent facts about books you are unsure of.',
      userText:
        `Book: "${book.title}" by ${book.author || 'unknown author'}.` +
        (book.description ? `\nDescription: ${book.description.slice(0, 1500)}` : '') +
        `\n\n${ENRICHMENT_INSTRUCTION}`,
      temperature: 0.2
    });
    const parsed = parseJsonLoose(raw);
    return {
      keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes.slice(0, 6).map(String) : [],
      targetAudience: Array.isArray(parsed.targetAudience) ? parsed.targetAudience.slice(0, 4).map(String) : [],
      similarBooks: Array.isArray(parsed.similarBooks) ? parsed.similarBooks.slice(0, 5).map(String) : []
    };
  } catch {
    // Enrichment is a nice-to-have on top of the Google Books facts below --
    // never fail the whole autofill just because the model call/parse failed.
    return { keyThemes: [], targetAudience: [], similarBooks: [] };
  }
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: 'Invalid autofill request.' });
  const { mode, isbn, imageDataUrl, provider, model } = parsed.data;
  let { title, author } = parsed.data;
  const creds = { apiKey: (parsed.data.apiKey || '').trim(), baseUrl: parsed.data.baseUrl, model };

  if (mode === 'isbn' && !isbn?.trim()) return res.status(400).json({ ok: false, message: 'Enter an ISBN first.' });
  if (mode === 'title-author' && !title?.trim())
    return res.status(400).json({ ok: false, message: 'Enter a title first.' });

  try {
    if (mode === 'image') {
      if (!imageDataUrl) return res.status(400).json({ ok: false, message: 'No cover image was provided.' });
      if (!provider || provider === 'builtin') {
        return res.status(400).json({
          ok: false,
          message: 'Reading a cover photo needs a real AI provider configured first (see AI Configure).'
        });
      }
      const extracted = await extractTitleAuthorFromImage(provider, creds, imageDataUrl);
      if (!extracted.title) {
        return res.status(200).json({
          ok: false,
          message:
            'Could not identify this book from the photo. Try a clearer photo of the front cover, or fill in the details manually.'
        });
      }
      title = extracted.title;
      author = extracted.author;
    }

    const found = mode === 'isbn' ? await lookupByIsbn(isbn) : await lookupByTitleAuthor(title, author);

    if (!found) {
      const what = mode === 'isbn' ? `ISBN ${isbn}` : `"${title}"`;
      return res.status(200).json({
        ok: false,
        message: `Couldn't find ${what} in Google Books. Double-check the spelling/ISBN, or fill in the details manually.`
      });
    }

    const enrichment = await enrichWithAi(provider, creds, found);
    return res.status(200).json({ ok: true, book: { ...found, ...enrichment } });
  } catch (error) {
    if (error instanceof AiProviderError || error instanceof BookLookupError) {
      return res.status(200).json({ ok: false, message: error.message });
    }
    console.error('Book AI autofill failed:', error);
    return res.status(502).json({ ok: false, message: error.message || 'Autofill failed.' });
  }
}
