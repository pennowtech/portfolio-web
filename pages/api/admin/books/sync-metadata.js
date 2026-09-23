import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { requireIssueboardAdminApi } from '@utils/issueboard/api';
import { requireSameOriginMutation } from '@utils/issueboard/api';
import { importMetadataBooks } from '@utils/books/bookRepository';

const metadataBookSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    author: z.string().trim().min(1).max(300),
    pages: z.coerce.number().int().positive().max(100000).optional(),
    totalPages: z.coerce.number().int().positive().max(100000).optional(),
    publishedYear: z.coerce.number().int().min(1000).max(9999).nullable().optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    genre: z.string().max(500).optional(),
    language: z.string().max(100).optional(),
    publisher: z.string().max(300).optional(),
    isbn: z.string().max(32).optional(),
    isbn13: z.string().max(32).optional(),
    description: z.string().max(20000).optional(),
    coverLocalPath: z.string().max(255).optional(),
    coverUrl: z.string().url().max(2000).nullable().optional(),
    keyThemes: z.array(z.string().max(500)).max(100).optional(),
    targetAudience: z.array(z.string().max(500)).max(100).optional(),
    notableQuotes: z.array(z.string().max(5000)).max(100).optional(),
    similarBooks: z.array(z.string().max(500)).max(100).optional()
  })
  .passthrough();

const importSchema = z.object({ books: z.array(metadataBookSchema).min(1).max(500) });

const duplicateKey = (book) => {
  const isbn = String(book.isbn13 || book.isbn || '').replace(/[^0-9X]/gi, '');
  return isbn || `${book.title.trim().toLowerCase()}::${book.author.trim().toLowerCase()}`;
};

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor) return;
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const metadataPath = path.join(process.cwd(), 'tools/book-metadata/output/books.json');

  if (req.method === 'GET' && !fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: 'Book metadata file not found at tools/book-metadata/output/books.json' });
  }

  try {
    const data = req.method === 'POST' ? req.body : JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const books = Array.isArray(data) ? data : data.books;
    const parsed = importSchema.safeParse({ books });
    if (!parsed.success) {
      return res.status(422).json({ error: 'The selected JSON contains invalid or unsafe book data.' });
    }
    const keys = parsed.data.books.map(duplicateKey);
    if (new Set(keys).size !== keys.length) {
      return res.status(422).json({ error: 'The selected JSON contains duplicate books.' });
    }

    const readableBooks = parsed.data.books.map((book) => ({
      ...book,
      coverAvailable: Boolean(
        book.coverLocalPath &&
        fs.existsSync(path.join(process.cwd(), 'tools/book-metadata/output/covers', path.basename(book.coverLocalPath)))
      )
    }));

    if (req.method === 'GET') {
      return res.status(200).json({
        generatedAt: data.generatedAt || null,
        generatedBy: data.generatedBy || null,
        bookCount: readableBooks.length,
        books: readableBooks
      });
    }
    if (!requireSameOriginMutation(req, res)) return;
    const result = await importMetadataBooks(readableBooks);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('Book metadata import failed:', err);
    return res.status(500).json({ error: 'The import failed before any book data was changed.' });
  }
}
