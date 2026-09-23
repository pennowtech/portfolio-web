import { z } from 'zod';
import { requireIssueboardAdminApi, requireSameOriginMutation } from '@utils/issueboard/api';
import { findBook, patchBook, removeBook } from '@utils/books/bookRepository';

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    author: z.string().trim().min(1).max(300).optional(),
    shelf: z.enum(['technical', 'philosophy', 'fiction', 'business', 'wishlist']).optional(),
    status: z.enum(['wishlist', 'queued', 'reading', 'completed', 'reference']).optional(),
    currentPage: z.coerce.number().int().min(0).optional(),
    totalPages: z.coerce.number().int().positive().optional(),
    pages: z.coerce.number().int().positive().optional(),
    rating: z.coerce.number().min(0).max(5).optional()
  })
  .passthrough()
  .refine((value) => Object.keys(value).length > 0);

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor) return;
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ ok: false, error: { message: 'Method not allowed.' } });
  }
  const id = Array.isArray(req.query.bookId) ? req.query.bookId[0] : req.query.bookId;
  if (!id) return res.status(400).json({ ok: false, error: { message: 'Book id is required.' } });
  try {
    if (req.method === 'GET') {
      const book = await findBook(id);
      return book
        ? res.status(200).json({ ok: true, book })
        : res.status(404).json({ ok: false, error: { message: 'Book not found.' } });
    }
    if (!requireSameOriginMutation(req, res)) return;
    if (req.method === 'DELETE') {
      const deleted = await removeBook(id);
      return deleted
        ? res.status(200).json({ ok: true })
        : res.status(404).json({ ok: false, error: { message: 'Book not found.' } });
    }
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ ok: false, error: { message: 'Please check the book details.' } });
    const book = await patchBook(id, parsed.data);
    return book
      ? res.status(200).json({ ok: true, book })
      : res.status(404).json({ ok: false, error: { message: 'Book not found.' } });
  } catch (error) {
    console.error('Book API failed:', error);
    return res.status(503).json({ ok: false, error: { message: 'Book storage is temporarily unavailable.' } });
  }
}
