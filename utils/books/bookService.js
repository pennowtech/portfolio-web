/**
 * Book Records Service for the SinghBuildsTech Personal Library & Reading Tracker.
 * Manages personal books, shelves, reading progress, ratings, and quotes.
 */

export const BOOK_SHELVES = [
  { id: 'all', label: 'All Shelves', tag: 'All' },
  { id: 'technical', label: 'Tech (12)', tag: 'Tech' },
  { id: 'philosophy', label: 'Philosophy (4)', tag: 'Philosophy' },
  { id: 'fiction', label: 'Fiction (2)', tag: 'Fiction' },
  { id: 'business', label: 'Product & Leadership (1)', tag: 'Product' },
  { id: 'wishlist', label: 'Wishlist (1)', tag: 'Wishlist' }
];

export const INITIAL_BOOKS = [
  // ================= TECHNICAL SHELF (12 BOOKS) =================
  {
    id: 'book-tech-1',
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
    quotes: ['Care About Your Craft.', 'Don’t Live with Broken Windows.'],
    notes: 'Timeless engineering wisdom on pragmatism, refactoring, and compounding knowledge.',
    updatedAt: '2026-09-18T10:00:00Z'
  },
  {
    id: 'book-tech-2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    shelf: 'technical',
    status: 'completed',
    currentPage: 615,
    totalPages: 615,
    rating: 5,
    coverColor: 'from-amber-700 to-yellow-950',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2017,
    isbn: '978-1449373320',
    quotes: ['Reliability is continuing to work correctly even when things go wrong.'],
    notes: 'The definitive handbook on distributed storage, consensus, and event streaming.',
    updatedAt: '2026-09-15T14:30:00Z'
  },
  {
    id: 'book-tech-3',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    shelf: 'technical',
    status: 'completed',
    currentPage: 464,
    totalPages: 464,
    rating: 4.8,
    coverColor: 'from-blue-700 to-cyan-950',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2008,
    isbn: '978-0132350884',
    quotes: ['Clean code always looks like it was written by someone who cares.'],
    notes: 'Foundational principles of meaningful names, small functions, and readability.',
    updatedAt: '2026-08-20T11:00:00Z'
  },
  {
    id: 'book-tech-4',
    title: "System Design Interview – An Insider's Guide",
    author: 'Alex Xu',
    shelf: 'technical',
    status: 'completed',
    currentPage: 320,
    totalPages: 320,
    rating: 5,
    coverColor: 'from-slate-700 to-zinc-950',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2020,
    isbn: '979-8664653403',
    quotes: ['Scale from zero to millions of users with clarity and modular components.'],
    notes: 'Essential architectural patterns for rate limiters, key-value stores, and notifications.',
    updatedAt: '2026-08-10T16:00:00Z'
  },
  {
    id: 'book-tech-5',
    title: 'Refactoring: Improving the Design of Existing Code',
    author: 'Martin Fowler',
    shelf: 'technical',
    status: 'completed',
    currentPage: 448,
    totalPages: 448,
    rating: 5,
    coverColor: 'from-teal-700 to-emerald-950',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2018,
    isbn: '978-0134757599',
    quotes: [
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.'
    ],
    notes: 'Catalog of code smells and step-by-step transformations with test harnesses.',
    updatedAt: '2026-07-28T09:00:00Z'
  },
  {
    id: 'book-tech-6',
    title: 'Site Reliability Engineering: How Google Runs Production Systems',
    author: 'Betsy Beyer, Chris Jones, Jennifer Petoff',
    shelf: 'technical',
    status: 'completed',
    currentPage: 550,
    totalPages: 550,
    rating: 4.9,
    coverColor: 'from-cyan-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2016,
    isbn: '978-1491929124',
    quotes: ['Hope is not a strategy. Service level objectives and error budgets quantify risk.'],
    notes: 'Operational excellence, postmortems, and treating operations as a software problem.',
    updatedAt: '2026-07-14T10:30:00Z'
  },
  {
    id: 'book-tech-7',
    title: 'Database Internals: A Deep Dive into Distributed Storage',
    author: 'Alex Petrov',
    shelf: 'technical',
    status: 'completed',
    currentPage: 376,
    totalPages: 376,
    rating: 4.8,
    coverColor: 'from-indigo-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2019,
    isbn: '978-1492040347',
    quotes: ['B-Trees vs LSM-Trees: Understanding page layouts, write amplification, and compaction.'],
    notes: 'Storage engine mechanics, WAL, memory tables, and distributed replication consensus.',
    updatedAt: '2026-06-25T15:00:00Z'
  },
  {
    id: 'book-tech-8',
    title: 'Accelerate: The Science of Lean Software and DevOps',
    author: 'Nicole Forsgren, Jez Humble, Gene Kim',
    shelf: 'technical',
    status: 'completed',
    currentPage: 288,
    totalPages: 288,
    rating: 4.7,
    coverColor: 'from-amber-600 to-rose-950',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2018,
    isbn: '978-1942788331',
    quotes: ['Lead time, deployment frequency, MTTR, and change failure rate predict engineering velocity.'],
    notes: 'Empirical research demonstrating that speed and stability reinforce each other.',
    updatedAt: '2026-06-11T12:00:00Z'
  },
  {
    id: 'book-tech-9',
    title: 'Building Microservices: Designing Fine-Grained Systems (2nd Ed)',
    author: 'Sam Newman',
    shelf: 'technical',
    status: 'completed',
    currentPage: 612,
    totalPages: 612,
    rating: 4.9,
    coverColor: 'from-emerald-800 to-zinc-950',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2021,
    isbn: '978-1492034025',
    quotes: ['Model services around business domains, not technical silos.'],
    notes: 'Modernized guide on sagas, decomposed monoliths, and asynchronous communication.',
    updatedAt: '2026-05-20T17:00:00Z'
  },
  {
    id: 'book-tech-10',
    title: 'Software Engineering at Google: Lessons Learned from Programming Over Time',
    author: 'Titus Winters, Tom Manshreck, Hyrum Wright',
    shelf: 'technical',
    status: 'completed',
    currentPage: 598,
    totalPages: 598,
    rating: 4.8,
    coverColor: 'from-blue-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2020,
    isbn: '978-1492082798',
    quotes: ['Programming is code. Software engineering is code over time, scale, and trade-offs.'],
    notes: "Hyrum's law, trunk-based development, large-scale refactoring, and code review culture.",
    updatedAt: '2026-04-18T14:00:00Z'
  },
  {
    id: 'book-tech-11',
    title: "Clean Architecture: A Craftsman's Guide to Software Structure",
    author: 'Robert C. Martin',
    shelf: 'technical',
    status: 'completed',
    currentPage: 432,
    totalPages: 432,
    rating: 4.7,
    coverColor: 'from-teal-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2017,
    isbn: '978-0134494166',
    quotes: ['The dependency rule: source code dependencies must only point inward toward higher-level policies.'],
    notes: 'Decoupling entities from frameworks, UI, and storage systems.',
    updatedAt: '2026-03-30T10:00:00Z'
  },
  {
    id: 'book-tech-12',
    title: 'Production-Ready Microservices: Building Standardized Systems',
    author: 'Susan J. Fowler',
    shelf: 'technical',
    status: 'completed',
    currentPage: 236,
    totalPages: 236,
    rating: 4.6,
    coverColor: 'from-amber-800 to-zinc-950',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2016,
    isbn: '978-1491965979',
    quotes: ['Standardize stability, reliability, scalability, fault tolerance, and observability.'],
    notes: 'Checklists and principles for taking microservices from prototype to rock-solid production.',
    updatedAt: '2026-03-12T11:00:00Z'
  },

  // ================= PHILOSOPHY & MIND SHELF (4 BOOKS) =================
  {
    id: 'book-phil-1',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 464,
    totalPages: 464,
    rating: 5,
    coverColor: 'from-rose-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2014,
    isbn: '978-0062316097',
    quotes: ['Fiction has enabled us not merely to imagine things, but to do so collectively.'],
    notes: 'Profound perspective on shared mythologies, currency, and human cooperation.',
    updatedAt: '2026-09-17T09:12:00Z'
  },
  {
    id: 'book-phil-2',
    title: 'Flow: The Psychology of Optimal Experience',
    author: 'Mihaly Csikszentmihalyi',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 336,
    totalPages: 336,
    rating: 5,
    coverColor: 'from-cyan-800 to-teal-950',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    publishedYear: 1990,
    isbn: '978-0061339202',
    quotes: [
      'The best moments usually occur when a person’s body or mind is stretched to its limits in a voluntary effort.'
    ],
    notes: 'Cultivating deep intrinsic absorption and mastery at the frontier of challenge and skill.',
    updatedAt: '2026-08-28T18:00:00Z'
  },
  {
    id: 'book-phil-3',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 499,
    totalPages: 499,
    rating: 4.8,
    coverColor: 'from-purple-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2011,
    isbn: '978-0374533557',
    quotes: [
      'System 1 operates automatically and quickly, while System 2 allocates attention to effortful mental operations.'
    ],
    notes: 'Cognitive biases, heuristics, loss aversion, and calibrated decision analysis.',
    updatedAt: '2026-07-20T16:00:00Z'
  },
  {
    id: 'book-phil-4',
    title: 'Antifragile: Things That Gain from Disorder',
    author: 'Nassim Nicholas Taleb',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 544,
    totalPages: 544,
    rating: 4.7,
    coverColor: 'from-amber-800 to-slate-950',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2012,
    isbn: '978-1400067824',
    quotes: ['Wind extinguishes a candle and energizes fire. Antifragility is beyond resilience or robustness.'],
    notes: 'Designing systems with convex optionality that thrive under volatility and stress.',
    updatedAt: '2026-06-15T11:00:00Z'
  },

  // ================= FICTION & SCI-FI SHELF (2 BOOKS) =================
  {
    id: 'book-fict-1',
    title: 'Dune',
    author: 'Frank Herbert',
    shelf: 'fiction',
    status: 'completed',
    currentPage: 688,
    totalPages: 688,
    rating: 5,
    coverColor: 'from-amber-800 to-orange-950',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    publishedYear: 1965,
    isbn: '978-0441172719',
    quotes: ['I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration.'],
    notes: 'Masterpiece on ecology, political intrigue, prescience, and institutional power.',
    updatedAt: '2026-09-12T16:00:00Z'
  },
  {
    id: 'book-fict-2',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    shelf: 'fiction',
    status: 'completed',
    currentPage: 496,
    totalPages: 496,
    rating: 5,
    coverColor: 'from-slate-800 to-zinc-950',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2021,
    isbn: '978-0593135204',
    quotes: ['Human beings have a remarkable ability to accept the abnormal and make it normal.'],
    notes: 'Triumphant hard sci-fi celebration of the scientific method, ingenuity, and friendship.',
    updatedAt: '2026-08-05T20:00:00Z'
  },

  // ================= PRODUCT & LEADERSHIP (1 BOOK) =================
  {
    id: 'book-lead-1',
    title: 'High Output Management',
    author: 'Andrew S. Grove',
    shelf: 'business',
    status: 'completed',
    currentPage: 272,
    totalPages: 272,
    rating: 5,
    coverColor: 'from-cyan-700 to-blue-900',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    publishedYear: 1983,
    isbn: '978-0679762881',
    quotes: ['The output of a manager is the output of the organizational units under his or her supervision.'],
    notes: 'Intel CEO’s masterclass on managerial leverage, one-on-ones, and production principles.',
    updatedAt: '2026-07-02T13:00:00Z'
  },

  // ================= WISHLIST & UP NEXT (1 BOOK) =================
  {
    id: 'book-wish-1',
    title: 'Algorithms to Live By: The Computer Science of Human Decisions',
    author: 'Brian Christian, Tom Griffiths',
    shelf: 'wishlist',
    status: 'wishlist',
    currentPage: 0,
    totalPages: 368,
    rating: 4.8,
    coverColor: 'from-purple-700 to-slate-900',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    publishedYear: 2016,
    isbn: '978-1627790369',
    quotes: ['Optimal stopping gives us a rigorous way to decide when to stop looking and commit.'],
    notes: 'Next up reading challenge: Applying computer science algorithms to everyday decision dilemmas.',
    updatedAt: '2026-09-19T08:00:00Z'
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
