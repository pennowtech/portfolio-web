// Free, keyless Google Books lookups used to autofill bibliographic fields.
// The AI provider (utils/aiProviders.js) is only used on top of this for
// qualitative enrichment (themes, audience, similar titles) that Google
// Books doesn't provide -- bibliographic facts come from Google Books, not
// the model, to avoid hallucinated titles/authors/page counts.
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export class BookLookupError extends Error {}

const normalizeIsbn = (value) =>
  String(value || '')
    .replace(/[^0-9Xx]/g, '')
    .toUpperCase();

const pickIsbn = (identifiers = []) => {
  const isbn13 = identifiers.find((id) => id.type === 'ISBN_13')?.identifier || '';
  const isbn10 = identifiers.find((id) => id.type === 'ISBN_10')?.identifier || '';
  return { isbn13, isbn: isbn13 || isbn10 };
};

const fromVolume = (volume) => {
  const info = volume?.volumeInfo;
  if (!info?.title) return null;
  const { isbn13, isbn } = pickIsbn(info.industryIdentifiers);
  const publishedYear = info.publishedDate ? Number.parseInt(info.publishedDate.slice(0, 4), 10) : null;
  return {
    title: info.title,
    author: (info.authors || []).join(', '),
    totalPages: info.pageCount || undefined,
    publishedYear: Number.isFinite(publishedYear) ? publishedYear : null,
    genre: (info.categories || [])[0] || '',
    language: info.language === 'en' ? 'English' : info.language || '',
    publisher: info.publisher || '',
    isbn,
    isbn13,
    description: (info.description || '').replace(/<[^>]+>/g, ''),
    coverUrl: (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '').replace(/^http:/, 'https:'),
    rating: typeof info.averageRating === 'number' ? info.averageRating : undefined
  };
};

const searchGoogleBooks = async (query) => {
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=5`;
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new BookLookupError('Could not reach Google Books to look this up.');
  }
  if (!response.ok) {
    if (response.status === 429) {
      throw new BookLookupError('Google Books rate-limited this request. Try again in a moment.');
    }
    throw new BookLookupError('Google Books lookup is temporarily unavailable.');
  }
  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];
  for (const item of items) {
    const book = fromVolume(item);
    if (book) return book;
  }
  return null;
};

export const lookupByIsbn = async (isbn) => {
  const clean = normalizeIsbn(isbn);
  if (!clean) return null;
  return searchGoogleBooks(`isbn:${clean}`);
};

export const lookupByTitleAuthor = async (title, author) => {
  const t = String(title || '').trim();
  const a = String(author || '').trim();
  if (!t) return null;
  const query = a ? `intitle:${t} inauthor:${a}` : `intitle:${t}`;
  return searchGoogleBooks(query);
};
