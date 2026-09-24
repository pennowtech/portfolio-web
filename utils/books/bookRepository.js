import { randomUUID } from 'node:crypto';
import { getIssueboardSupabaseAdmin } from '@utils/issueboard/supabaseAdmin';
import { INITIAL_BOOKS } from './bookService';

const TABLE = 'books_library';

const cleanArray = (value) =>
  Array.isArray(value)
    ? value
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
const metadataFieldNames = new Set(['awards', 'sales', 'series', 'editions', 'legacy', 'similarbooks']);
const cleanMetadataQuotes = (value) =>
  cleanArray(value)
    .filter((quote) => quote.length >= 10 && !metadataFieldNames.has(quote.toLowerCase()))
    .filter((quote) => !quote.endsWith('],"'))
    .slice(0, 20);
const numberOr = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

const toRow = (book, { partial = false } = {}) => {
  const row = {};
  const set = (key, value) => {
    if (!partial || value !== undefined) row[key] = value;
  };

  set('id', book.id || `book-${randomUUID()}`);
  set('title', book.title?.trim());
  set('author', book.author?.trim());
  set('shelf', book.shelf || 'technical');
  set('status', book.status || 'wishlist');
  set('current_page', numberOr(book.currentPage, 0));
  set('total_pages', numberOr(book.totalPages ?? book.pages, 300));
  set('rating', numberOr(book.rating, 0));
  set('format', book.format || 'physical');
  set('genre', book.genre?.trim() || 'General');
  set('language', book.language?.trim() || 'English');
  set('publisher', book.publisher?.trim() || '');
  set('published_year', book.publishedYear ? numberOr(book.publishedYear, null) : null);
  set('isbn', (book.isbn13 || book.isbn || '').trim());
  set('description', book.description?.trim() || '');
  set('key_themes', cleanArray(book.keyThemes));
  set('target_audience', cleanArray(book.targetAudience));
  set('similar_books', cleanArray(book.similarBooks));
  set('notable_quotes', cleanArray(book.notableQuotes || book.quotes));
  set('cover_local_path', book.coverLocalPath?.trim() || null);
  set('cover_url', book.coverUrl?.trim() || null);
  set('cover_image', book.coverImage?.trim() || null);
  set('cover_color', book.coverColor?.trim() || null);
  let notesText = (book.notes || '').trim();
  const whyReadText = (book.whyRead !== undefined ? book.whyRead : '').trim();
  if (whyReadText) {
    if (notesText.startsWith('Why Read:')) {
      const parts = notesText.split('\n\n');
      parts.shift();
      const remainder = parts.join('\n\n').trim();
      notesText = remainder ? `Why Read: ${whyReadText}\n\n${remainder}` : `Why Read: ${whyReadText}`;
    } else {
      notesText = notesText ? `Why Read: ${whyReadText}\n\n${notesText}` : `Why Read: ${whyReadText}`;
    }
    set('notes', notesText);
  } else if (book.notes !== undefined) {
    set('notes', notesText);
  }
  set('legacy', book.legacy || '');
  set('sales', book.sales || '');
  return row;
};

const fromRow = (row) => {
  const rawNotes = row.notes || '';
  const hasWhyReadPrefix = rawNotes.startsWith('Why Read:');
  const extractedWhyRead = hasWhyReadPrefix
    ? rawNotes
        .replace(/^Why Read:\s*/, '')
        .split('\n\n')[0]
        .trim()
    : '';
  const extractedNotes = hasWhyReadPrefix ? rawNotes.split('\n\n').slice(1).join('\n\n').trim() : rawNotes;

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    shelf: row.shelf,
    status: row.status,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    pages: row.total_pages,
    rating: Number(row.rating),
    format: row.format,
    genre: row.genre,
    language: row.language,
    publisher: row.publisher,
    publishedYear: row.published_year,
    isbn: row.isbn,
    isbn13: row.isbn,
    description: row.description,
    keyThemes: row.key_themes,
    targetAudience: row.target_audience,
    similarBooks: row.similar_books,
    notableQuotes: row.notable_quotes,
    quotes: row.notable_quotes,
    coverLocalPath: row.cover_local_path,
    coverUrl: row.cover_url,
    coverImage: row.cover_image,
    coverColor: row.cover_color,
    notes: extractedNotes,
    whyRead: row.why_read || extractedWhyRead || '',
    legacy: row.legacy,
    sales: row.sales,
    updatedAt: row.updated_at
  };
};

const throwIfError = (error) => {
  if (error) throw error;
};

export const listBooks = async () => {
  const supabase = getIssueboardSupabaseAdmin();
  let { data, error } = await supabase.from(TABLE).select('*').order('title');
  throwIfError(error);

  // Preserve the existing catalogue once on first deployment. The marker is
  // separate from the rows so intentionally deleting every book stays deleted.
  const state = await supabase.from('books_library_state').select('seeded_at').eq('singleton', true).maybeSingle();
  throwIfError(state.error);
  if (!state.data) {
    const seeded = await supabase
      .from(TABLE)
      .upsert(INITIAL_BOOKS.map((book) => toRow(book)))
      .select('*');
    throwIfError(seeded.error);
    const marker = await supabase.from('books_library_state').upsert({ singleton: true });
    throwIfError(marker.error);
    data = seeded.data;
  }
  return data.map(fromRow);
};

export const findBook = async (id) => {
  const { data, error } = await getIssueboardSupabaseAdmin().from(TABLE).select('*').eq('id', id).maybeSingle();
  throwIfError(error);
  return data ? fromRow(data) : null;
};

export const insertBook = async (book) => {
  const totalPages = Math.max(1, numberOr(book.totalPages ?? book.pages, 300));
  const currentPage = Math.min(totalPages, Math.max(0, numberOr(book.currentPage, 0)));
  const status = book.status || (currentPage >= totalPages ? 'completed' : currentPage > 0 ? 'reading' : 'wishlist');
  const row = toRow({ ...book, currentPage, totalPages, status });
  const { data, error } = await getIssueboardSupabaseAdmin().from(TABLE).insert(row).select('*').single();
  throwIfError(error);
  return fromRow(data);
};

export const patchBook = async (id, updates) => {
  const existing = await findBook(id);
  if (!existing) return null;
  const totalPages = Math.max(1, numberOr(updates.totalPages ?? updates.pages, existing.totalPages));
  const currentPage = Math.min(totalPages, Math.max(0, numberOr(updates.currentPage, existing.currentPage)));
  let status = updates.status || existing.status;
  if (currentPage >= totalPages) status = 'completed';
  else if (currentPage > 0 && ['wishlist', 'queued'].includes(status)) status = 'reading';
  const row = toRow({ ...existing, ...updates, currentPage, totalPages, status });
  delete row.id;
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  throwIfError(error);
  return data ? fromRow(data) : null;
};

export const removeBook = async (id) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from(TABLE)
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  throwIfError(error);
  return Boolean(data);
};

export const importMetadataBooks = async (metadataBooks) => {
  const supabase = getIssueboardSupabaseAdmin();
  const { data: rows, error } = await supabase.from(TABLE).select('*');
  throwIfError(error);
  const existing = rows.map(fromRow);
  let added = 0;
  let updated = 0;

  const importedRows = metadataBooks.map((metadata) => {
    const normalizedIsbn = String(metadata.isbn13 || metadata.isbn || '').replace(/[^0-9X]/gi, '');
    const match = existing.find((book) => {
      const bookIsbn = String(book.isbn13 || book.isbn || '').replace(/[^0-9X]/gi, '');
      if (normalizedIsbn && bookIsbn) return normalizedIsbn === bookIsbn;
      return (
        book.title.trim().toLowerCase() === String(metadata.title).trim().toLowerCase() &&
        book.author.trim().toLowerCase() === String(metadata.author).trim().toLowerCase()
      );
    });

    if (match) updated += 1;
    else added += 1;

    // Metadata owns bibliographic fields; the library owns personal state.
    // Keep progress, shelf, status, rating, notes, and format when updating.
    return toRow({
      ...(match || {}),
      ...metadata,
      notableQuotes: cleanMetadataQuotes(metadata.notableQuotes || metadata.quotes),
      quotes: cleanMetadataQuotes(metadata.notableQuotes || metadata.quotes),
      id: match?.id,
      currentPage: match?.currentPage ?? 0,
      shelf: match?.shelf || 'wishlist',
      status: match?.status || 'wishlist',
      rating: match?.rating ?? Number(metadata.ratings?.google?.average || 0),
      notes: match?.notes || '',
      format: match?.format || 'physical',
      totalPages: metadata.pages || metadata.totalPages || match?.totalPages || 300
    });
  });

  // One PostgreSQL statement: either every validated row is committed or none is.
  const result = await supabase.from(TABLE).upsert(importedRows).select('*');
  throwIfError(result.error);
  return { added, updated, total: result.data.length };
};
