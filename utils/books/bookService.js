/**
 * Book Records Service for the SinghBuildsTech Personal Library & Reading Tracker.
 * Manages personal books, shelves, reading progress, ratings, and quotes.
 */

export const BOOK_SHELVES = [
  { id: 'all', label: 'All Books' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'technical', label: 'Technical & Architecture' },
  { id: 'philosophy', label: 'Philosophy & Mind' },
  { id: 'business', label: 'Product & Leadership' },
  { id: 'fiction', label: 'Fiction & Sci-Fi' },
  { id: 'wishlist', label: 'Wishlist / To Read' }
];

export const INITIAL_BOOKS = [
  {
    id: 'book-1',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    shelf: 'technical',
    status: 'reading',
    currentPage: 420,
    totalPages: 615,
    rating: 5,
    coverColor: 'from-amber-600 to-orange-800',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2017,
    isbn: '978-1449373320',
    quotes: [
      'Reliability is continuing to work correctly even when things go wrong.',
      'A system cannot be both consistent and available in the presence of partitions.'
    ],
    notes: 'The definitive handbook on distributed storage, consensus, and event streaming.',
    updatedAt: '2026-09-18T10:00:00Z'
  },
  {
    id: 'book-2',
    title: 'The Pragmatic Programmer: 20th Anniversary Edition',
    author: 'David Thomas, Andrew Hunt',
    shelf: 'technical',
    status: 'completed',
    currentPage: 352,
    totalPages: 352,
    rating: 5,
    coverColor: 'from-emerald-700 to-teal-900',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2019,
    isbn: '978-0135957059',
    quotes: [
      'Care About Your Craft. Why spend your life developing software unless you care about doing it well?',
      'Don’t Live with Broken Windows.'
    ],
    notes: 'Timeless engineering wisdom on pragmatism, refactoring, and compounding knowledge.',
    updatedAt: '2026-08-20T14:30:00Z'
  },
  {
    id: 'book-3',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 464,
    totalPages: 464,
    rating: 5,
    coverColor: 'from-blue-700 to-indigo-900',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2014,
    isbn: '978-0062316097',
    quotes: [
      'You could never convince a monkey to give you a banana by promising him limitless bananas after death in monkey heaven.',
      'Fiction has enabled us not merely to imagine things, but to do so collectively.'
    ],
    notes: 'Profound perspective on shared mythologies, currency, and human cooperation.',
    updatedAt: '2026-07-15T09:12:00Z'
  },
  {
    id: 'book-4',
    title: 'Algorithms to Live By',
    author: 'Brian Christian, Tom Griffiths',
    shelf: 'philosophy',
    status: 'reading',
    currentPage: 185,
    totalPages: 368,
    rating: 4.5,
    coverColor: 'from-purple-700 to-slate-900',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2016,
    isbn: '978-1627790369',
    quotes: [
      'Optimal stopping gives us a rigorous way to decide when to stop looking and commit: the 37% rule.',
      'Exploration is gathering data; exploitation is leveraging what you already know.'
    ],
    notes: 'Applying computer science algorithms to everyday human dilemmas and cognitive limits.',
    updatedAt: '2026-09-17T18:45:00Z'
  },
  {
    id: 'book-5',
    title: 'Staff Engineer: Leadership beyond the management track',
    author: 'Will Larson',
    shelf: 'business',
    status: 'completed',
    currentPage: 280,
    totalPages: 280,
    rating: 5,
    coverColor: 'from-cyan-700 to-blue-900',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2021,
    isbn: '978-1736417904',
    quotes: [
      'Being a Staff engineer is not about being the smartest person in the room; it is about steering the technical strategy of an organization.'
    ],
    notes: 'Essential roadmap for technical IC progression, archetypes, and architectural sponsorship.',
    updatedAt: '2026-06-10T11:20:00Z'
  },
  {
    id: 'book-6',
    title: 'Dune',
    author: 'Frank Herbert',
    shelf: 'fiction',
    status: 'reading',
    currentPage: 310,
    totalPages: 688,
    rating: 5,
    coverColor: 'from-amber-700 to-yellow-900',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    publishedYear: 1965,
    isbn: '978-0441172719',
    quotes: ['I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration.'],
    notes: 'Masterpiece on ecology, political intrigue, and prescience.',
    updatedAt: '2026-09-12T16:00:00Z'
  },
  {
    id: 'book-7',
    title: 'Building Microservices: Designing Fine-Grained Systems (2nd Ed)',
    author: 'Sam Newman',
    shelf: 'technical',
    status: 'wishlist',
    currentPage: 0,
    totalPages: 612,
    rating: 0,
    coverColor: 'from-slate-700 to-slate-900',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2021,
    isbn: '978-1492034025',
    quotes: [],
    notes: 'Planned reading on service boundaries, sagas, and event-driven architecture evolution.',
    updatedAt: '2026-09-01T08:00:00Z'
  }
];

const STORAGE_KEY = 'singhbuildstech_admin_books_v1';

export const getStoredBooks = () => {
  if (typeof window === 'undefined') return INITIAL_BOOKS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BOOKS;
  } catch {
    return INITIAL_BOOKS;
  }
};

export const saveStoredBooks = (books) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.error('Failed to save books to localStorage:', err);
  }
};

export const createBook = (bookInput) => {
  const books = getStoredBooks();
  const newBook = {
    id: `book-${Date.now()}`,
    title: bookInput.title.trim(),
    author: bookInput.author.trim(),
    shelf: bookInput.shelf || 'technical',
    status: bookInput.status || (Number(bookInput.currentPage) > 0 ? 'reading' : 'wishlist'),
    currentPage: Number(bookInput.currentPage) || 0,
    totalPages: Number(bookInput.totalPages) || 300,
    rating: Number(bookInput.rating) || 0,
    coverColor: bookInput.coverColor || 'from-emerald-700 to-teal-900',
    coverImage:
      bookInput.coverImage ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    publishedYear: Number(bookInput.publishedYear) || new Date().getFullYear(),
    isbn: bookInput.isbn || '',
    quotes: bookInput.quote ? [bookInput.quote.trim()] : [],
    notes: bookInput.notes || '',
    updatedAt: new Date().toISOString()
  };

  const updated = [newBook, ...books];
  saveStoredBooks(updated);
  return newBook;
};

export const updateBook = (id, updates) => {
  const books = getStoredBooks();
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = books[index];
  const updatedBook = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Auto update status if finished
  if (updatedBook.currentPage >= updatedBook.totalPages && updatedBook.totalPages > 0) {
    updatedBook.status = 'completed';
  } else if (updatedBook.currentPage > 0 && updatedBook.status === 'wishlist') {
    updatedBook.status = 'reading';
  }

  books[index] = updatedBook;
  saveStoredBooks(books);
  return updatedBook;
};

export const deleteBook = (id) => {
  const books = getStoredBooks();
  const filtered = books.filter((b) => b.id !== id);
  saveStoredBooks(filtered);
  return true;
};
