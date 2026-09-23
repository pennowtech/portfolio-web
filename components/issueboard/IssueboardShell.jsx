import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiColumns,
  FiCpu,
  FiFolder,
  FiHome,
  FiList,
  FiMenu,
  FiPlus,
  FiSettings,
  FiX
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import ThemeToggle from '@components/ThemeToggle';
import AIConfigModal from '@components/admin/AIConfigModal';
import { workspaceHref } from '@utils/issueboardNavigation';

const navigation = [
  { view: 'overview', label: 'Overview', icon: FiHome },
  { view: 'backlog', label: 'Backlog', icon: FiList },
  { view: 'board', label: 'Sprint board', icon: FiColumns },
  { view: 'calendar', label: 'Calendar', icon: FiCalendar },
  { view: 'reports', label: 'Reports', icon: FiActivity },
  { view: 'projects', label: 'Projects', icon: FiFolder },
  { view: 'integrations', label: 'Integrations & health', icon: FiCpu },
  { view: 'settings', label: 'Settings', icon: FiSettings }
];

const Sidebar = ({ adminEmail, currentView, currentProject, projects = [] }) => {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const navExtra = currentProject ? { project: currentProject.key } : {};

  return (
    <aside className='flex h-full w-[17rem] shrink-0 flex-col overflow-y-auto bg-emerald-950 px-4 py-5 text-emerald-50'>
      {/* Quick Admin Hub Switcher */}
      <div className='mb-4 pb-3 border-b border-emerald-800/80'>
        <Link
          href='/admin'
          className='flex items-center gap-1.5 text-xs font-semibold text-emerald-300/80 hover:text-emerald-100 transition'
        >
          <FiArrowLeft className='size-3.5' /> Admin Command Hub
        </Link>
      </div>

      <div className='relative'>
        <button
          type='button'
          onClick={() => setSwitcherOpen((open) => !open)}
          aria-expanded={switcherOpen}
          disabled={projects.length === 0}
          className='flex w-full items-center justify-between rounded-xl border border-emerald-800 bg-emerald-900/70 px-3 py-2.5 text-left disabled:cursor-default'
        >
          <span className='min-w-0'>
            <strong className='block truncate text-sm'>{currentProject?.name || 'No project'}</strong>
          </span>
          {projects.length > 0 && <FiChevronDown aria-hidden='true' className='shrink-0' />}
        </button>
        {switcherOpen && (
          <div className='absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-emerald-800 bg-emerald-900 shadow-xl'>
            {projects.map((project) => (
              <Link
                key={project.key}
                href={workspaceHref(currentView, { project: project.key })}
                onClick={() => setSwitcherOpen(false)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm ${
                  project.key === currentProject?.key
                    ? 'bg-emerald-800 font-semibold text-white'
                    : 'text-emerald-100/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <span className='min-w-0 truncate'>{project.name}</span>
                <span className='shrink-0 text-[10px] font-bold uppercase text-emerald-300/70'>{project.key}</span>
              </Link>
            ))}
            <Link
              href={workspaceHref('projects')}
              onClick={() => setSwitcherOpen(false)}
              className='block border-t border-emerald-800 px-3 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-800/60'
            >
              Manage projects
            </Link>
          </div>
        )}
      </div>
      <p className='mb-2 mt-7 px-2 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-300/50'>
        Plan and deliver
      </p>
      <nav aria-label='Issueboard navigation' className='space-y-1'>
        {navigation.map(({ view, label, icon: Icon }) => (
          <Link
            key={view}
            href={workspaceHref(view, navExtra)}
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
};

const IssueboardShell = ({
  adminEmail,
  currentView = 'overview',
  currentProject,
  projects,
  title,
  subtitle,
  headerActions,
  onCreate,
  children
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiConfigOpen, setAiConfigOpen] = useState(false);

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
    <div className='h-screen overflow-hidden flex bg-slate-100 font-Inter text-slate-900 dark:bg-slate-950 dark:text-slate-100'>
      <div className='fixed inset-y-0 left-0 z-40 hidden lg:block'>
        <Sidebar
          adminEmail={adminEmail}
          currentView={currentView}
          currentProject={currentProject}
          projects={projects}
        />
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
            <Sidebar
              adminEmail={adminEmail}
              currentView={currentView}
              currentProject={currentProject}
              projects={projects}
            />
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
      <div className='flex flex-col flex-1 h-screen min-w-0 lg:pl-[17rem] overflow-hidden'>
        <header className='shrink-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-7 dark:border-slate-800 dark:bg-slate-900/90'>
          <button
            type='button'
            aria-label='Open issueboard navigation'
            onClick={() => setMenuOpen(true)}
            className='grid size-10 place-items-center rounded-lg border border-slate-300 lg:hidden dark:border-slate-700'
          >
            <FiMenu />
          </button>
          <div className='min-w-0 flex-1'>
            <span className='hidden text-[11px] text-slate-500 sm:block'>
              Issueboard{currentProject ? ` / ${currentProject.name}` : ''}
            </span>
            <div className='flex items-center gap-2'>
              <h1 className='truncate text-lg font-bold tracking-tight'>{title}</h1>
              {subtitle && (
                <span className='hidden text-xs text-slate-500 md:inline-flex items-center rounded-md bg-slate-200/60 dark:bg-slate-800/80 px-2 py-0.5 font-medium'>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          {headerActions && <div className='flex items-center gap-2'>{headerActions}</div>}
          <button
            type='button'
            onClick={() => setAiConfigOpen(true)}
            className='grid size-10 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:border-purple-400 hover:text-purple-600 transition dark:border-slate-700 dark:text-slate-300 dark:hover:border-purple-500 dark:hover:text-purple-400'
            title='AI Configure'
            aria-label='AI Configure'
          >
            <LuSparkles className='size-4' />
          </button>
          {onCreate && (
            <button type='button' onClick={onCreate} className='button inline-flex items-center gap-2 text-sm'>
              <FiPlus /> <span className='hidden sm:inline'>Create issue</span>
            </button>
          )}
        </header>
        <main
          className={`mx-auto w-full max-w-[100rem] p-4 md:p-6 flex-1 min-h-0 ${
            currentView === 'board' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {children}
        </main>
      </div>

      <AIConfigModal isOpen={aiConfigOpen} onClose={() => setAiConfigOpen(false)} />
    </div>
  );
};

export default IssueboardShell;
