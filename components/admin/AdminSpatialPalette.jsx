import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiEdit3, FiTrello, FiBookOpen, FiArrowRight, FiCornerDownLeft, FiX } from 'react-icons/fi';
import { getStoredBooks } from '@utils/books/bookService';

export const AdminSpatialPalette = ({ isOpen, onClose, onOpenQuickAdd }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Load books for search
  const books = getStoredBooks();

  // Static + Dynamic Search Items across Articles, Books, and Issues
  const actions = [
    // Direct domain navigation
    {
      id: 'nav-articles',
      type: 'Domain',
      title: 'Open Articles Studio',
      subtitle: 'Markdown editor & draft publishing',
      badge: '⌘1',
      icon: FiEdit3,
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      run: () => router.push('/admin/articles/new')
    },
    {
      id: 'nav-issues',
      type: 'Domain',
      title: 'Open Issueboard Workspace',
      subtitle: 'Active sprints, backlog triage & reports',
      badge: '⌘2',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => router.push('/admin/issues')
    },
    {
      id: 'nav-books',
      type: 'Domain',
      title: 'Open Book Records & Library',
      subtitle: 'Personal reading tracker & bibliography',
      badge: '⌘3',
      icon: FiBookOpen,
      color: 'text-amber-300 bg-amber-500/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.45)]',
      run: () => router.push('/admin/books')
    },

    // Fast actions
    {
      id: 'action-quick-article',
      type: 'Action',
      title: 'Write New Article',
      subtitle: 'Launch markdown authoring editor',
      badge: 'Create',
      icon: FiEdit3,
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      run: () => {
        onClose();
        router.push('/admin/articles/new');
      }
    },
    {
      id: 'action-quick-issue',
      type: 'Action',
      title: 'Quick Create Issue',
      subtitle: 'Create task or bug in PORT or LEM project',
      badge: 'Create',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => {
        onClose();
        onOpenQuickAdd?.('issue');
      }
    },
    {
      id: 'action-quick-book',
      type: 'Action',
      title: 'Add New Book Record',
      subtitle: 'Catalog book with cover, pages, and shelf',
      badge: 'Create',
      icon: FiBookOpen,
      color: 'text-amber-300 bg-amber-500/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.45)]',
      run: () => {
        onClose();
        onOpenQuickAdd?.('book');
      }
    },

    // Real Articles & Drafts
    {
      id: 'art-ai-future',
      type: 'Article',
      title: 'The Future of AI',
      subtitle: 'Draft article · 1.2k words · July 26, 2023',
      badge: 'Draft',
      icon: FiEdit3,
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      run: () => router.push('/admin/articles/new')
    },
    {
      id: 'art-react-state',
      type: 'Article',
      title: 'React State Management',
      subtitle: 'Draft article · 850 words · Frontend Architecture',
      badge: 'Draft',
      icon: FiEdit3,
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      run: () => router.push('/admin/articles/new')
    },
    {
      id: 'art-distributed-sys',
      type: 'Article',
      title: 'Designing for Partial Failure: Resilient Systems',
      subtitle: 'Tech Talks · Published article',
      badge: 'Published',
      icon: FiEdit3,
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      run: () => router.push('/blog/designing-for-partial-failure-what-resilient-systems-do-differently')
    },
    {
      id: 'art-adr',
      type: 'Article',
      title: 'Architecture Decision Records Engineers Actually Read',
      subtitle: 'System Design · Published article',
      badge: 'Published',
      icon: FiEdit3,
      color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      run: () => router.push('/blog/architecture-decision-records-that-engineers-will-actually-read')
    },

    // Real Issueboard Tickets
    {
      id: 'issue-port-1',
      type: 'Issue',
      title: 'PORT-1: Wire issue service to real Supabase data',
      subtitle: 'PORT Project · Task · In progress',
      badge: 'In Progress',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => router.push('/admin/issues?issue=PORT-1')
    },
    {
      id: 'issue-lem-1',
      type: 'Issue',
      title: 'LEM-1: Voice dictation cuts off mid-sentence',
      subtitle: 'LEM Project · Bug · In progress',
      badge: 'In Progress',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => router.push('/admin/issues?issue=LEM-1')
    },
    {
      id: 'issue-port-26',
      type: 'Issue',
      title: 'PORT-26: Interactive ticket triage and label clipping',
      subtitle: 'PORT Project · Bug · To do',
      badge: 'To Do',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => router.push('/admin/issues?issue=PORT-26')
    },
    {
      id: 'issue-port-39',
      type: 'Issue',
      title: 'PORT-39: Full Feature API Issue with Image and Checklist',
      subtitle: 'PORT Project · Story · To do',
      badge: 'To Do',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => router.push('/admin/issues?issue=PORT-39')
    },
    {
      id: 'issue-lem-2',
      type: 'Issue',
      title: 'LEM-2: Crash when playing lesson audio',
      subtitle: 'LEM Project · Bug · To do',
      badge: 'To Do',
      icon: FiTrello,
      color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.45)]',
      run: () => router.push('/admin/issues?issue=LEM-2')
    },

    // Book Items
    ...books.map((b) => ({
      id: `book-${b.id}`,
      type: 'Book',
      title: b.title,
      subtitle: `by ${b.author} • ${b.currentPage}/${b.totalPages} pages (${Math.round((b.currentPage / b.totalPages) * 100)}%)`,
      badge: b.shelf,
      icon: FiBookOpen,
      color: 'text-amber-300 bg-amber-500/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.45)]',
      run: () => router.push(`/admin/books?shelf=${b.shelf}&highlight=${b.id}`)
    }))
  ];

  // Filtered search list
  const filtered = actions.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role='dialog'
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 pt-16 backdrop-blur-md animate-in fade-in duration-150'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-900/95 shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur-2xl'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Header: 3 Tactile Glowing Switcher Cards (Artefact 3 & 5) */}
        <div className='border-b border-slate-800 bg-slate-950/70 p-3.5'>
          <div className='mb-2.5 flex items-center justify-between px-1'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>Direct Domain Jump</span>
            <button
              type='button'
              onClick={onClose}
              className='text-slate-400 hover:text-slate-200 transition'
              aria-label='Close command palette'
            >
              <FiX className='size-4' />
            </button>
          </div>

          <div className='grid grid-cols-3 gap-2.5'>
            {/* Card 1: Articles Studio (Emerald Glow) */}
            <button
              type='button'
              onClick={() => {
                router.push('/admin/articles/new');
                onClose();
              }}
              className='group relative flex flex-col items-start rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 to-slate-900/90 p-3 text-left shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-200 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]'
            >
              <div className='flex w-full items-center justify-between'>
                <span className='grid size-8 place-items-center rounded-lg bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.6)] group-hover:scale-105 transition-transform'>
                  <FiEdit3 className='size-4 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]' />
                </span>
                <kbd className='rounded-md border border-emerald-500/50 bg-emerald-950/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'>
                  ⌘1
                </kbd>
              </div>
              <div className='mt-2.5 text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition'>
                Articles Studio
              </div>
              <div className='text-[10px] text-slate-400'>Content & Drafts</div>
            </button>

            {/* Card 2: Issueboard Workspace (Cyan Glow) */}
            <button
              type='button'
              onClick={() => {
                router.push('/admin/issues');
                onClose();
              }}
              className='group relative flex flex-col items-start rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/50 to-slate-900/90 p-3 text-left shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-200 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]'
            >
              <div className='flex w-full items-center justify-between'>
                <span className='grid size-8 place-items-center rounded-lg bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-[0_0_14px_rgba(6,182,212,0.6)] group-hover:scale-105 transition-transform'>
                  <FiTrello className='size-4 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]' />
                </span>
                <kbd className='rounded-md border border-cyan-500/50 bg-cyan-950/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'>
                  ⌘2
                </kbd>
              </div>
              <div className='mt-2.5 text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition'>
                Issueboard
              </div>
              <div className='text-[10px] text-slate-400'>PORT & LEM Sprints</div>
            </button>

            {/* Card 3: Book Records & Library (Amber Glow) */}
            <button
              type='button'
              onClick={() => {
                router.push('/admin/books');
                onClose();
              }}
              className='group relative flex flex-col items-start rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/50 to-slate-900/90 p-3 text-left shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-200 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]'
            >
              <div className='flex w-full items-center justify-between'>
                <span className='grid size-8 place-items-center rounded-lg bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-[0_0_14px_rgba(245,158,11,0.6)] group-hover:scale-105 transition-transform'>
                  <FiBookOpen className='size-4 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]' />
                </span>
                <kbd className='rounded-md border border-amber-500/50 bg-amber-950/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'>
                  ⌘3
                </kbd>
              </div>
              <div className='mt-2.5 text-xs font-bold text-slate-100 group-hover:text-amber-300 transition'>
                Book Records
              </div>
              <div className='text-[10px] text-slate-400'>Library & Shelves</div>
            </button>
          </div>
        </div>

        {/* Omnisearch Input Field (Border removed as requested) */}
        <div className='relative flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/60 px-4 py-3.5 shadow-[0_0_20px_rgba(16,185,129,0.12)]'>
          <span className='grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]'>
            <FiSearch className='size-3.5 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' />
          </span>
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder='Search articles, books, tickets (LEM-1, PORT-38), or actions…'
            className='w-full bg-transparent text-sm font-medium text-slate-100 placeholder-slate-400 outline-none'
          />
          {query ? (
            <button
              type='button'
              onClick={() => setQuery('')}
              className='rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition'
            >
              Clear
            </button>
          ) : (
            <span className='hidden sm:inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'>
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div className='max-h-72 overflow-y-auto p-2.5 space-y-1.5'>
          {filtered.length === 0 ? (
            <div className='py-8 text-center text-xs text-slate-400'>
              No results matching &quot;{query}&quot; across tickets, articles, or book records.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                    isSelected
                      ? 'bg-slate-800/90 text-white ring-1 ring-emerald-500/50 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${item.color}`}>
                      <Icon className='size-4 drop-shadow-[0_0_5px_currentColor]' />
                    </span>
                    <div className='truncate min-w-0'>
                      <div className='truncate text-xs font-semibold text-slate-100'>{item.title}</div>
                      <div className='truncate text-[11px] text-slate-400'>{item.subtitle}</div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 shrink-0 pl-2'>
                    <span className='rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700/80'>
                      {item.badge}
                    </span>
                    {isSelected && (
                      <FiCornerDownLeft className='size-3.5 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]' />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Footer Guide */}
        <div className='flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[10px] text-slate-400 font-mono'>
          <div className='flex items-center gap-3'>
            <span>
              <kbd className='rounded bg-slate-800 px-1 text-slate-300'>↑↓</kbd> navigate
            </span>
            <span>
              <kbd className='rounded bg-slate-800 px-1 text-slate-300'>↵</kbd> select
            </span>
            <span>
              <kbd className='rounded bg-slate-800 px-1 text-slate-300'>esc</kbd> dismiss
            </span>
          </div>
          <span className='text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]'>
            SinghBuildsTech Omnisearch
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSpatialPalette;
