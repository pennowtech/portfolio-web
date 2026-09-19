import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiSearch,
  FiPlus,
  FiEdit3,
  FiTrello,
  FiBookOpen,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiLogOut
} from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';

const TABS = [
  {
    id: 'articles',
    label: 'Articles Studio',
    icon: FiEdit3,
    href: '/admin/articles/new',
    matcher: (path) => path.startsWith('/admin/articles')
  },
  {
    id: 'issues',
    label: 'Issueboard Cockpit',
    icon: FiTrello,
    href: '/admin/issues',
    matcher: (path) => path.startsWith('/admin/issues')
  },
  {
    id: 'books',
    label: 'Library & Books',
    icon: FiBookOpen,
    href: '/admin/books',
    matcher: (path) => path.startsWith('/admin/books')
  }
];

export const AdminHorizonHeader = ({ adminEmail, onOpenCommandPalette, onOpenQuickAdd }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const quickAddRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close Quick Add dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) {
        setQuickAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className='relative z-30 flex h-13 shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-900/90 px-4 text-slate-200 backdrop-blur-xl dark:border-slate-800'>
      {/* Left: Breadcrumbs / Title */}
      <div className='flex items-center gap-3'>
        <Link
          href='/admin'
          className='flex items-center gap-2 text-xs font-bold tracking-tight text-slate-200 hover:text-emerald-400 transition'
        >
          <span className='rounded-md bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/30'>
            ADMIN
          </span>
          <span className='hidden sm:inline text-slate-300 font-semibold'>SinghBuildsTech</span>
        </Link>
      </div>

      {/* Center Stage: Segmented Panoramic Glass Tabs (Artefact 4) */}
      <nav
        aria-label='Studio Navigation'
        className='hidden md:flex items-center rounded-xl border border-slate-700/60 bg-slate-950/60 p-1 shadow-inner backdrop-blur-md'
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matcher(currentPath);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`size-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>

              {/* Glowing underline pill indicator */}
              {isActive && (
                <span className='absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: Omnisearch Trigger, + Quick Add Dropdown, Theme Toggle, Profile */}
      <div className='flex items-center gap-2.5'>
        {/* Search Command Palette Trigger Button (Artefact 3 & 5) */}
        <button
          type='button'
          onClick={onOpenCommandPalette}
          className='group flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-200 hover:border-emerald-400 hover:bg-slate-900 hover:text-white hover:shadow-[0_0_24px_rgba(16,185,129,0.4)]'
          title='Open Spatial Command Palette (⌘K)'
        >
          <span className='grid size-5 place-items-center rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:scale-105 transition'>
            <FiSearch className='size-3 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' />
          </span>
          <span className='hidden lg:inline font-medium text-slate-300 group-hover:text-slate-100'>Search admin…</span>
          <kbd className='rounded-md border border-emerald-500/40 bg-emerald-950/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'>
            ⌘K
          </kbd>
        </button>

        {/* Global "+ Quick Add" Dropdown Menu */}
        <div className='relative' ref={quickAddRef}>
          <button
            type='button'
            onClick={() => setQuickAddOpen((prev) => !prev)}
            className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-95'
          >
            <FiPlus className='size-3.5 stroke-[2.5]' />
            <span className='hidden sm:inline'>Quick Add</span>
            <FiChevronDown className={`size-3 transition duration-150 ${quickAddOpen ? 'rotate-180' : ''}`} />
          </button>

          {quickAddOpen && (
            <div className='absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl backdrop-blur-xl'>
              <div className='px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400'>Create New</div>
              <button
                type='button'
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd?.('article');
                }}
                className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-200 transition hover:bg-emerald-500/15 hover:text-emerald-300'
              >
                <span className='grid size-6 place-items-center rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'>
                  <FiEdit3 className='size-3' />
                </span>
                <div>
                  <div className='leading-tight'>Write Article</div>
                  <div className='text-[10px] font-normal text-slate-400'>Markdown authoring</div>
                </div>
              </button>

              <button
                type='button'
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd?.('issue');
                }}
                className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-200 transition hover:bg-cyan-500/15 hover:text-cyan-300'
              >
                <span className='grid size-6 place-items-center rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'>
                  <FiTrello className='size-3' />
                </span>
                <div>
                  <div className='leading-tight'>Create Issue</div>
                  <div className='text-[10px] font-normal text-slate-400'>Task, bug, or story</div>
                </div>
              </button>

              <button
                type='button'
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd?.('book');
                }}
                className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-200 transition hover:bg-amber-500/15 hover:text-amber-300'
              >
                <span className='grid size-6 place-items-center rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/50'>
                  <FiBookOpen className='size-3' />
                </span>
                <div>
                  <div className='leading-tight'>Add Book Record</div>
                  <div className='text-[10px] font-normal text-slate-400'>Library catalog & reading log</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        {mounted && (
          <button
            type='button'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='flex size-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/60 text-slate-400 hover:text-amber-400 transition'
            title='Toggle theme'
            aria-label='Toggle theme'
          >
            {theme === 'dark' ? <FiSun className='size-3.5' /> : <FiMoon className='size-3.5' />}
          </button>
        )}

        {/* Admin Profile & Logout */}
        <div className='flex items-center gap-1.5 pl-1'>
          <div
            title={adminEmail || 'Admin'}
            className='grid size-7 place-items-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 text-[11px] font-bold text-white shadow-sm'
          >
            {(adminEmail || 'A').charAt(0).toUpperCase()}
          </div>
          <button
            type='button'
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className='flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition'
            title='Sign Out'
            aria-label='Sign Out'
          >
            <FiLogOut className='size-3.5' />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHorizonHeader;
