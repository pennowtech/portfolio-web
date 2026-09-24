// Free, keyless lookups used to autofill bibliographic fields.
// Primary source: Google Books API (https://www.googleapis.com/books/v1/volumes)
// Secondary/fallback source: Open Library API (https://openlibrary.org & https://covers.openlibrary.org)
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPENLIBRARY_COVERS_API = 'https://covers.openlibrary.org';
const OPENLIBRARY_SEARCH_API = 'https://openlibrary.org/search.json';

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

const completenessScore = (book) =>
  (book.totalPages ? 1 : 0) +
  (book.genre ? 1 : 0) +
  (book.publisher ? 1 : 0) +
  (book.isbn13 ? 1 : 0) +
  (book.coverUrl ? 1 : 0) +
  (book.description ? 1 : 0) +
  (book.publishedYear ? 1 : 0);

const searchGoogleBooks = async (query, apiKey) => {
  const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=5${keyParam}`;
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
  const candidates = items.map(fromVolume).filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) =>
    completenessScore(candidate) > completenessScore(best) ? candidate : best
  );
};

export const lookupCoverFromOpenLibrary = async ({ isbn, title, author }) => {
  const clean = normalizeIsbn(isbn);
  if (clean) {
    try {
      const url = `${OPENLIBRARY_COVERS_API}/b/isbn/${encodeURIComponent(clean)}-L.jpg?default=false`;
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch {
      // Fall through to title+author search
    }
  }

  const t = String(title || '').trim();
  const a = String(author || '').trim();
  if (!t) return null;

  try {
    const q = a ? `title=${encodeURIComponent(t)}&author=${encodeURIComponent(a)}` : `title=${encodeURIComponent(t)}`;
    const res = await fetch(`${OPENLIBRARY_SEARCH_API}?${q}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.docs?.[0];
    const coverId = doc?.cover_i || doc?.cover_id;
    if (coverId) {
      const coverUrl = `${OPENLIBRARY_COVERS_API}/b/id/${coverId}-L.jpg`;
      const verify = await fetch(coverUrl, { method: 'HEAD' });
      if (verify.ok) return coverUrl;
    }
  } catch {
    // Graceful fallback
  }
  return null;
};

const searchOpenLibrary = async ({ isbn, title, author }) => {
  try {
    let url;
    if (isbn) {
      url = `${OPENLIBRARY_SEARCH_API}?isbn=${encodeURIComponent(isbn)}&limit=1`;
    } else {
      const t = String(title || '').trim();
      const a = String(author || '').trim();
      if (!t) return null;
      url = `${OPENLIBRARY_SEARCH_API}?title=${encodeURIComponent(t)}${a ? `&author=${encodeURIComponent(a)}` : ''}&limit=1`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.docs?.[0];
    if (!doc || !doc.title) return null;

    const coverId = doc.cover_i || doc.cover_id;
    const coverUrl = coverId ? `${OPENLIBRARY_COVERS_API}/b/id/${coverId}-L.jpg` : '';
    const isbn13 = (doc.isbn || []).find((id) => id.length === 13) || '';
    const isbn10 = (doc.isbn || []).find((id) => id.length === 10) || '';

    return {
      title: doc.title,
      author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : doc.author_name || '',
      totalPages: doc.number_of_pages_median || undefined,
      publishedYear: doc.first_publish_year || null,
      genre: (doc.subject || [])[0] || '',
      language: Array.isArray(doc.language) ? (doc.language[0] === 'eng' ? 'English' : doc.language[0]) : '',
      publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : doc.publisher || '',
      isbn: isbn13 || isbn10,
      isbn13,
      description: '',
      coverUrl,
      rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(1)) : undefined
    };
  } catch {
    return null;
  }
};

export const lookupByIsbn = async (isbn, apiKey) => {
  const clean = normalizeIsbn(isbn);
  if (!clean) return null;
  let book = null;
  try {
    book = await searchGoogleBooks(`isbn:${clean}`, apiKey);
  } catch (err) {
    if (err instanceof BookLookupError && err.message.includes('rate-limited')) {
      book = await searchOpenLibrary({ isbn: clean });
    } else {
      throw err;
    }
  }

  if (!book) {
    book = await searchOpenLibrary({ isbn: clean });
  }

  if (book && !book.coverUrl) {
    const olCover = await lookupCoverFromOpenLibrary({ isbn: clean, title: book.title, author: book.author });
    if (olCover) book.coverUrl = olCover;
  }

  return book;
};

export const lookupByTitleAuthor = async (title, author, apiKey) => {
  const t = String(title || '').trim();
  const a = String(author || '').trim();
  if (!t) return null;
  const query = a ? `intitle:${t} inauthor:${a}` : `intitle:${t}`;
  let book = null;
  try {
    book = await searchGoogleBooks(query, apiKey);
  } catch (err) {
    if (err instanceof BookLookupError && err.message.includes('rate-limited')) {
      book = await searchOpenLibrary({ title: t, author: a });
    } else {
      throw err;
    }
  }

  if (!book) {
    book = await searchOpenLibrary({ title: t, author: a });
  }

  if (book && !book.coverUrl) {
    const olCover = await lookupCoverFromOpenLibrary({
      isbn: book.isbn13 || book.isbn,
      title: book.title,
      author: book.author
    });
    if (olCover) book.coverUrl = olCover;
  }

  return book;
};
