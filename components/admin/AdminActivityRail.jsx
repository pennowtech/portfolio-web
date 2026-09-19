import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiGrid, FiEdit3, FiTrello, FiBookOpen, FiSettings, FiSidebar, FiExternalLink } from 'react-icons/fi';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Overview Dashboard',
    href: '/admin',
    icon: FiGrid,
    matcher: (path) => path === '/admin'
  },
  {
    id: 'articles',
    label: 'Articles Studio',
    href: '/admin/articles/new',
    icon: FiEdit3,
    matcher: (path) => path.startsWith('/admin/articles')
  },
  {
    id: 'issues',
    label: 'Issueboard Workspace',
    href: '/admin/issues',
    icon: FiTrello,
    matcher: (path) => path.startsWith('/admin/issues')
  },
  {
    id: 'books',
    label: 'Book Records & Library',
    href: '/admin/books',
    icon: FiBookOpen,
    matcher: (path) => path.startsWith('/admin/books')
  }
];

export const AdminActivityRail = ({ sidebarExpanded, onToggleSidebar }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <aside
      aria-label='Activity Rail'
      className='relative z-30 flex h-full w-[54px] shrink-0 flex-col items-center justify-between border-r border-slate-200/80 bg-slate-900 text-slate-400 py-3 select-none dark:border-slate-800'
    >
      {/* Top Brand Mark */}
      <div className='flex flex-col items-center gap-4'>
        <Link
          href='/admin'
          title='SinghBuildsTech Admin Command Center'
          className='group relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-105'
        >
          <span className='font-mono text-sm font-black tracking-tight'>SB</span>
          <span className='absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-900' />
        </Link>

        <div className='h-px w-6 bg-slate-800' />

        {/* Primary Macro Domain Icons */}
        <nav className='flex flex-col items-center gap-1.5'>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.matcher(currentPath);

            return (
              <div key={item.id} className='group relative flex items-center justify-center'>
                <Link
                  href={item.href}
                  className={`relative flex size-10 items-center justify-center rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                      : 'hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className='size-5' />
                  {/* Glowing active notch */}
                  {isActive && (
                    <span className='absolute -left-1.5 h-5 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' />
                  )}
                </Link>

                {/* Tooltip on hover */}
                <div className='pointer-events-none absolute left-full ml-2.5 hidden whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900/95 px-2.5 py-1 text-xs font-semibold text-slate-100 shadow-xl backdrop-blur-md group-hover:block z-50'>
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utilities */}
      <div className='flex flex-col items-center gap-2'>
        {/* Toggle Context Sidebar Drawer */}
        <button
          type='button'
          onClick={onToggleSidebar}
          title={sidebarExpanded ? 'Collapse Context Shelf (⌥B)' : 'Expand Context Shelf (⌥B)'}
          className={`flex size-9 items-center justify-center rounded-lg transition ${
            sidebarExpanded
              ? 'text-emerald-400 hover:bg-slate-800'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          aria-label='Toggle Context Drawer'
        >
          <FiSidebar className='size-4' />
        </button>

        {/* Portfolio Live Link */}
        <Link
          href='/'
          target='_blank'
          title='View Public Portfolio'
          className='flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300'
        >
          <FiExternalLink className='size-4' />
        </Link>
      </div>
    </aside>
  );
};

export default AdminActivityRail;
