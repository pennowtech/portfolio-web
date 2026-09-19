import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@components/admin/AdminLayout';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getServerSession } from 'next-auth/next';
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiStar,
  FiCheck,
  FiBookmark,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLayers,
  FiCpu,
  FiCompass,
  FiFeather,
  FiBriefcase,
  FiClock
} from 'react-icons/fi';
import { getStoredBooks, updateBook, deleteBook, BOOK_SHELVES, INITIAL_BOOKS } from '@utils/books/bookService';
import QuickAddModal from '@components/admin/QuickAddModal';

const SHELF_DEFINITIONS = [
  {
    id: 'technical',
    title: 'Tech & Architecture',
    subtitle: 'Distributed systems, system design, reliability engineering & code craft',
    icon: FiCpu,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
    bgBadge:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
  },
  {
    id: 'philosophy',
    title: 'Philosophy & Mind',
    subtitle: 'Cognitive models, history, deep focus, and decision heuristics',
    icon: FiCompass,
    accentColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/30 dark:border-rose-500/40',
    bgBadge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
  },
  {
    id: 'fiction',
    title: 'Fiction & Sci-Fi',
    subtitle: 'World-building, prescience, hard science fiction & deep ecology',
    icon: FiFeather,
    accentColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30 dark:border-amber-500/40',
    bgBadge:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
  },
  {
    id: 'business',
    title: 'Product & Leadership',
    subtitle: 'Managerial leverage, organization scaling, and engineering strategy',
    icon: FiBriefcase,
    accentColor: 'text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-500/30 dark:border-cyan-500/40',
    bgBadge: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30'
  },
  {
    id: 'wishlist',
    title: 'Wishlist & Up Next',
    subtitle: 'Queued books for reading challenges and upcoming deep dives',
    icon: FiClock,
    accentColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30 dark:border-purple-500/40',
    bgBadge:
      'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30'
  }
];

const BooksPage = ({ adminEmail }) => {
  const router = useRouter();
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [activeShelf, setActiveShelf] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('shelves'); // 'shelves' default on opening!
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [updatePageInput, setUpdatePageInput] = useState('');

  // Sync with router query param if set (e.g. ?shelf=technical)
  useEffect(() => {
    if (router.query.shelf) {
      setActiveShelf(String(router.query.shelf));
    }
  }, [router.query.shelf]);

  const refreshBooks = () => {
    setBooks(getStoredBooks());
  };

  useEffect(() => {
    refreshBooks();
  }, []);

  // Filter books
  const filteredBooks = books.filter((b) => {
    if (activeShelf === 'reading') {
      if (b.status !== 'reading') return false;
    } else if (activeShelf !== 'all' && b.shelf !== activeShelf) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  const completedCount = books.filter((b) => b.status === 'completed').length;
  const yearlyGoal = 25;
  const goalPercentage = Math.round((completedCount / yearlyGoal) * 100);

  const handleUpdateProgress = (bookId) => {
    const page = Number(updatePageInput);
    if (isNaN(page) || page < 0) return;

    updateBook(bookId, { currentPage: page });
    setEditingBook(null);
    setUpdatePageInput('');
    refreshBooks();
  };

  const handleDelete = (bookId, title) => {
    if (confirm(`Remove "${title}" from library records?`)) {
      deleteBook(bookId);
      refreshBooks();
    }
  };

  return (
    <AdminLayout
      adminEmail={adminEmail}
      title='Book Records & Library | SinghBuildsTech Admin'
      description='Personal book catalog, reading progress, and mental model notes.'
    >
      <div className='mx-auto max-w-7xl p-6 sm:p-8 space-y-6'>
        {/* Top Header Card with Reading Challenge Gauge matching Artefact 2 stats */}
        <div className='relative overflow-hidden rounded-2xl border border-amber-500/30 bg-white p-6 shadow-lg dark:border-amber-500/40 dark:bg-[#14100c] dark:shadow-2xl'>
          <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono'>
                  <FiBookOpen className='size-3.5' /> Personal Library Records
                </span>
                <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'>
                  {books.length} Books Cataloged
                </span>
              </div>
              <h1 className='mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl'>
                Books, Shelves & Reading Log
              </h1>
              <p className='mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl'>
                Categorized personal repository of engineering architectures, cognitive models, philosophy, and
                leadership classics.
              </p>
            </div>

            {/* Reading Challenge Gauge Tile (18 / 25 - 72%) */}
            <div className='flex items-center gap-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-slate-950/80 dark:shadow-xl'>
              <div className='relative grid size-16 place-items-center rounded-full bg-white border-2 border-amber-500/50 shadow-sm dark:bg-slate-900 dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]'>
                <span className='font-mono text-base font-black text-amber-600 dark:text-amber-400'>
                  {goalPercentage}%
                </span>
              </div>
              <div>
                <div className='text-xs font-bold text-slate-800 dark:text-slate-200'>2026 Reading Challenge</div>
                <div className='font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                  <strong className='text-slate-900 dark:text-white text-sm'>{completedCount}</strong> of {yearlyGoal}{' '}
                  books completed
                </div>
                <div className='text-[10px] text-amber-600/90 dark:text-amber-400/80 font-mono mt-0.5'>
                  Next Up: <span className='text-slate-800 dark:text-white'>Algorithms to Live By</span>
                </div>
                <div className='mt-2 h-1.5 w-40 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>
              </div>

              <button
                type='button'
                onClick={() => setAddModalOpen(true)}
                className='ml-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition active:scale-95'
              >
                <FiPlus className='size-4' /> Add Book
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar: Shelf Filters, Search, View Mode Toggle */}
        <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3'>
          {/* Shelf Filter Pills matching Artefact 2 categories */}
          <div className='flex flex-wrap items-center gap-2 overflow-x-auto pb-1'>
            {BOOK_SHELVES.map((shelf) => {
              const isSelected = activeShelf === shelf.id;
              const count =
                shelf.id === 'all'
                  ? books.length
                  : shelf.id === 'reading'
                    ? books.filter((b) => b.status === 'reading').length
                    : books.filter((b) => b.shelf === shelf.id).length;

              return (
                <button
                  key={shelf.id}
                  type='button'
                  onClick={() => {
                    setActiveShelf(shelf.id);
                    router.push(`/admin/books?shelf=${shelf.id}`, undefined, { shallow: true });
                  }}
                  className={`h-7 inline-flex items-center gap-1.5 rounded-full px-3 text-xs leading-none font-semibold transition ${
                    isSelected
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/25'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-900/90 dark:text-slate-300 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:text-white'
                  }`}
                >
                  <span>{shelf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search + View Mode Toggle */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1 sm:w-60'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search title, author…'
                className='w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500'
              />
            </div>

            <div className='flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900'>
              <button
                type='button'
                onClick={() => setViewMode('shelves')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'shelves'
                    ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title='Categorized Shelves View'
              >
                <FiLayers className='size-3.5' />
                <span className='hidden sm:inline'>Shelves</span>
              </button>
              <button
                type='button'
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-amber-600 dark:bg-slate-800 dark:text-amber-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title='Cover Grid'
              >
                <FiGrid className='size-3.5' />
              </button>
              <button
                type='button'
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table'
                    ? 'bg-slate-100 text-amber-600 dark:bg-slate-800 dark:text-amber-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title='List Table'
              >
                <FiList className='size-3.5' />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: CATEGORIZED BOOK SHELVES (DEFAULT ON OPENING PAGE)     */}
        {/* ============================================================== */}
        {viewMode === 'shelves' && (
          <div className='space-y-8'>
            {SHELF_DEFINITIONS.filter((def) => activeShelf === 'all' || activeShelf === def.id).map((shelfDef) => {
              const shelfBooks = filteredBooks.filter((b) => b.shelf === shelfDef.id);
              if (shelfBooks.length === 0 && searchQuery) return null;

              const ShelfIcon = shelfDef.icon;

              return (
                <section
                  key={shelfDef.id}
                  className={`rounded-2xl border ${shelfDef.borderColor} bg-white dark:bg-slate-900/60 px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm dark:shadow-xl space-y-3`}
                >
                  {/* Category Shelf Header */}
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`p-1.5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 ${shelfDef.accentColor}`}
                      >
                        <ShelfIcon className='size-4' />
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h2 className='text-base font-bold text-slate-900 dark:text-white tracking-tight'>
                            {shelfDef.title}
                          </h2>
                          <span
                            className={`h-[18px] inline-flex items-center rounded-full px-2 text-[10px] leading-none font-mono font-bold border ${shelfDef.bgBadge}`}
                          >
                            {shelfBooks.length} {shelfBooks.length === 1 ? 'Book' : 'Books'}
                          </span>
                        </div>
                        <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>{shelfDef.subtitle}</p>
                      </div>
                    </div>

                    {activeShelf === 'all' && (
                      <button
                        type='button'
                        onClick={() => {
                          setActiveShelf(shelfDef.id);
                          router.push(`/admin/books?shelf=${shelfDef.id}`, undefined, { shallow: true });
                        }}
                        className='text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition self-start sm:self-auto'
                      >
                        Filter to this shelf →
                      </button>
                    )}
                  </div>

                  {/* Books Row / Grid under this Shelf */}
                  {shelfBooks.length === 0 ? (
                    <div className='py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-mono'>
                      No books matching your search in this shelf.
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1'>
                      {shelfBooks.map((book) => {
                        const progressPct = Math.round((book.currentPage / book.totalPages) * 100);

                        return (
                          <div
                            key={book.id}
                            className='group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-950/80 shadow-sm dark:shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md dark:hover:shadow-xl'
                          >
                            {/* Spine accent top strip */}
                            <div
                              className={`h-1 w-full bg-gradient-to-r ${book.coverColor || 'from-amber-600 to-yellow-800'}`}
                            />

                            <div className='p-4 space-y-3'>
                              <div className='flex items-center justify-between'>
                                <span className='h-[18px] inline-flex items-center rounded-full bg-slate-100 px-2 text-[10px] leading-none font-mono font-semibold text-amber-700 border border-slate-200 dark:bg-slate-900 dark:text-amber-300 dark:border-slate-800'>
                                  {shelfDef.title.split(' ')[0]}
                                </span>
                                <div className='flex items-center gap-1 text-amber-500 dark:text-amber-400 text-xs'>
                                  <FiStar className='size-3 fill-amber-400' />
                                  <span className='font-mono font-bold'>{book.rating}</span>
                                </div>
                              </div>

                              <div>
                                <h3 className='text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-300 transition'>
                                  {book.title}
                                </h3>
                                <p className='mt-1 text-[11px] text-slate-500 dark:text-slate-400'>by {book.author}</p>
                              </div>

                              {/* Progress bar */}
                              <div>
                                <div className='flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1'>
                                  <span className='capitalize text-slate-700 dark:text-slate-300'>{book.status}</span>
                                  <span className='text-amber-600 dark:text-amber-400 font-bold'>
                                    {book.currentPage}/{book.totalPages}p ({progressPct}%)
                                  </span>
                                </div>
                                <div className='h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
                                  <div
                                    className={`h-full rounded-full ${
                                      book.status === 'completed'
                                        ? 'bg-emerald-500 dark:bg-emerald-400'
                                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>

                              {book.notes && (
                                <p className='text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-2 border-l-2 border-amber-500/30 pl-2'>
                                  &quot;{book.notes}&quot;
                                </p>
                              )}
                            </div>

                            {/* Actions Footer */}
                            <div className='flex items-center justify-between border-t border-slate-200 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 px-3 py-2 text-xs'>
                              {editingBook === book.id ? (
                                <div className='flex items-center gap-1.5 w-full'>
                                  <input
                                    type='number'
                                    min='0'
                                    max={book.totalPages}
                                    value={updatePageInput}
                                    onChange={(e) => setUpdatePageInput(e.target.value)}
                                    placeholder='Page'
                                    className='w-16 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                                  />
                                  <button
                                    type='button'
                                    onClick={() => handleUpdateProgress(book.id)}
                                    className='rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white'
                                  >
                                    Save
                                  </button>
                                  <button
                                    type='button'
                                    onClick={() => setEditingBook(null)}
                                    className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                  >
                                    <FiX className='size-3' />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type='button'
                                    onClick={() => {
                                      setEditingBook(book.id);
                                      setUpdatePageInput(String(book.currentPage));
                                    }}
                                    className='inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400'
                                  >
                                    <FiEdit2 className='size-3' /> Progress
                                  </button>

                                  <button
                                    type='button'
                                    onClick={() => handleDelete(book.id, book.title)}
                                    className='text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition'
                                    title='Delete book'
                                  >
                                    <FiTrash2 className='size-3' />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* BOOK RECORDS FLAT GRID VIEW */}
        {viewMode === 'grid' && (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
            {filteredBooks.map((book) => {
              const progressPct = Math.round((book.currentPage / book.totalPages) * 100);
              const isReading = book.status === 'reading';

              return (
                <div
                  key={book.id}
                  className='group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm dark:shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md dark:hover:shadow-xl'
                >
                  {/* Decorative Book Spine Accent */}
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${book.coverColor || 'from-amber-600 to-yellow-800'}`}
                  />

                  <div className='p-5 space-y-3.5'>
                    {/* Shelf Tag & Rating */}
                    <div className='flex items-center justify-between'>
                      <span className='h-[18px] inline-flex items-center rounded-full bg-slate-100 px-2 text-[10px] leading-none font-mono font-semibold text-amber-700 border border-slate-200 dark:bg-slate-800/90 dark:text-amber-300 dark:border-slate-700'>
                        {book.shelf}
                      </span>
                      <div className='flex items-center gap-0.5 text-amber-500 dark:text-amber-400 text-xs'>
                        <FiStar className='size-3 fill-amber-400' />
                        <span className='font-mono font-bold'>{book.rating}</span>
                      </div>
                    </div>

                    {/* Title & Author */}
                    <div>
                      <h3 className='text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-300 transition'>
                        {book.title}
                      </h3>
                      <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>by {book.author}</p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className='flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1'>
                        <span className='capitalize font-medium text-slate-700 dark:text-slate-300'>{book.status}</span>
                        <span className='text-amber-600 dark:text-amber-400 font-bold'>
                          {book.currentPage} / {book.totalPages}p ({progressPct}%)
                        </span>
                      </div>
                      <div className='h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            book.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Notes Snippet */}
                    {book.notes && (
                      <p className='text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 border-l-2 border-amber-500/40 pl-2'>
                        &quot;{book.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className='flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-950/60'>
                    {editingBook === book.id ? (
                      <div className='flex items-center gap-1.5 w-full'>
                        <input
                          type='number'
                          min='0'
                          max={book.totalPages}
                          value={updatePageInput}
                          onChange={(e) => setUpdatePageInput(e.target.value)}
                          placeholder='Page'
                          className='w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                        />
                        <button
                          type='button'
                          onClick={() => handleUpdateProgress(book.id)}
                          className='rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white'
                        >
                          Save
                        </button>
                        <button
                          type='button'
                          onClick={() => setEditingBook(null)}
                          className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        >
                          <FiX className='size-3.5' />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type='button'
                          onClick={() => {
                            setEditingBook(book.id);
                            setUpdatePageInput(String(book.currentPage));
                          }}
                          className='inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400'
                        >
                          <FiEdit2 className='size-3' /> Update Page
                        </button>

                        <button
                          type='button'
                          onClick={() => handleDelete(book.id, book.title)}
                          className='text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition'
                          title='Delete book'
                        >
                          <FiTrash2 className='size-3.5' />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dense Table View */}
        {viewMode === 'table' && (
          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm dark:shadow-xl'>
            <table className='w-full text-left text-xs'>
              <thead className='border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400'>
                <tr>
                  <th className='p-3.5'>Title & Author</th>
                  <th className='p-3.5'>Shelf</th>
                  <th className='p-3.5'>Status</th>
                  <th className='p-3.5'>Pages / Progress</th>
                  <th className='p-3.5'>Rating</th>
                  <th className='p-3.5 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300'>
                {filteredBooks.map((book) => {
                  const pct = Math.round((book.currentPage / book.totalPages) * 100);
                  return (
                    <tr key={book.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/40 transition'>
                      <td className='p-3.5 font-medium'>
                        <div className='font-bold text-slate-900 dark:text-white'>{book.title}</div>
                        <div className='text-[11px] text-slate-500 dark:text-slate-400'>{book.author}</div>
                      </td>
                      <td className='p-3.5'>
                        <span className='h-[18px] inline-flex items-center rounded-full bg-slate-100 px-2 text-[10px] leading-none font-mono text-amber-700 border border-slate-200 dark:bg-slate-800 dark:text-amber-300 dark:border-slate-700'>
                          {book.shelf}
                        </span>
                      </td>
                      <td className='p-3.5 capitalize'>{book.status}</td>
                      <td className='p-3.5 font-mono text-slate-700 dark:text-slate-300'>
                        {book.currentPage} / {book.totalPages} ({pct}%)
                      </td>
                      <td className='p-3.5 text-amber-600 dark:text-amber-400 font-bold font-mono'>★ {book.rating}</td>
                      <td className='p-3.5 text-right'>
                        <button
                          type='button'
                          onClick={() => handleDelete(book.id, book.title)}
                          className='text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400'
                        >
                          <FiTrash2 className='size-3.5' />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredBooks.length === 0 && (
          <div className='rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center'>
            <FiBookOpen className='mx-auto size-8 text-slate-400 dark:text-slate-600' />
            <h3 className='mt-3 text-sm font-bold text-slate-800 dark:text-slate-300'>No books found</h3>
            <p className='mt-1 text-xs text-slate-500'>
              Try selecting a different shelf or adding a new book to your library records.
            </p>
            <button
              type='button'
              onClick={() => setAddModalOpen(true)}
              className='mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-500'
            >
              <FiPlus className='size-3.5' /> Add Book Record
            </button>
          </div>
        )}

        {/* Add Modal */}
        <QuickAddModal
          isOpen={addModalOpen}
          initialMode='book'
          onClose={() => setAddModalOpen(false)}
          onBookCreated={() => refreshBooks()}
        />
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (isIssueboardDevAuthBypassEnabled()) {
    return { props: { adminEmail: issueboardDevIdentity } };
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }
    return { props: { adminEmail: session?.user?.email || '' } };
  } catch (error) {
    console.error('Failed to get session on /admin/books:', error);
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
};

export default BooksPage;
