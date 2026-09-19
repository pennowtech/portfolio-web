import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiBookOpen,
  FiBookmark,
  FiCode,
  FiCpu,
  FiCheckCircle,
  FiPlus,
  FiEdit3,
  FiLayers,
  FiList,
  FiZap,
  FiTrendingUp,
  FiFolder,
  FiChevronRight
} from 'react-icons/fi';

export const AdminContextSidebar = ({ expanded, onOpenQuickAdd }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  // Determine active domain
  const isBooks = currentPath.startsWith('/admin/books');
  const isArticles = currentPath.startsWith('/admin/articles');
  const isIssues = currentPath.startsWith('/admin/issues');
  const isOverview = currentPath === '/admin';

  if (!expanded) return null;

  return (
    <aside
      aria-label='Contextual Sub-Navigation'
      className='relative z-20 flex h-full w-[230px] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700 select-none dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300'
    >
      {/* Dynamic Header Badge for Current Domain */}
      <div className='flex h-13 items-center justify-between border-b border-slate-200 px-3.5 dark:border-slate-800'>
        <div className='flex items-center gap-2 min-w-0'>
          {isBooks && <FiBookOpen className='size-4 shrink-0 text-amber-500 dark:text-amber-400' />}
          {isArticles && <FiEdit3 className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />}
          {isIssues && <FiLayers className='size-4 shrink-0 text-cyan-600 dark:text-cyan-400' />}
          {isOverview && <FiZap className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />}

          <span className='truncate text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200'>
            {isBooks ? 'Library & Books' : isArticles ? 'Articles Studio' : isIssues ? 'Issueboard' : 'Command Hub'}
          </span>
        </div>

        {/* Quick Add Icon Button */}
        <button
          type='button'
          onClick={() => onOpenQuickAdd?.(isBooks ? 'book' : isArticles ? 'article' : isIssues ? 'issue' : null)}
          className='flex size-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
          title='Quick Add'
        >
          <FiPlus className='size-3.5' />
        </button>
      </div>

      {/* Sub-tree Menu Navigation */}
      <div className='flex-1 overflow-y-auto px-2 py-3 space-y-4'>
        {/* BOOKS DOMAIN TREE */}
        {(isBooks || isOverview) && (
          <div className='space-y-1'>
            <div className='px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
              Reading Shelves
            </div>
            <Link
              href='/admin/books?shelf=all'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                currentPath === '/admin/books' && (!router.query.shelf || router.query.shelf === 'all')
                  ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiBookOpen className='size-3.5 text-amber-500 dark:text-amber-400' />
                <span>All Books</span>
              </div>
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-mono dark:bg-slate-800 dark:text-slate-300'>
                18
              </span>
            </Link>

            <Link
              href='/admin/books?shelf=technical'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                router.query.shelf === 'technical'
                  ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiCpu className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                <span>Tech</span>
              </div>
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-emerald-700 font-bold font-mono dark:bg-slate-800 dark:text-emerald-400'>
                12
              </span>
            </Link>

            <Link
              href='/admin/books?shelf=philosophy'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                router.query.shelf === 'philosophy'
                  ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiCode className='size-3.5 text-rose-500 dark:text-rose-400' />
                <span>Philosophy</span>
              </div>
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-rose-700 font-bold font-mono dark:bg-slate-800 dark:text-rose-400'>
                4
              </span>
            </Link>

            <Link
              href='/admin/books?shelf=fiction'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                router.query.shelf === 'fiction'
                  ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiBookmark className='size-3.5 text-amber-500 dark:text-amber-400' />
                <span>Fiction</span>
              </div>
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-amber-700 font-bold font-mono dark:bg-slate-800 dark:text-amber-400'>
                2
              </span>
            </Link>

            <Link
              href='/admin/books?shelf=business'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                router.query.shelf === 'business'
                  ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiCheckCircle className='size-3.5 text-cyan-600 dark:text-cyan-400' />
                <span>Product & Leadership</span>
              </div>
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-cyan-700 font-bold font-mono dark:bg-slate-800 dark:text-cyan-400'>
                1
              </span>
            </Link>

            <Link
              href='/admin/books?shelf=wishlist'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                router.query.shelf === 'wishlist'
                  ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiBookmark className='size-3.5 text-purple-600 dark:text-purple-400' />
                <span>Wishlist</span>
              </div>
              <span className='rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-purple-700 font-bold font-mono dark:bg-slate-800 dark:text-purple-400'>
                1
              </span>
            </Link>
          </div>
        )}

        {/* ARTICLES DOMAIN TREE */}
        {isOverview && (
          <div className='space-y-1'>
            <div className='px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
              Articles
            </div>
            <Link
              href='/admin/articles/new'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                currentPath === '/admin/articles/new'
                  ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiEdit3 className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                <span>Write Article</span>
              </div>
              <FiChevronRight className='size-3 text-slate-400 opacity-0 group-hover:opacity-100 transition' />
            </Link>

            <Link
              href='/blog'
              target='_blank'
              className='group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition'
            >
              <div className='flex items-center gap-2'>
                <FiList className='size-3.5' />
                <span>Published Articles</span>
              </div>
            </Link>
          </div>
        )}

        {/* ISSUEBOARD DOMAIN TREE */}
        {(isIssues || isOverview) && (
          <div className='space-y-1'>
            <div className='px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
              Issueboard Workspace
            </div>
            <Link
              href='/admin/issues'
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                currentPath === '/admin/issues' && !router.query.view
                  ? 'bg-cyan-50 font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400'
                  : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <FiLayers className='size-3.5 text-cyan-600 dark:text-cyan-400' />
                <span>Active Sprint Board</span>
              </div>
            </Link>

            <Link
              href='/admin/issues?view=backlog'
              className='group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition'
            >
              <div className='flex items-center gap-2'>
                <FiFolder className='size-3.5 text-purple-600 dark:text-purple-400' />
                <span>Backlog & Epics</span>
              </div>
            </Link>

            <Link
              href='/admin/issues?view=reports'
              className='group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition'
            >
              <div className='flex items-center gap-2'>
                <FiTrendingUp className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                <span>Velocity & Reports</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Footer System Status */}
      <div className='border-t border-slate-200 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400'>
        <div className='flex items-center justify-between'>
          <span className='inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300'>
            <span className='size-2 rounded-full bg-emerald-500 animate-pulse dark:bg-emerald-400' />
            Supabase Live
          </span>
          <span className='font-mono text-[10px] text-slate-400'>v0.5.4</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminContextSidebar;
