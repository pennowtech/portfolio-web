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

  // Static + Dynamic Search Items
  const actions = [
    // Direct domain navigation
    {
      id: 'nav-articles',
      type: 'Domain',
      title: 'Open Articles Studio',
      subtitle: 'Markdown editor & draft publishing',
      badge: '⌘1',
      icon: FiEdit3,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50',
      run: () => router.push('/admin/articles/new')
    },
    {
      id: 'nav-issues',
      type: 'Domain',
      title: 'Open Issueboard Workspace',
      subtitle: 'Active sprints, backlog triage & reports',
      badge: '⌘2',
      icon: FiTrello,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50',
      run: () => router.push('/admin/issues')
    },
    {
      id: 'nav-books',
      type: 'Domain',
      title: 'Open Book Records & Library',
      subtitle: 'Personal reading tracker & bibliography',
      badge: '⌘3',
      icon: FiBookOpen,
      color: 'text-amber-400 bg-amber-950/60 border-amber-700/50',
      run: () => router.push('/admin/books')
    },

    // Fast actions
    {
      id: 'action-quick-issue',
      type: 'Action',
      title: 'Quick Create Issue',
      subtitle: 'Create task or bug in PORT or LEM project',
      badge: 'Create',
      icon: FiTrello,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50',
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
      color: 'text-amber-400 bg-amber-950/60 border-amber-700/50',
      run: () => {
        onClose();
        onOpenQuickAdd?.('book');
      }
    },

    // Book Items
    ...books.map((b) => ({
      id: `book-${b.id}`,
      type: 'Book',
      title: b.title,
      subtitle: `by ${b.author} • ${b.currentPage}/${b.totalPages} pages (${Math.round((b.currentPage / b.totalPages) * 100)}%)`,
      badge: b.shelf,
      icon: FiBookOpen,
      color: 'text-amber-300 bg-amber-950/50 border-amber-800/40',
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
      item.type.toLowerCase().includes(q)
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
        className='relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-emerald-950/20 backdrop-blur-2xl'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Header: 3 Tactile Glowing Switcher Cards (Artefact 5) */}
        <div className='border-b border-slate-800 bg-slate-950/50 p-3'>
          <div className='mb-2 flex items-center justify-between px-1'>
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
            {/* Card 1: Articles Studio */}
            <button
              type='button'
              onClick={() => {
                router.push('/admin/articles/new');
                onClose();
              }}
              className='group relative flex flex-col items-start rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-3 text-left transition hover:border-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/10'
            >
              <div className='flex w-full items-center justify-between'>
                <span className='grid size-7 place-items-center rounded-lg bg-emerald-900/60 text-emerald-400 border border-emerald-700/40'>
                  <FiEdit3 className='size-3.5' />
                </span>
                <kbd className='rounded border border-emerald-800/60 bg-emerald-950/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300'>
                  ⌘1
                </kbd>
              </div>
              <div className='mt-2.5 text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition'>
                Articles Studio
              </div>
              <div className='text-[10px] text-slate-400'>Content & Drafts</div>
            </button>

            {/* Card 2: Issueboard Workspace */}
            <button
              type='button'
              onClick={() => {
                router.push('/admin/issues');
                onClose();
              }}
              className='group relative flex flex-col items-start rounded-xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/40 to-slate-900 p-3 text-left transition hover:border-cyan-500/80 hover:shadow-lg hover:shadow-cyan-500/10'
            >
              <div className='flex w-full items-center justify-between'>
                <span className='grid size-7 place-items-center rounded-lg bg-cyan-900/60 text-cyan-400 border border-cyan-700/40'>
                  <FiTrello className='size-3.5' />
                </span>
                <kbd className='rounded border border-cyan-800/60 bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300'>
                  ⌘2
                </kbd>
              </div>
              <div className='mt-2.5 text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition'>
                Issueboard
              </div>
              <div className='text-[10px] text-slate-400'>PORT & LEM Sprints</div>
            </button>

            {/* Card 3: Book Records & Library */}
            <button
              type='button'
              onClick={() => {
                router.push('/admin/books');
                onClose();
              }}
              className='group relative flex flex-col items-start rounded-xl border border-amber-800/40 bg-gradient-to-br from-amber-950/40 to-slate-900 p-3 text-left transition hover:border-amber-500/80 hover:shadow-lg hover:shadow-amber-500/10'
            >
              <div className='flex w-full items-center justify-between'>
                <span className='grid size-7 place-items-center rounded-lg bg-amber-900/60 text-amber-400 border border-amber-700/40'>
                  <FiBookOpen className='size-3.5' />
                </span>
                <kbd className='rounded border border-amber-800/60 bg-amber-950/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300'>
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

        {/* Omnisearch Input Field */}
        <div className='flex items-center gap-3 border-b border-slate-800 px-4 py-3'>
          <FiSearch className='size-4 text-emerald-400 shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder='Search tickets (LEM-1, PORT-38), articles, books, or actions…'
            className='w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none'
          />
          {query && (
            <button type='button' onClick={() => setQuery('')} className='text-slate-400 hover:text-slate-200 text-xs'>
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div className='max-h-72 overflow-y-auto p-2 space-y-1'>
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
                      ? 'bg-slate-800/90 text-white ring-1 ring-emerald-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-lg border ${item.color}`}>
                      <Icon className='size-3.5' />
                    </span>
                    <div className='truncate min-w-0'>
                      <div className='truncate text-xs font-semibold text-slate-100'>{item.title}</div>
                      <div className='truncate text-[11px] text-slate-400'>{item.subtitle}</div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 shrink-0 pl-2'>
                    <span className='rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700'>
                      {item.badge}
                    </span>
                    {isSelected && <FiCornerDownLeft className='size-3 text-emerald-400' />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Footer Guide */}
        <div className='flex items-center justify-between border-t border-slate-800/80 bg-slate-950/70 px-4 py-2 text-[10px] text-slate-400 font-mono'>
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
          <span className='text-emerald-400 font-semibold'>SinghBuildsTech Omnisearch</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSpatialPalette;
