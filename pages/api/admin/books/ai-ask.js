import { z } from 'zod';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { chatComplete, AiProviderError } from '@utils/aiProviders';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const requestSchema = z.object({
  book: z.object({
    id: z.any().optional(),
    title: z.string().trim().min(1),
    author: z.string().trim().optional(),
    description: z.string().optional(),
    whyRead: z.string().optional(),
    keyThemes: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
    notableQuotes: z.array(z.string()).optional(),
    quotes: z.array(z.string()).optional(),
    publisher: z.string().optional(),
    publishedYear: z.any().optional(),
    shelf: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    legacy: z.string().optional()
  }),
  question: z.string().trim().min(1).max(5000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
      })
    )
    .optional(),
  provider: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional()
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  if (!isSameOriginRequest(req))
    return res.status(403).json({ ok: false, message: 'Request origin could not be verified.' });

  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ ok: false, message: 'Your admin session has expired.' });

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: 'Invalid question request.' });

  const { book, question, history } = parsed.data;
  let { provider, apiKey, baseUrl, model } = parsed.data;

  // If credentials are not provided in the request body, fallback to server environment variables
  // Keyless local providers (Ollama/Unsloth) must never receive a cloud key from the server environment.
  const keylessLocalProvider = provider === 'ollama' || provider === 'unsloth';
  if (!apiKey?.trim() && !keylessLocalProvider) {
    if (process.env.GEMINI_API_KEY) {
      provider = provider || 'gemini';
      apiKey = process.env.GEMINI_API_KEY;
      model = model || 'gemini-2.0-flash';
    } else if (process.env.OPENAI_API_KEY) {
      provider = provider || 'openai';
      apiKey = process.env.OPENAI_API_KEY;
      model = model || 'gpt-4o';
    } else if (process.env.GROQ_API_KEY) {
      provider = provider || 'groq';
      apiKey = process.env.GROQ_API_KEY;
      model = model || 'llama-3.3-70b-versatile';
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = provider || 'anthropic';
      apiKey = process.env.ANTHROPIC_API_KEY;
      model = model || 'claude-3-5-sonnet-latest';
    }
  }

  if (!provider || provider === 'builtin' || (!apiKey?.trim() && !keylessLocalProvider)) {
    return res.status(400).json({
      ok: false,
      message:
        'Please configure an active AI provider (e.g. Gemini, OpenAI, Groq, Ollama, or Unsloth) in AI Configure first to use Ask AI.'
    });
  }

  // Construct a book-grounded system prompt
  const themesList = Array.isArray(book.keyThemes) && book.keyThemes.length ? book.keyThemes.join(', ') : 'None listed';
  const audienceList =
    Array.isArray(book.targetAudience) && book.targetAudience.length
      ? book.targetAudience.join(', ')
      : 'General readers';
  const quotesList =
    Array.isArray(book.notableQuotes || book.quotes) && (book.notableQuotes || book.quotes).length
      ? (book.notableQuotes || book.quotes).map((q) => `"${q}"`).join('\n')
      : '';

  const systemPrompt = `You are a scholarly and deeply knowledgeable reading companion and intellectual mentor.
The user is asking questions strictly in the context of this specific book from their personal library:

BOOK DOSSIER:
- Title: "${book.title}"
- Author: "${book.author || 'Unknown'}"
- Published Year: ${book.publishedYear || 'Unknown'}
- Publisher: ${book.publisher || 'Unknown'}
- Assigned Shelf: ${book.shelf || 'Technical'}
- Reading Status: ${book.status || 'Reading'}
${book.description ? `- Synopsis / Overview: ${book.description}` : ''}
${book.whyRead ? `- Why Read & Core Value / ROI: ${book.whyRead}` : ''}
- Key Themes & Topics: ${themesList}
- Intended Audience: ${audienceList}
${quotesList ? `- Notable Quotes from the Book:\n${quotesList}` : ''}
${book.legacy ? `- Legacy & Cultural Impact: ${book.legacy}` : ''}
${book.notes ? `- Reader's Personal Notes & Annotations: ${book.notes}` : ''}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Answer the question with authoritative depth, specifically drawing upon the frameworks, chapter theses, mental models, concrete examples, and trade-offs presented in "${book.title}" by ${book.author || 'the author'}.
2. If the user asks for actionable takeaways, synthesis, comparison, or clarification, ground your explanation directly in the author's arguments and definitions.
3. If the user asks a question that goes beyond what this book directly covers, provide the analysis through the perspective of this book's principles, noting where the book's core philosophy applies.
4. Format your answer with clean GitHub-flavored Markdown (concise headings, bullet points, and bold key terms).
5. Maintain a sharp, articulate, and insightful tone. Avoid generic fluff or repetitive disclaimers.`;

  // Format previous conversation turns if provided
  let formattedUserText = question;
  if (Array.isArray(history) && history.length > 0) {
    const priorDialogue = history
      .slice(-6)
      .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    formattedUserText = `Previous conversation context:\n${priorDialogue}\n\nCurrent Question: ${question}`;
  }

  try {
    const answer = await chatComplete(provider, {
      apiKey: apiKey?.trim() || '',
      baseUrl,
      model,
      systemPrompt,
      userText: formattedUserText,
      temperature: 0.3
    });

    return res.status(200).json({
      ok: true,
      answer: answer.trim(),
      provider,
      model: model || 'default',
      aiProvider: provider,
      aiModel: model || 'default'
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return res.status(200).json({ ok: false, message: error.message });
    }
    console.error('Ask AI error:', error);
    return res.status(502).json({ ok: false, message: error.message || 'Could not reach the AI provider.' });
  }
}
