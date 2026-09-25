import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { chatComplete, AiProviderError } from '@utils/aiProviders';
import { lookupByIsbn, lookupByTitleAuthor, BookLookupError } from '@utils/books/bookMetadataLookup';
import { listBooks } from '@utils/books/bookRepository';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

const loadServerEnvFallbacks = () => {
  const fallbacks = {};
  try {
    const p = path.join(process.cwd(), 'tools/book-metadata/.env');
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim();
          fallbacks[k] = v;
        }
      }
    }
  } catch {
    // Ignore error
  }
  return fallbacks;
};

const cleanForMatching = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanIsbn = (str) =>
  String(str || '')
    .replace(/[^0-9X]/gi, '')
    .toUpperCase();

const findBookInList = (books, { title, author, isbn }) => {
  if (!Array.isArray(books) || !books.length) return null;
  const targetIsbn = cleanIsbn(isbn);
  if (targetIsbn && targetIsbn.length >= 9) {
    const match = books.find((b) => {
      const bIsbn = cleanIsbn(b.isbn || b.isbn13);
      return bIsbn && bIsbn === targetIsbn;
    });
    if (match) return match;
  }

  const targetTitle = cleanForMatching(title);
  const targetAuthor = cleanForMatching(author);

  if (targetTitle) {
    // 1. Exact cleaned title match
    const exactMatch = books.find((b) => cleanForMatching(b.title) === targetTitle);
    if (exactMatch) return exactMatch;

    // 2. Substring or prefix match if targetTitle is substantial
    if (targetTitle.length >= 5) {
      const closeMatch = books.find((b) => {
        const bTitle = cleanForMatching(b.title);
        const titleMatches = bTitle.includes(targetTitle) || targetTitle.includes(bTitle);
        if (!titleMatches) return false;
        if (!targetAuthor) return true;
        const bAuthor = cleanForMatching(b.author);
        return bAuthor.includes(targetAuthor) || targetAuthor.includes(bAuthor);
      });
      if (closeMatch) return closeMatch;
    }
  }

  return null;
};

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
  model: z.string().max(200).optional(),
  googleBooksApiKey: z.string().max(200).optional(),
  forceRefetch: z.boolean().optional()
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

const inferShelfFromCategory = (genre, title) => {
  const text = `${genre || ''} ${title || ''}`.toLowerCase();
  if (/fict|novel|fantasy|sci-fi|literature|stories|romance/i.test(text)) return 'fiction';
  if (/business|manage|leader|product|startup|econom|invest|entrepreneur|financ/i.test(text)) return 'business';
  if (/phil|psych|mind|habit|think|stoic|spirit|self-help|health|meditat/i.test(text)) return 'philosophy';
  if (/comput|tech|program|soft|code|architect|data|system|cloud|web|engineer|dev/i.test(text)) return 'technical';
  return 'technical';
};

const normalizeShelf = (rawShelf, genre, title) => {
  const s = String(rawShelf || '')
    .toLowerCase()
    .trim();
  if (['technical', 'philosophy', 'business', 'fiction', 'wishlist'].includes(s)) return s;
  if (
    s.includes('tech') ||
    s.includes('soft') ||
    s.includes('arch') ||
    s.includes('code') ||
    s.includes('data') ||
    s.includes('comput')
  )
    return 'technical';
  if (
    s.includes('phil') ||
    s.includes('mind') ||
    s.includes('psych') ||
    s.includes('habit') ||
    s.includes('think') ||
    s.includes('stoic')
  )
    return 'philosophy';
  if (
    s.includes('lead') ||
    s.includes('prod') ||
    s.includes('bus') ||
    s.includes('start') ||
    s.includes('strat') ||
    s.includes('econ') ||
    s.includes('manage')
  )
    return 'business';
  if (
    s.includes('fict') ||
    s.includes('novel') ||
    s.includes('sci-fi') ||
    s.includes('fantasy') ||
    s.includes('lit') ||
    s.includes('romance')
  )
    return 'fiction';
  return inferShelfFromCategory(genre, title);
};

const ENRICHMENT_INSTRUCTION =
  'You are an expert literary analyst and library cataloger. Provide comprehensive metadata for this specific book. ' +
  'Respond with ONLY valid JSON (no markdown fences) in this exact shape: ' +
  '{"shelf": string, "author": string, "genre": string, "publisher": string, "publishedYear": number | null, "pages": number | null, "language": string, "isbn13": string, "description": string, "whyRead": string, "keyThemes": string[], "targetAudience": string[], "similarBooks": string[], "notableQuotes": string[], "legacy": string} -- ' +
  'For "shelf", classify this book into exactly one of these 5 valid shelf categories: ' +
  '"technical" (software, systems, data, architecture, engineering, computer science), ' +
  '"philosophy" (philosophy, mindset, psychology, habits, stoicism, thinking, personal development), ' +
  '"business" (product management, leadership, startups, strategy, business, finance, economics), ' +
  '"fiction" (sci-fi, fantasy, novels, literature, romance), or ' +
  '"wishlist" (general non-fiction, memoirs, essays). ' +
  'Provide the author name, primary genre or genres separated by commas (e.g. "Fiction, Romance"), original publishing house (e.g. "Heyne Verlag"), publication year as integer, approximate page count as integer, language, ISBN-13 if known, ' +
  'CRITICAL LANGUAGE REQUIREMENT: Even if the book is in German, French, Spanish, or any other non-English language, the "description", "whyRead", "keyThemes", "targetAudience", and "legacy" fields MUST ALWAYS BE WRITTEN IN FLUENT ENGLISH (translate or provide an English synopsis). ' +
  'Provide a clear 2-4 sentence synopsis in English for "description", a compelling structured 3-5 point English "whyRead" explaining why one must read this book formatted as "Key Point: Brief description" separated by newlines (e.g. "Timeless principles: ... \\n Proven methodology: ..."), ' +
  '3-6 keyThemes in English, 2-4 targetAudience phrases in English, 3-5 similarBooks as "Title by Author", up to 3 notableQuotes (or empty array [] if unverified), ' +
  'and a brief 1-2 sentence cultural legacy or impact in English if applicable.';

const EMPTY_ENRICHMENT = {
  shelf: 'technical',
  author: '',
  genre: '',
  publisher: '',
  publishedYear: null,
  pages: undefined,
  language: 'English',
  isbn13: '',
  description: '',
  keyThemes: [],
  targetAudience: [],
  similarBooks: [],
  notableQuotes: [],
  whyRead: '',
  legacy: ''
};

const enrichWithAi = async (provider, creds, book) => {
  if (!provider || provider === 'builtin') {
    return { ...EMPTY_ENRICHMENT, shelf: inferShelfFromCategory(book.genre || book.categories, book.title) };
  }
  try {
    const raw = await chatComplete(provider, {
      ...creds,
      systemPrompt:
        'You are an expert literary analyst and library cataloger. Output valid JSON only, no markdown, no commentary.',
      userText:
        `Book: "${book.title}"${book.author ? ` by ${book.author}` : ''}.` +
        (book.description ? `\nDescription: ${book.description.slice(0, 1500)}` : '') +
        `\n\n${ENRICHMENT_INSTRUCTION}`,
      temperature: 0.2
    });
    const parsed = parseJsonLoose(raw);
    const shelf = normalizeShelf(parsed.shelf, parsed.genre || book.genre || book.categories, book.title);
    const pubYear = Number.parseInt(parsed.publishedYear, 10);
    const pageNum = Number.parseInt(parsed.pages || parsed.totalPages, 10);

    return {
      shelf,
      author: typeof parsed.author === 'string' && parsed.author !== 'Unknown' ? parsed.author.trim() : '',
      genre: typeof parsed.genre === 'string' && parsed.genre !== 'Unknown' ? parsed.genre.trim() : '',
      publisher: typeof parsed.publisher === 'string' && parsed.publisher !== 'Unknown' ? parsed.publisher.trim() : '',
      publishedYear: Number.isFinite(pubYear) ? pubYear : null,
      pages: Number.isFinite(pageNum) ? pageNum : undefined,
      language: typeof parsed.language === 'string' && parsed.language !== 'Unknown' ? parsed.language.trim() : '',
      isbn13: typeof parsed.isbn13 === 'string' && parsed.isbn13 !== 'Unknown' ? parsed.isbn13.trim() : '',
      description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
      keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes.slice(0, 6).map(String) : [],
      targetAudience: Array.isArray(parsed.targetAudience) ? parsed.targetAudience.slice(0, 4).map(String) : [],
      similarBooks: Array.isArray(parsed.similarBooks) ? parsed.similarBooks.slice(0, 5).map(String) : [],
      notableQuotes: Array.isArray(parsed.notableQuotes) ? parsed.notableQuotes.slice(0, 3).map(String) : [],
      whyRead: typeof parsed.whyRead === 'string' ? parsed.whyRead.trim() : '',
      legacy: typeof parsed.legacy === 'string' ? parsed.legacy.trim() : ''
    };
  } catch {
    return { ...EMPTY_ENRICHMENT, shelf: inferShelfFromCategory(book.genre || book.categories, book.title) };
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
  const { mode, isbn, imageDataUrl, provider, model, forceRefetch } = parsed.data;
  let { title, author } = parsed.data;

  // Auto-split "Title by Author" if author wasn't explicitly supplied
  if (title && !author && /\s+by\s+/i.test(title)) {
    const parts = title.split(/\s+by\s+/i);
    title = parts[0].trim();
    author = parts.slice(1).join(' by ').trim();
  }

  const envFallbacks = loadServerEnvFallbacks();
  const googleBooksApiKey =
    (parsed.data.googleBooksApiKey || '').trim() ||
    process.env.GOOGLE_BOOKS_API_KEY?.trim() ||
    envFallbacks.GOOGLE_BOOKS_API_KEY ||
    undefined;

  let apiKey = (parsed.data.apiKey || '').trim();
  if (!apiKey) {
    if (provider === 'mistral') apiKey = process.env.MISTRAL_API_KEY?.trim() || envFallbacks.MISTRAL_API_KEY || '';
    else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY?.trim() || envFallbacks.OPENAI_API_KEY || '';
    else if (provider === 'gemini') apiKey = process.env.GEMINI_API_KEY?.trim() || envFallbacks.GEMINI_API_KEY || '';
    else if (provider === 'anthropic')
      apiKey = process.env.ANTHROPIC_API_KEY?.trim() || envFallbacks.ANTHROPIC_API_KEY || '';
    else if (provider === 'ollama') apiKey = process.env.OLLAMA_API_KEY?.trim() || envFallbacks.OLLAMA_API_KEY || '';
    else if (provider === 'unsloth') apiKey = process.env.UNSLOTH_API_KEY?.trim() || envFallbacks.UNSLOTH_API_KEY || '';
  }

  const creds = { apiKey, baseUrl: parsed.data.baseUrl, model };

  if (mode === 'isbn' && !isbn?.trim()) return res.status(400).json({ ok: false, message: 'Enter an ISBN first.' });
  if (mode === 'title-author' && !title?.trim())
    return res.status(400).json({ ok: false, message: 'Enter a title first.' });

  try {
    // 1. Fetch existing books from database once to perform fast local duplicate detection
    const existingBooks = await listBooks().catch(() => []);

    // 2. Pre-check if book is already in database based on initial input (unless forceRefetch is true)
    if (!forceRefetch) {
      if (mode === 'isbn' || mode === 'title-author') {
        const match = findBookInList(existingBooks, { title, author, isbn });
        if (match) {
          return res.status(200).json({
            ok: true,
            alreadyExists: true,
            existingBook: match,
            message: `"${match.title}" is already in your database.`
          });
        }
      }
    }

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

      // Check if the book recognized from image is already in DB (unless forceRefetch is true)
      if (!forceRefetch) {
        const imageMatch = findBookInList(existingBooks, { title, author });
        if (imageMatch) {
          return res.status(200).json({
            ok: true,
            alreadyExists: true,
            existingBook: imageMatch,
            message: `"${imageMatch.title}" is already in your database.`
          });
        }
      }
    }

    // Lookup bibliographic facts & cover via Google Books (with API key) and Open Library
    let found =
      mode === 'isbn'
        ? await lookupByIsbn(isbn, googleBooksApiKey).catch(() => null)
        : await lookupByTitleAuthor(title, author, googleBooksApiKey).catch(() => null);

    // Call AI enrichment for rich cataloging & qualitative analysis (including genre, publisher, synopsis)
    const enrichment = await enrichWithAi(provider, creds, {
      title: found?.title || title,
      author: found?.author || author,
      description: found?.description
    });

    // If Google Books returned nothing, construct base book from AI metadata
    if (!found) {
      found = {
        title,
        author: enrichment.author || author || 'Unknown Author',
        publisher: enrichment.publisher || '',
        genre: enrichment.genre || '',
        publishedYear: enrichment.publishedYear || null,
        totalPages: enrichment.pages || undefined,
        language: enrichment.language || 'English',
        isbn: enrichment.isbn13 || '',
        isbn13: enrichment.isbn13 || '',
        description: enrichment.description || '',
        coverUrl: ''
      };
    }

    // Secondary cover lookup if coverUrl is still missing and we have author or isbn from AI
    if (!found.coverUrl) {
      const coverAuthor = found.author || enrichment.author || author;
      const coverIsbn = found.isbn13 || enrichment.isbn13;
      if (coverIsbn) {
        const isbnHit = await lookupByIsbn(coverIsbn, googleBooksApiKey).catch(() => null);
        if (isbnHit?.coverUrl) found.coverUrl = isbnHit.coverUrl;
      }
      if (!found.coverUrl && coverAuthor) {
        const titleHit = await lookupByTitleAuthor(found.title || title, coverAuthor, googleBooksApiKey).catch(
          () => null
        );
        if (titleHit?.coverUrl) found.coverUrl = titleHit.coverUrl;
      }
    }

    // Check if the resolved book matches an existing DB entry
    const resolvedMatch = findBookInList(existingBooks, {
      title: found.title || title,
      author: found.author || enrichment.author || author,
      isbn: found.isbn13 || found.isbn || enrichment.isbn13
    });
    if (resolvedMatch) {
      return res.status(200).json({
        ok: true,
        alreadyExists: true,
        existingBook: resolvedMatch,
        message: `"${resolvedMatch.title}" is already in your database.`
      });
    }

    // Merge Google Books and AI metadata with robust fallback
    const finalAuthor = found.author || enrichment.author || author || 'Unknown Author';
    const finalGenre = found.genre || enrichment.genre || 'General';
    const finalPublisher = found.publisher || enrichment.publisher || '';
    const finalPages = found.totalPages || enrichment.pages || undefined;
    const finalPublishedYear = found.publishedYear || enrichment.publishedYear || null;
    const finalLanguage = found.language || enrichment.language || 'English';
    const finalIsbn13 = enrichment.isbn13 || found.isbn13 || found.isbn || '';
    // Description: Always prefer AI enrichment's fluent English synopsis over
    // potentially foreign-language raw publisher blurbs from Google Books / Open Library
    const finalDescription = enrichment.description?.trim() || (found.description && found.description.trim()) || '';

    const mergedBook = {
      ...found,
      ...enrichment,
      title: found.title || title,
      author: finalAuthor,
      genre: finalGenre,
      publisher: finalPublisher,
      totalPages: finalPages,
      pages: finalPages,
      publishedYear: finalPublishedYear,
      language: finalLanguage,
      isbn13: finalIsbn13,
      isbn: found.isbn || finalIsbn13,
      description: finalDescription,
      coverUrl: found.coverUrl || '',
      aiProvider: provider,
      aiModel: model || 'default'
    };

    return res.status(200).json({
      ok: true,
      provider,
      model: model || 'default',
      aiProvider: provider,
      aiModel: model || 'default',
      book: mergedBook
    });
  } catch (error) {
    if (error instanceof AiProviderError || error instanceof BookLookupError) {
      return res.status(200).json({ ok: false, message: error.message });
    }
    console.error('Book AI autofill failed:', error);
    return res.status(502).json({ ok: false, message: error.message || 'Autofill failed.' });
  }
}
