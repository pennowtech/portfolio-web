import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiCalendar,
  FiChevronDown,
  FiColumns,
  FiFolder,
  FiHome,
  FiList,
  FiMenu,
  FiPlus,
  FiSettings,
  FiX
} from 'react-icons/fi';
import ThemeToggle from '@components/ThemeToggle';
import { workspaceHref } from '@utils/issueboardNavigation';

const navigation = [
  { view: 'overview', label: 'Overview', icon: FiHome },
  { view: 'backlog', label: 'Backlog', icon: FiList },
  { view: 'board', label: 'Sprint board', icon: FiColumns },
  { view: 'calendar', label: 'Calendar', icon: FiCalendar },
  { view: 'reports', label: 'Reports', icon: FiActivity },
  { view: 'projects', label: 'Projects', icon: FiFolder },
  { view: 'settings', label: 'Settings', icon: FiSettings }
];

const Sidebar = ({ adminEmail, currentView }) => (
  <aside className='flex h-full w-[17rem] shrink-0 flex-col overflow-y-auto bg-emerald-950 px-4 py-5 text-emerald-50'>
    <div className='flex items-center gap-3 px-2 pb-6'>
      <div className='grid size-10 place-items-center rounded-xl bg-emerald-300 font-Inter font-bold text-emerald-950'>
        IB
      </div>
      <div>
        <strong className='block font-Inter text-base'>Issueboard</strong>
        <span className='text-xs text-emerald-200/60'>SinghBuildsTech workspace</span>
      </div>
    </div>
    <button
      type='button'
      className='flex w-full items-center justify-between rounded-xl border border-emerald-800 bg-emerald-900/70 px-3 py-2.5 text-left'
    >
      <span>
        <small className='block text-[10px] text-emerald-200/60'>Current project</small>
        <strong className='text-sm'>Portfolio Website</strong>
      </span>
      <FiChevronDown aria-hidden='true' />
    </button>
    <p className='mb-2 mt-7 px-2 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-300/50'>
      Plan and deliver
    </p>
    <nav aria-label='Issueboard navigation' className='space-y-1'>
      {navigation.map(({ view, label, icon: Icon }) => (
        <Link
          key={view}
          href={workspaceHref(view)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
            currentView === view
              ? 'bg-emerald-800 text-white shadow-[inset_3px_0_0_#6ee7a4]'
              : 'text-emerald-100/70 hover:bg-emerald-900 hover:text-white'
          }`}
        >
          <Icon aria-hidden='true' />
          {label}
        </Link>
      ))}
    </nav>
    <div className='mt-auto border-t border-emerald-800 pt-4'>
      <p className='truncate text-xs text-emerald-100/60'>{adminEmail}</p>
      <div className='mt-3 flex items-center justify-between'>
        <ThemeToggle />
        <button
          type='button'
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className='rounded-lg px-2 py-1 text-xs font-semibold text-emerald-100/70 hover:bg-emerald-900 hover:text-white'
        >
          Sign out
        </button>
      </div>
    </div>
  </aside>
);

const IssueboardShell = ({ adminEmail, currentView = 'overview', title, onCreate, children }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [router.asPath]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  return (
    <div className='min-h-screen bg-slate-100 font-Inter text-slate-900 dark:bg-slate-950 dark:text-slate-100'>
      <div className='fixed inset-y-0 left-0 z-40 hidden lg:block'>
        <Sidebar adminEmail={adminEmail} currentView={currentView} />
      </div>
      {menuOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          <button
            type='button'
            aria-label='Close menu'
            className='absolute inset-0 h-full w-full bg-slate-950/60'
            onClick={() => setMenuOpen(false)}
          />
          <div className='relative h-full w-[min(86vw,17rem)]'>
            <Sidebar adminEmail={adminEmail} currentView={currentView} />
            <button
              type='button'
              aria-label='Close menu'
              onClick={() => setMenuOpen(false)}
              className='absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-white hover:bg-emerald-900'
            >
              <FiX />
            </button>
          </div>
        </div>
      )}
      <div className='min-w-0 lg:pl-[17rem]'>
        <header className='sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-7 dark:border-slate-800 dark:bg-slate-900/90'>
          <button
            type='button'
            aria-label='Open issueboard navigation'
            onClick={() => setMenuOpen(true)}
            className='grid size-10 place-items-center rounded-lg border border-slate-300 lg:hidden dark:border-slate-700'
          >
            <FiMenu />
          </button>
          <div className='min-w-0 flex-1'>
            <span className='hidden text-[11px] text-slate-500 sm:block'>Issueboard / Portfolio Website</span>
            <h1 className='truncate text-lg font-bold tracking-tight'>{title}</h1>
          </div>
          {onCreate && (
            <button type='button' onClick={onCreate} className='button inline-flex items-center gap-2 text-sm'>
              <FiPlus /> <span className='hidden sm:inline'>Create issue</span>
            </button>
          )}
        </header>
        <main className='mx-auto max-w-[100rem] p-4 md:p-7'>{children}</main>
      </div>
    </div>
  );
};

export default IssueboardShell;
