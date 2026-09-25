/**
 * Book Records Service for the SinghBuildsTech Personal Library & Reading Tracker.
 * Manages personal books, shelves, reading progress, ratings, and rich metadata
 * (genre, pages, language, description, keyThemes, targetAudience, similarBooks, coverLocalPath).
 */

export const BOOK_SHELVES = [
  { id: 'all', label: 'All Shelves', tag: 'All' },
  { id: 'technical', label: 'Tech & Architecture', tag: 'Tech' },
  { id: 'philosophy', label: 'Philosophy & Mind', tag: 'Philosophy' },
  { id: 'fiction', label: 'Fiction & Sci-Fi', tag: 'Fiction' },
  { id: 'business', label: 'Product & Leadership', tag: 'Product' },
  { id: 'wishlist', label: 'Wishlist & Queued', tag: 'Wishlist' }
];

export const INITIAL_BOOKS = [
  // ================= BOOKS FROM METADATA OUTPUT WITH LOCAL COVERS =================
  {
    id: 'book-think-grow-rich',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 332,
    totalPages: 332,
    pages: 332,
    rating: 5,
    genre: 'Self-Help, Business, Psychology',
    publisher: 'The Ralston Society',
    publishedYear: 1937,
    language: 'English',
    isbn13: '978-1613392485',
    isbn: '978-1613392485',
    coverLocalPath: 'Think_and_Grow_Rich.jpg',
    coverUrl:
      'https://books.google.com/books/content?id=A5tdEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    coverColor: 'from-amber-700 to-yellow-950',
    format: 'Paperback',
    location: 'India, Delhi',
    description:
      "Napoleon Hill's classic work outlines his philosophy of success based on interviews with over 500 successful individuals, including Andrew Carnegie and Henry Ford. The book presents a systematic approach to achieving wealth through the power of thoughts, desires, and organized planning.",
    whyRead:
      "Timeless principles: The fundamental concepts about success, motivation, and achievement remain relevant across generations\nProven methodology: Based on Hill's extensive research of over 500 successful individuals\nPractical application: Offers actionable steps rather than just theoretical concepts\nMindset transformation: Helps reframe how you approach goals, obstacles, and success\nClassic foundation: Considered one of the foundational texts in the self-help and personal development genre",
    keyThemes: [
      'The power of positive thinking',
      'The subconscious mind and autosuggestion',
      'The importance of definite purpose and burning desire',
      'Specialized knowledge and organized planning',
      'The mastermind principle',
      'Transmuting creative energy into drive'
    ],
    targetAudience: [
      'Aspiring entrepreneurs and business leaders',
      'Individuals seeking personal development and financial independence',
      'Students of psychology, persuasion, and motivation',
      'Anyone curious about compounding personal achievement'
    ],
    notableQuotes: [
      'Whatever the mind can conceive and believe, it can achieve.',
      'A goal is a dream with a deadline.'
    ],
    quotes: ['Whatever the mind can conceive and believe, it can achieve.'],
    sales: 'Over 100 million copies sold worldwide',
    legacy:
      "One of the best-selling self-help books of all time, 'Think and Grow Rich' has influenced countless leaders and remains foundational to modern personal development literature.",
    similarBooks: [
      'The Law of Success by Napoleon Hill',
      'The Science of Getting Rich by Wallace D. Wattles',
      'Rich Dad Poor Dad by Robert Kiyosaki',
      'The Power of Your Subconscious Mind by Joseph Murphy',
      'Outwitting the Devil by Napoleon Hill'
    ],
    notes: 'Foundational framework on mental conditioning and clarity of purpose.',
    updatedAt: '2026-09-20T12:18:00Z'
  },
  {
    id: 'book-the-alchemist',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    shelf: 'fiction',
    status: 'completed',
    currentPage: 208,
    totalPages: 208,
    pages: 208,
    rating: 5,
    genre: 'Fiction, Philosophy, Allegory',
    publisher: 'Planeta / HarperOne',
    publishedYear: 1988,
    language: 'English',
    isbn13: '978-0062315007',
    isbn: '978-0062315007',
    coverLocalPath: 'The_Alchemist.jpg',
    coverUrl:
      'https://books.google.com/books/content?id=FEL8DlqjYEkC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
    coverColor: 'from-amber-600 to-indigo-950',
    format: 'E-Book (Kindle)',
    location: 'Germany, Munich',
    description:
      'A young Andalusian shepherd boy named Santiago travels to the Egyptian desert in search of treasure, encountering a series of mystical mentors who teach him about listening to his heart and pursuing his Personal Legend.',
    keyThemes: [
      'Personal Legend & Destiny',
      'The Language of the World & Omens',
      'Courage to embrace uncertainty',
      'Spiritual transformation through journey'
    ],
    targetAudience: [
      'Seekers of philosophical allegory',
      'Young professionals contemplating major life transitions',
      'Readers of poetic, transformative literature'
    ],
    notableQuotes: [
      'And, when you want something, all the universe conspires in helping you to achieve it.',
      'Tell your heart that the fear of suffering is worse than the suffering itself.'
    ],
    quotes: ['And, when you want something, all the universe conspires in helping you to achieve it.'],
    sales: 'Over 150 million copies sold in 80+ languages',
    legacy: 'A modern literary classic celebrating destiny, courage, and intuition.',
    similarBooks: [
      'The Prophet by Kahlil Gibran',
      'Siddhartha by Hermann Hesse',
      'The Little Prince by Antoine de Saint-Exupéry',
      "Man's Search for Meaning by Viktor Frankl"
    ],
    notes: 'A poetic reminder that the journey shapes the treasure.',
    updatedAt: '2026-09-20T12:18:00Z'
  },
  {
    id: 'book-the-first-90-days',
    title: 'The First 90 Days: Proven Strategies for Getting Up to Speed Faster and Smarter',
    author: 'Michael D. Watkins',
    shelf: 'business',
    status: 'completed',
    currentPage: 304,
    totalPages: 304,
    pages: 304,
    rating: 4.8,
    genre: 'Leadership, Executive Strategy, Onboarding',
    publisher: 'Harvard Business Review Press',
    publishedYear: 2013,
    language: 'English',
    isbn13: '978-1422188613',
    isbn: '978-1422188613',
    coverLocalPath: 'The_First_90_Days.jpg',
    coverColor: 'from-blue-700 to-slate-900',
    format: 'Audiobook (Audible)',
    location: 'iPhone, Audible App',
    description:
      'The definitive blueprint for leaders stepping into new roles. Outlines actionable diagnostic tools for STARS situations (Start-up, Turnaround, Accelerated growth, Realignment, Sustaining success) and accelerating the break-even point.',
    keyThemes: [
      'The STARS Framework',
      'Securing early wins',
      'Negotiating expectations with superiors',
      'Building coalitions and organizational alignment'
    ],
    targetAudience: [
      'New managers, directors, and executives',
      'Engineers transitioning to engineering management or staff roles',
      'Leaders joining new companies or business units'
    ],
    notableQuotes: [
      'The president of the United States gets 100 days; you get 90.',
      'The actions you take during your first few months in a new role will largely determine whether you succeed or fail.'
    ],
    quotes: ['The president of the United States gets 100 days; you get 90.'],
    similarBooks: [
      'High Output Management by Andy Grove',
      'The Making of a Manager by Julie Zhuo',
      'Good to Great by Jim Collins'
    ],
    notes: 'Indispensable playbook for transitions and organizational velocity.',
    updatedAt: '2026-09-20T12:00:00Z'
  },
  {
    id: 'book-how-to-win-friends',
    title: 'How to Win Friends and Influence People',
    author: 'Dale Carnegie',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 288,
    totalPages: 288,
    pages: 288,
    rating: 4.9,
    genre: 'Communication, Psychology, Interpersonal Dynamics',
    publisher: 'Simon & Schuster',
    publishedYear: 1936,
    language: 'English',
    isbn13: '978-0671027032',
    isbn: '978-0671027032',
    coverLocalPath: 'How_to_Win_Friends_Influence_People.jpg',
    coverColor: 'from-rose-700 to-amber-950',
    format: 'Hardcover + E-Book',
    location: 'S7, Office Shelf',
    description:
      'Timeless interpersonal wisdom on authentic human connection, empathetic listening, persuasion without resentment, and inspiring enthusiasm in others.',
    keyThemes: [
      'Genuine interest in other people',
      'Active listening and validation',
      'Avoiding criticism and condemnation',
      'Praising improvement and creating shared vision'
    ],
    targetAudience: [
      'Anyone collaborating in teams',
      'Engineering leads and public communicators',
      'Negotiators and relationship builders'
    ],
    notableQuotes: [
      'You can make more friends in two months by becoming interested in other people than you can in two years by trying to get other people interested in you.',
      'A person’s name is to that person the sweetest and most important sound in any language.'
    ],
    quotes: ['You can make more friends in two months by becoming interested in other people.'],
    similarBooks: [
      'Crucial Conversations by Joseph Grenny',
      'Never Split the Difference by Chris Voss',
      'Influence: The Psychology of Persuasion by Robert Cialdini'
    ],
    notes: 'The foundational masterclass on social grace and empathy.',
    updatedAt: '2026-09-20T12:00:00Z'
  },
  {
    id: 'book-blink',
    title: 'Blink: The Power of Thinking Without Thinking',
    author: 'Malcolm Gladwell',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 304,
    totalPages: 304,
    pages: 304,
    rating: 4.7,
    genre: 'Psychology, Cognitive Science, Decision Making',
    publisher: 'Little, Brown and Company',
    publishedYear: 2005,
    language: 'English',
    isbn13: '978-0316010665',
    isbn: '978-0316010665',
    coverLocalPath: 'Blink.jpg',
    coverColor: 'from-cyan-700 to-indigo-950',
    description:
      'An exploration of thin-slicing: the unconscious mental filtering that allows human minds to make rapid, remarkably accurate judgments within a fraction of a second, alongside the biases that can corrupt intuition.',
    keyThemes: [
      'Thin-slicing and subconscious expertise',
      'The dangers of analytical paralysis',
      'Priming and unconscious bias',
      'Structuring environments to protect intuition'
    ],
    targetAudience: [
      'Product designers and system architects',
      'Investigators, clinicians, and decision makers',
      'Curious minds interested in behavioral psychology'
    ],
    notableQuotes: ['There can be as much value in the blink of an eye as in months of rational analysis.'],
    quotes: ['There can be as much value in the blink of an eye as in months of rational analysis.'],
    similarBooks: [
      'Thinking, Fast and Slow by Daniel Kahneman',
      'The Tipping Point by Malcolm Gladwell',
      'Superforecasting by Philip Tetlock'
    ],
    notes: 'Fascinating breakdown of subconscious judgment vs deliberative analysis.',
    updatedAt: '2026-09-20T12:00:00Z'
  },
  {
    id: 'book-rising-strong',
    title: 'Rising Strong: How the Ability to Reset Transforms the Way We Live, Love, Parent, and Lead',
    author: 'Brené Brown',
    shelf: 'philosophy',
    status: 'completed',
    currentPage: 336,
    totalPages: 336,
    pages: 336,
    rating: 4.9,
    genre: 'Psychology, Vulnerability, Emotional Resilience',
    publisher: 'Spiegel & Grau',
    publishedYear: 2015,
    language: 'English',
    isbn13: '978-0812985849',
    isbn: '978-0812985849',
    coverLocalPath: 'Rising_Strong.jpg',
    coverColor: 'from-orange-700 to-rose-950',
    description:
      'Brené Brown maps the physics of vulnerability and recovery: The Reckoning (recognizing emotion), The Rumble (interrogating our first drafts and narratives), and The Revolution (forging transformative wholehearted practices).',
    keyThemes: [
      'Emotional reckoning and self-awareness',
      'SFDs (Shitty First Drafts) of personal narratives',
      'Accountability vs shame',
      'Courage to step into the arena again'
    ],
    targetAudience: [
      'Leaders navigating failure or setbacks',
      'Creators facing critical exposure',
      'Anyone cultivating psychological stamina'
    ],
    notableQuotes: [
      'Vulnerability is not winning or losing; it’s having the courage to show up and be seen when we have no control over the outcome.',
      'If we are brave enough often enough, we will fall.'
    ],
    quotes: ['If we are brave enough often enough, we will fall.'],
    similarBooks: ['Daring Greatly by Brené Brown', 'Atomic Habits by James Clear', 'Mindset by Carol Dweck'],
    notes: 'An essential guide to emotional grit and narrative ownership.',
    updatedAt: '2026-09-20T12:00:00Z'
  },
  {
    id: 'book-millionaire-mind',
    title: 'The Millionaire Mind',
    author: 'Thomas J. Stanley',
    shelf: 'business',
    status: 'completed',
    currentPage: 400,
    totalPages: 400,
    pages: 400,
    rating: 4.6,
    genre: 'Wealth, Behavioral Finance, Sociology',
    publisher: 'Andrews McMeel Publishing',
    publishedYear: 2000,
    language: 'English',
    isbn13: '978-0740718588',
    isbn: '978-0740718588',
    coverLocalPath: 'The_Millionaire_Mind.jpg',
    coverColor: 'from-emerald-800 to-stone-900',
    description:
      'A deep empirical study of affluent self-made individuals in America, examining the statistical realities of their work habits, spouse selection, financial discipline, risk tolerance, and lifestyle choices.',
    keyThemes: [
      'Integrity and self-discipline over raw IQ',
      'Frugality and defensive balance sheets',
      'Finding high-margin niche opportunities',
      'Family cohesion and aligned values'
    ],
    targetAudience: [
      'Wealth builders and long-term investors',
      'Founders and independent operators',
      'Students of behavioral economics'
    ],
    notableQuotes: [
      'Integrity is the number one success factor cited by decamillionaires.',
      'If you want to be rich, do not spend money trying to look rich.'
    ],
    quotes: ['Integrity is the number one success factor cited by decamillionaires.'],
    similarBooks: [
      'The Millionaire Next Door by Thomas J. Stanley',
      'The Psychology of Money by Morgan Housel',
      'Your Money or Your Life by Vicki Robin'
    ],
    notes: 'Rigorous empirical antidote to flashy consumerism.',
    updatedAt: '2026-09-20T12:00:00Z'
  },

  // ================= TECHNICAL & ARCHITECTURE CLASSICS =================
  {
    id: 'book-tech-1',
    title: 'The Pragmatic Programmer: 20th Anniversary Edition',
    author: 'David Thomas, Andrew Hunt',
    shelf: 'technical',
    status: 'completed',
    currentPage: 352,
    totalPages: 352,
    pages: 352,
    rating: 5,
    genre: 'Software Craftsmanship, Career, Architecture',
    publisher: 'Addison-Wesley Professional',
    publishedYear: 2019,
    language: 'English',
    isbn13: '978-0135957059',
    isbn: '978-0135957059',
    coverColor: 'from-emerald-700 to-teal-900',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400&auto=format&fit=crop&q=80',
    description:
      'One of the most influential software engineering books ever written. Cuts through the churn of modern software development with enduring advice on craftsmanship, pragmatic philosophy, software rot, and compound learning.',
    keyThemes: [
      'Care About Your Craft',
      'Don’t Live with Broken Windows',
      'Orthogonality & Decoupled Design',
      'Estimating and Knowledge Portfolio Investment'
    ],
    targetAudience: [
      'Software engineers across all disciplines',
      'Tech leads and engineering managers',
      'Developers pursuing mastery in craftsmanship'
    ],
    notableQuotes: [
      'Care About Your Craft.',
      'Don’t Live with Broken Windows.',
      'You can’t write perfect software. Did that hurt? It shouldn’t.'
    ],
    quotes: ['Care About Your Craft.', 'Don’t Live with Broken Windows.'],
    similarBooks: [
      'Clean Code by Robert C. Martin',
      'Refactoring by Martin Fowler',
      'Code Complete by Steve McConnell'
    ],
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
    pages: 615,
    rating: 5,
    genre: 'Distributed Systems, Database Internals, Reliability',
    publisher: "O'Reilly Media",
    publishedYear: 2017,
    language: 'English',
    isbn13: '978-1449373320',
    isbn: '978-1449373320',
    coverColor: 'from-amber-700 to-yellow-950',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    description:
      'The definitive compendium on the big ideas behind reliable, scalable, and maintainable systems. Delves into data models, storage engines, encoding, replication, partitioning, transactions, consensus, and stream processing.',
    keyThemes: [
      'Reliability, Scalability, and Maintainability',
      'B-Trees vs LSM-Trees',
      'Leader-based vs Leaderless Replication',
      'Consensus and Distributed Transactions',
      'Stream and Batch Processing'
    ],
    targetAudience: [
      'Backend and infrastructure engineers',
      'Systems architects designing high-scale platforms',
      'Staff & Principal engineers evaluating storage engines'
    ],
    notableQuotes: [
      'Reliability is continuing to work correctly even when things go wrong.',
      'A system cannot be successful if it is only designed for happy paths.'
    ],
    quotes: ['Reliability is continuing to work correctly even when things go wrong.'],
    similarBooks: [
      'Database Internals by Alex Petrov',
      'Site Reliability Engineering by Niall Richard Murphy',
      'Kafka: The Definitive Guide by Neha Narkhede'
    ],
    notes: 'The modern distributed systems bible. Masterclass in trade-offs.',
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
    pages: 464,
    rating: 4.8,
    genre: 'Software Engineering, Code Quality, Architecture',
    publisher: 'Prentice Hall',
    publishedYear: 2008,
    language: 'English',
    isbn13: '978-0132350884',
    isbn: '978-0132350884',
    coverColor: 'from-blue-700 to-cyan-950',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&auto=format&fit=crop&q=80',
    description:
      'Foundational principles of meaningful names, small functions, error handling, unit testing, and eliminating code smells to write maintainable software.',
    keyThemes: [
      'Meaningful Names and Small Functions',
      'Single Responsibility Principle',
      'First-class Unit Tests',
      'Eliminating Code Smells'
    ],
    targetAudience: ['Software developers aiming for readability', 'Agile development teams'],
    notableQuotes: [
      'Clean code always looks like it was written by someone who cares.',
      'The only valid measurement of code quality: WTFs/minute.'
    ],
    quotes: ['Clean code always looks like it was written by someone who cares.'],
    similarBooks: ['Refactoring by Martin Fowler', 'The Clean Coder by Robert C. Martin'],
    notes: 'Essential reading for any engineer seeking clean, self-documenting code.',
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
    pages: 320,
    rating: 5,
    genre: 'System Design, Cloud Architecture, Scalability',
    publisher: 'Independently Published',
    publishedYear: 2020,
    language: 'English',
    isbn13: '979-8664653403',
    isbn: '979-8664653403',
    coverColor: 'from-slate-700 to-zinc-950',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400&auto=format&fit=crop&q=80',
    description:
      'Clear, diagram-rich blueprints for designing large-scale distributed systems, including rate limiters, consistent hashing, chat systems, and web crawlers.',
    keyThemes: [
      'Scalability and high availability',
      'Rate limiting & token bucket algorithms',
      'Consistent hashing topologies',
      'Distributed message queuing'
    ],
    targetAudience: [
      'Engineers preparing for Senior/Staff design rounds',
      'Architects creating resilient microservices'
    ],
    notableQuotes: ['Scale from zero to millions of users with clarity and modular components.'],
    quotes: ['Scale from zero to millions of users with clarity and modular components.'],
    similarBooks: [
      'Designing Data-Intensive Applications by Martin Kleppmann',
      'System Design Interview Vol 2 by Alex Xu'
    ],
    notes: 'Clear visual patterns and quantitative back-of-the-envelope calculations.',
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
    pages: 448,
    rating: 5,
    genre: 'Software Design, Clean Architecture, Refactoring',
    publisher: 'Addison-Wesley Professional',
    publishedYear: 2018,
    language: 'English',
    isbn13: '978-0134757599',
    isbn: '978-0134757599',
    coverColor: 'from-teal-700 to-emerald-950',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400&auto=format&fit=crop&q=80',
    description:
      'The definitive catalog of refactorings that improve the internal structure of code without altering its external behavior, backed by JavaScript examples.',
    keyThemes: [
      'Code smells and remediation triggers',
      'Extract Function & Inline Variable',
      'Replacing conditionals with polymorphism',
      'Continuous refactoring rhythms'
    ],
    targetAudience: ['Engineers maintaining legacy codebases', 'Tech leads conducting code reviews'],
    notableQuotes: [
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.'
    ],
    quotes: [
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.'
    ],
    similarBooks: ['Clean Code by Robert C. Martin', 'Working Effectively with Legacy Code by Michael Feathers'],
    notes: 'The premier reference on iterative codebase health.',
    updatedAt: '2026-07-28T09:00:00Z'
  },

  // ================= WISHLIST & UP NEXT =================
  {
    id: 'book-wish-1',
    title: 'Algorithms to Live By: The Computer Science of Human Decisions',
    author: 'Brian Christian, Tom Griffiths',
    shelf: 'wishlist',
    status: 'wishlist',
    currentPage: 0,
    totalPages: 368,
    pages: 368,
    rating: 4.8,
    genre: 'Computer Science, Decision Theory, Cognitive Science',
    publisher: 'Henry Holt and Co.',
    publishedYear: 2016,
    language: 'English',
    isbn13: '978-1627790369',
    isbn: '978-1627790369',
    coverColor: 'from-purple-700 to-slate-900',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    description:
      'A fascinating exploration of how computer algorithms can be applied to everyday human decision problems, from optimal stopping and sorting to caching and game theory.',
    keyThemes: [
      'The 37% Optimal Stopping Rule',
      'Explore vs Exploit trade-offs',
      'Caching and human memory hierarchies',
      'Game theory and computational kindness'
    ],
    targetAudience: ['Software engineers and mathematicians', 'Decision makers seeking quantitative heuristics'],
    notableQuotes: ['Optimal stopping gives us a rigorous way to decide when to stop looking and commit.'],
    quotes: ['Optimal stopping gives us a rigorous way to decide when to stop looking and commit.'],
    similarBooks: ['Thinking, Fast and Slow by Daniel Kahneman', 'Superforecasting by Philip Tetlock'],
    notes: 'Next up reading challenge: Applying computer science algorithms to everyday decision dilemmas.',
    updatedAt: '2026-09-19T08:00:00Z'
  }
];

const STORAGE_KEY = 'singhbuildstech_admin_books_v3';

/**
 * Returns safe image cover source for book:
 * 1. API route for local cover (/api/admin/books/covers/[coverLocalPath])
 * 2. coverUrl (e.g. Google Books API or external URL)
 * 3. coverImage (Unsplash fallback)
 * 4. null
 */
export const getBookCoverSrc = (book) => {
  if (!book) return null;
  if (book.coverLocalPath) {
    return `/api/admin/books/covers/${encodeURIComponent(book.coverLocalPath)}`;
  }
  if (book.coverUrl) {
    return book.coverUrl;
  }
  if (book.coverImage) {
    return book.coverImage;
  }
  return null;
};

export const getStoredBooks = () => {
  if (typeof window === 'undefined') return INITIAL_BOOKS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    // Merge any missing fields from INITIAL_BOOKS to ensure legacy entries receive rich metadata
    const merged = parsed.map((item) => {
      const match = INITIAL_BOOKS.find((init) => init.id === item.id || init.title === item.title);
      if (match) {
        return {
          ...match,
          ...item,
          pages: item.pages || item.totalPages || match.pages,
          totalPages: item.totalPages || item.pages || match.totalPages,
          keyThemes: item.keyThemes || match.keyThemes || [],
          targetAudience: item.targetAudience || match.targetAudience || [],
          similarBooks: item.similarBooks || match.similarBooks || [],
          coverLocalPath: item.coverLocalPath || match.coverLocalPath || null,
          genre: item.genre || match.genre || 'General',
          language: item.language || match.language || 'English',
          description: item.description || match.description || ''
        };
      }
      return item;
    });

    // Also include any initial books not yet in stored list
    INITIAL_BOOKS.forEach((init) => {
      if (!merged.some((m) => m.id === init.id || m.title.toLowerCase() === init.title.toLowerCase())) {
        merged.push(init);
      }
    });

    return merged;
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

export const getBookById = (id) => {
  if (!id) return null;
  const books = getStoredBooks();
  return books.find((b) => b.id === id || b.id === String(id).trim()) || null;
};

export const createBook = (bookInput) => {
  const books = getStoredBooks();
  const pagesCount = Number(bookInput.pages || bookInput.totalPages) || 300;
  const currentPages = Number(bookInput.currentPage) || 0;

  const newBook = {
    id: `book-${Date.now()}`,
    title: bookInput.title.trim(),
    author: bookInput.author.trim(),
    shelf: bookInput.shelf || 'technical',
    status: bookInput.status || (currentPages >= pagesCount ? 'completed' : currentPages > 0 ? 'reading' : 'wishlist'),
    currentPage: currentPages,
    totalPages: pagesCount,
    pages: pagesCount,
    rating: Number(bookInput.rating) || 0,
    genre: bookInput.genre || 'Technology',
    language: bookInput.language || 'English',
    publisher: bookInput.publisher || '',
    publishedYear: Number(bookInput.publishedYear) || new Date().getFullYear(),
    isbn13: bookInput.isbn13 || bookInput.isbn || '',
    isbn: bookInput.isbn13 || bookInput.isbn || '',
    description: bookInput.description || '',
    keyThemes: Array.isArray(bookInput.keyThemes)
      ? bookInput.keyThemes
      : typeof bookInput.keyThemes === 'string'
        ? bookInput.keyThemes
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    targetAudience: Array.isArray(bookInput.targetAudience)
      ? bookInput.targetAudience
      : typeof bookInput.targetAudience === 'string'
        ? bookInput.targetAudience
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : [],
    similarBooks: Array.isArray(bookInput.similarBooks)
      ? bookInput.similarBooks
      : typeof bookInput.similarBooks === 'string'
        ? bookInput.similarBooks
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    coverLocalPath: bookInput.coverLocalPath || null,
    coverUrl: bookInput.coverUrl || null,
    coverColor: bookInput.coverColor || 'from-emerald-700 to-teal-900',
    coverImage:
      bookInput.coverImage ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    notableQuotes: bookInput.quote ? [bookInput.quote.trim()] : bookInput.notableQuotes || [],
    quotes: bookInput.quote ? [bookInput.quote.trim()] : bookInput.quotes || [],
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
  const pagesCount = Number(updates.pages || updates.totalPages || current.pages || current.totalPages);
  const currentPages = Number(updates.currentPage !== undefined ? updates.currentPage : current.currentPage);

  const updatedBook = {
    ...current,
    ...updates,
    pages: pagesCount,
    totalPages: pagesCount,
    currentPage: currentPages,
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

/**
 * Merge/sync books from tools/book-metadata/output/books.json into active library
 */
export const syncMetadataBooks = (metadataBooks) => {
  if (!Array.isArray(metadataBooks) || metadataBooks.length === 0) return 0;
  const currentBooks = getStoredBooks();
  let addedCount = 0;

  const updatedBooks = [...currentBooks];

  metadataBooks.forEach((meta) => {
    const existingIndex = updatedBooks.findIndex(
      (b) => b.title.trim().toLowerCase() === meta.title.trim().toLowerCase()
    );

    const pages = Number(meta.pages) || 300;

    const bookEntry = {
      title: meta.title,
      author: meta.author,
      genre: meta.genre || 'General',
      pages,
      totalPages: pages,
      language: meta.language || 'English',
      publisher: meta.publisher || '',
      publishedYear: Number(meta.publishedYear) || new Date().getFullYear(),
      isbn13: meta.isbn13 || '',
      isbn: meta.isbn13 || '',
      description: meta.description || '',
      keyThemes: Array.isArray(meta.keyThemes) ? meta.keyThemes : [],
      targetAudience: Array.isArray(meta.targetAudience) ? meta.targetAudience : [],
      notableQuotes: Array.isArray(meta.notableQuotes) ? meta.notableQuotes : [],
      quotes: Array.isArray(meta.notableQuotes) ? meta.notableQuotes : [],
      legacy: meta.legacy || '',
      sales: meta.sales || '',
      similarBooks: Array.isArray(meta.similarBooks) ? meta.similarBooks : [],
      coverLocalPath: meta.coverLocalPath || null,
      coverUrl: meta.coverUrl || null,
      coverColor: 'from-amber-700 to-indigo-950',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      updatedBooks[existingIndex] = {
        ...updatedBooks[existingIndex],
        ...bookEntry
      };
    } else {
      updatedBooks.unshift({
        id: `book-meta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        shelf: 'philosophy',
        status: 'completed',
        currentPage: pages,
        rating: 5,
        notes: 'Imported from book metadata pipeline.',
        ...bookEntry
      });
      addedCount++;
    }
  });

  saveStoredBooks(updatedBooks);
  return { total: updatedBooks.length, added: addedCount };
};
