import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { FiCheckSquare, FiImage, FiMoreHorizontal, FiSearch, FiX } from 'react-icons/fi';
import IssueboardShell from './IssueboardShell';
import { boardStatuses, issueboardIssues, issueboardProject } from '@utils/issueboardFixtures';
import { issueHref } from '@utils/issueboardNavigation';

const validViews = ['overview', 'backlog', 'board', 'calendar', 'reports', 'projects', 'settings'];
const viewTitles = {
  overview: 'Overview',
  backlog: 'Backlog',
  board: 'Sprint board',
  calendar: 'Calendar',
  reports: 'Reports',
  projects: 'Projects',
  settings: 'Project settings'
};

const badgeClass = (status) => {
  if (status === 'Done') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
  if (status === 'In progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
  if (status === 'Review') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
};

const IssueMeta = ({ issue }) => (
  <div className='mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400'>
    <span>{issue.key}</span>
    <span>•</span>
    <span>{issue.priority}</span>
    <span>•</span>
    <span>{issue.estimate} points</span>
    {issue.checklist && (
      <span className='inline-flex items-center gap-1'>
        <FiCheckSquare /> {issue.checklist}
      </span>
    )}
    {issue.attachments > 0 && (
      <span className='inline-flex items-center gap-1'>
        <FiImage /> {issue.attachments}
      </span>
    )}
  </div>
);

const IssueLink = ({ issue, returnTo, children, className = '' }) => (
  <Link
    href={issueHref(issue.key, returnTo)}
    className={className}
    onClick={() => sessionStorage.setItem(`issueboard-scroll:${returnTo}`, String(window.scrollY))}
  >
    {children}
  </Link>
);

const Filters = () => (
  <div className='mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
    <label className='relative min-w-[15rem] flex-1'>
      <FiSearch className='absolute left-3 top-3 text-slate-400' />
      <span className='sr-only'>Search issues</span>
      <input
        className='w-full rounded-lg border border-slate-300 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700'
        placeholder='Search issue key, title, or description…'
      />
    </label>
    {['All types', 'All priorities', 'All assignees'].map((label) => (
      <button
        type='button'
        key={label}
        className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
      >
        {label} ▾
      </button>
    ))}
  </div>
);

const Overview = ({ returnTo }) => (
  <>
    <div className='mb-6'>
      <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Good afternoon, Sukhdeep</h2>
      <p className='mt-1 text-sm text-slate-500'>Here is what is moving across Portfolio Website this sprint.</p>
    </div>
    <div className='mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4'>
      {[
        ['Open issues', '24', '4 created this week'],
        ['Sprint progress', '62%', '18 of 29 points'],
        ['Due soon', '5', '2 need attention today'],
        ['Unassigned', '3', 'Across active work']
      ].map(([label, value, note]) => (
        <article
          key={label}
          className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'
        >
          <p className='text-xs font-semibold text-slate-500'>{label}</p>
          <strong className='my-1 block text-3xl tracking-tight'>{value}</strong>
          <span className='text-[11px] font-semibold text-emerald-700 dark:text-emerald-400'>{note}</span>
        </article>
      ))}
    </div>
    <div className='grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,.7fr)]'>
      <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <header className='border-b border-slate-200 px-5 py-4 dark:border-slate-800'>
          <h3 className='font-bold'>Needs your attention</h3>
          <p className='text-xs text-slate-500'>Priority, age, and due-date signals</p>
        </header>
        {issueboardIssues.slice(0, 4).map((issue) => (
          <IssueLink
            key={issue.key}
            issue={issue}
            returnTo={returnTo}
            className='grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
          >
            <div>
              <strong className='text-sm'>{issue.title}</strong>
              <IssueMeta issue={issue} />
            </div>
            <span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${badgeClass(issue.status)}`}>
              {issue.status}
            </span>
          </IssueLink>
        ))}
      </section>
      <aside className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <div className='flex justify-between'>
          <div>
            <h3 className='font-bold'>Active sprint</h3>
            <p className='text-xs text-slate-500'>
              {issueboardProject.sprint} · {issueboardProject.sprintDates}
            </p>
          </div>
          <span className='h-fit rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'>
            8 days left
          </span>
        </div>
        <div className='mt-7 flex justify-between text-xs'>
          <strong>18 / 29 points</strong>
          <span>62%</span>
        </div>
        <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
          <div className='h-full w-[62%] rounded-full bg-emerald-600' />
        </div>
        <div className='mt-7 space-y-4 border-t border-slate-200 pt-5 text-xs dark:border-slate-800'>
          <p>
            <strong>PORT-68</strong> moved to Done
            <br />
            <span className='text-slate-500'>19 minutes ago</span>
          </p>
          <p>
            <strong>PORT-74</strong> created from Slack
            <br />
            <span className='text-slate-500'>2 hours ago</span>
          </p>
        </div>
      </aside>
    </div>
  </>
);

const Backlog = ({ returnTo }) => (
  <>
    <div className='mb-6'>
      <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Backlog</h2>
      <p className='mt-1 text-sm text-slate-500'>Rank work and commit it to upcoming sprints.</p>
    </div>
    <Filters />
    {['Sprint 04', 'Sprint 05', 'Backlog'].map((group, groupIndex) => (
      <section
        key={group}
        className='mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
      >
        <header className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900'>
          <div>
            <strong>{group}</strong>
            <span className='ml-2 text-xs text-slate-500'>
              {groupIndex === 0 ? 'Active · 29 points' : groupIndex === 1 ? 'Planned · 13 points' : '12 issues'}
            </span>
          </div>
          <button
            type='button'
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-700'
          >
            {groupIndex === 0 ? 'Complete sprint' : groupIndex === 1 ? 'Start sprint' : '•••'}
          </button>
        </header>
        {issueboardIssues.slice(groupIndex * 2, groupIndex * 2 + 3).map((issue) => (
          <IssueLink
            key={issue.key}
            issue={issue}
            returnTo={returnTo}
            className='grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
          >
            <span className='cursor-grab text-slate-400'>⠿</span>
            <div>
              <strong className='text-sm'>{issue.title}</strong>
              <IssueMeta issue={issue} />
            </div>
            <span
              className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:block ${badgeClass(issue.status)}`}
            >
              {issue.status}
            </span>
          </IssueLink>
        ))}
        <button
          type='button'
          className='w-full px-5 py-3 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-emerald-700 dark:hover:bg-slate-800'
        >
          ＋ Create issue in {group}
        </button>
      </section>
    ))}
  </>
);

const Board = ({ returnTo }) => (
  <>
    <div className='mb-6'>
      <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Sprint 04 board</h2>
      <p className='mt-1 text-sm text-slate-500'>September foundation · 8 days remaining</p>
    </div>
    <Filters />
    <div className='grid grid-cols-[repeat(4,minmax(16rem,1fr))] gap-3 overflow-x-auto pb-4'>
      {boardStatuses.map((status) => {
        const issues = issueboardIssues.filter((issue) => issue.status === status);
        return (
          <section key={status} className='min-h-[34rem] rounded-2xl bg-slate-200/70 p-3 dark:bg-slate-900'>
            <header className='mb-3 flex items-center justify-between px-1'>
              <strong className='text-xs uppercase tracking-wider'>{status}</strong>
              <span className='grid size-6 place-items-center rounded-md bg-slate-300 text-[10px] dark:bg-slate-800'>
                {issues.length}
              </span>
            </header>
            {issues.map((issue) => (
              <IssueLink
                key={issue.key}
                issue={issue}
                returnTo={returnTo}
                className='mb-2 block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950'
              >
                <div className='flex justify-between text-[10px] text-slate-500'>
                  <span>
                    {issue.key} · {issue.type}
                  </span>
                  <span>{issue.priority}</span>
                </div>
                <h3 className='my-2 text-sm font-bold leading-snug'>{issue.title}</h3>
                <div className='flex flex-wrap gap-1'>
                  {issue.labels.map((label) => (
                    <span
                      key={label}
                      className='rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200'
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <IssueMeta issue={issue} />
              </IssueLink>
            ))}
            <button
              type='button'
              className='w-full rounded-lg border border-dashed border-slate-400 px-3 py-2 text-left text-xs text-slate-500'
            >
              ＋ Quick create
            </button>
          </section>
        );
      })}
    </div>
  </>
);

const PlaceholderView = ({ view }) => (
  <section className='rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
    <span className='rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800'>
      LAYOUT FOUNDATION
    </span>
    <h2 className='mt-4 text-2xl font-bold'>{viewTitles[view]}</h2>
    <p className='mt-2 max-w-xl text-sm leading-6 text-slate-500'>
      This route is wired into the authenticated issueboard shell. Its approved detailed composition is available in the
      clickable prototype and will be implemented in the next UI slice.
    </p>
  </section>
);

const CreateIssueModal = ({ onClose }) => (
  <div
    className='fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4'
    role='dialog'
    aria-modal='true'
    aria-labelledby='create-issue-title'
  >
    <button
      type='button'
      aria-label='Close create issue dialog'
      className='absolute inset-0 h-full w-full'
      onClick={onClose}
    />
    <div className='relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900'>
      <header className='flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800'>
        <div>
          <span className='text-[10px] text-slate-500'>Portfolio Website</span>
          <h2 id='create-issue-title' className='text-lg font-bold'>
            Create issue
          </h2>
        </div>
        <button
          type='button'
          onClick={onClose}
          className='grid size-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          <FiX />
        </button>
      </header>
      <div className='grid gap-4 p-5 sm:grid-cols-2'>
        {[
          ['Issue type', 'Task'],
          ['Priority', 'Medium'],
          ['Sprint', 'Backlog'],
          ['Estimate', 'Not estimated']
        ].map(([label, value]) => (
          <label key={label} className='grid gap-1.5 text-xs font-bold'>
            {label}
            <select className='rounded-lg border border-slate-300 bg-transparent p-2.5 font-normal dark:border-slate-700'>
              <option>{value}</option>
            </select>
          </label>
        ))}
        <label className='grid gap-1.5 text-xs font-bold sm:col-span-2'>
          Title
          <input
            className='rounded-lg border border-slate-300 bg-transparent p-2.5 font-normal dark:border-slate-700'
            placeholder='What needs to be done?'
          />
        </label>
        <label className='grid gap-1.5 text-xs font-bold sm:col-span-2'>
          Description
          <textarea
            className='min-h-28 rounded-lg border border-slate-300 bg-transparent p-2.5 font-normal dark:border-slate-700'
            placeholder='Add context and expected outcome…'
          />
        </label>
        <div className='rounded-xl border border-dashed border-emerald-400 bg-emerald-50 p-4 text-xs sm:col-span-2 dark:bg-emerald-950/40'>
          <strong>Images will be compressed in your browser</strong>
          <p className='mt-1 text-slate-500'>
            JPEG, PNG, or WebP · target 1 MB / 1920 px · direct upload to private Supabase Storage
          </p>
        </div>
      </div>
      <footer className='flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800'>
        <button
          type='button'
          onClick={onClose}
          className='rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700'
        >
          Cancel
        </button>
        <button type='button' className='button'>
          Create issue
        </button>
      </footer>
    </div>
  </div>
);

const IssueboardWorkspace = ({ adminEmail }) => {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const view = validViews.includes(router.query.view) ? router.query.view : 'overview';
  const returnTo = useMemo(() => router.asPath, [router.asPath]);

  useEffect(() => {
    const key = `issueboard-scroll:${router.asPath}`;
    const savedPosition = Number.parseInt(sessionStorage.getItem(key) || '', 10);
    if (!Number.isFinite(savedPosition)) return;
    sessionStorage.removeItem(key);
    requestAnimationFrame(() => window.scrollTo({ top: savedPosition, behavior: 'auto' }));
  }, [router.asPath]);
  return (
    <IssueboardShell
      adminEmail={adminEmail}
      currentView={view}
      title={viewTitles[view]}
      onCreate={() => setCreateOpen(true)}
    >
      {view === 'overview' && <Overview returnTo={returnTo} />}
      {view === 'backlog' && <Backlog returnTo={returnTo} />}
      {view === 'board' && <Board returnTo={returnTo} />}
      {!['overview', 'backlog', 'board'].includes(view) && <PlaceholderView view={view} />}
      {createOpen && <CreateIssueModal onClose={() => setCreateOpen(false)} />}
    </IssueboardShell>
  );
};

export default IssueboardWorkspace;
