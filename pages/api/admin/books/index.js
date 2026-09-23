import { z } from 'zod';
import { requireIssueboardAdminApi, requireSameOriginMutation } from '@utils/issueboard/api';
import { insertBook, listBooks } from '@utils/books/bookRepository';

const bookSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    author: z.string().trim().min(1).max(300),
    shelf: z.enum(['technical', 'philosophy', 'fiction', 'business', 'wishlist']).optional(),
    status: z.enum(['wishlist', 'queued', 'reading', 'completed', 'reference']).optional(),
    currentPage: z.coerce.number().int().min(0).optional(),
    totalPages: z.coerce.number().int().positive().optional(),
    pages: z.coerce.number().int().positive().optional(),
    rating: z.coerce.number().min(0).max(5).optional()
  })
  .passthrough();

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor) return;
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: { message: 'Method not allowed.' } });
  }
  try {
    if (req.method === 'GET') return res.status(200).json({ ok: true, books: await listBooks() });
    if (!requireSameOriginMutation(req, res)) return;
    const parsed = bookSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ ok: false, error: { message: 'Please check the book details.' } });
    return res.status(201).json({ ok: true, book: await insertBook(parsed.data) });
  } catch (error) {
    console.error('Books API failed:', error);
    return res.status(503).json({ ok: false, error: { message: 'Book storage is temporarily unavailable.' } });
  }
}
