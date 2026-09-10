import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import {
  FiBookmark,
  FiCheckSquare,
  FiChevronDown,
  FiImage,
  FiLayers,
  FiMoreHorizontal,
  FiSearch,
  FiZap,
  FiX
} from 'react-icons/fi';
import { FaBug } from 'react-icons/fa';
import IssueboardShell from './IssueboardShell';
import { IntegrationsHealthView, ProjectSettingsView } from './IssueboardAdminViews';
import ReportsView from './IssueboardReports';
import ProjectsView from './IssueboardProjects';
import MarkdownEditor from './MarkdownEditor';
import { boardStatuses, boardSubtasks, issueboardIssues, issueboardProject } from '@utils/issueboardFixtures';
import { issueHref } from '@utils/issueboardNavigation';

const validViews = ['overview', 'backlog', 'board', 'calendar', 'reports', 'projects', 'integrations', 'settings'];
const viewTitles = {
  overview: 'Overview',
  backlog: 'Backlog',
  board: 'Sprint board',
  calendar: 'Calendar',
  reports: 'Reports',
  projects: 'Projects',
  integrations: 'Integrations and health',
  settings: 'Project settings'
};

const badgeClass = (status) => {
  if (status === 'Done') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
  if (status === 'In progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
  if (status === 'Review') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
};

const priorityClass = (priority) => {
  if (priority === 'Highest') return 'text-rose-700 dark:text-rose-300';
  if (priority === 'High') return 'text-orange-700 dark:text-orange-300';
  if (priority === 'Low') return 'text-sky-700 dark:text-sky-300';
  return 'text-amber-700 dark:text-amber-300';
};

const labelPalette = [
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
];

const knownLabelColors = {
  bug: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  enhancement: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  security: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  documentation: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
};

const labelClass = (label) => {
  const normalized = label.trim().toLowerCase();
  if (knownLabelColors[normalized]) return knownLabelColors[normalized];
  const hash = [...normalized].reduce((total, character) => total + character.charCodeAt(0), 0);
  return labelPalette[hash % labelPalette.length];
};

const LabelPill = ({ label }) => (
  <span
    className={`inline-flex h-4 items-center rounded-full px-2 text-[10px] font-bold leading-none ${labelClass(label)}`}
  >
    {label}
  </span>
);

const CreatorAvatar = ({ creator }) => (
  <span
    className='inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-center text-[9px] font-extrabold leading-none text-white ring-2 ring-white dark:bg-emerald-700 dark:ring-slate-900'
    title={`Created by ${creator?.name || 'Unknown'}`}
    aria-label={`Created by ${creator?.name || 'Unknown'}`}
  >
    {creator?.initials || '?'}
  </span>
);

const typePresentation = {
  Bug: { Icon: FaBug, className: 'text-rose-600 dark:text-rose-300' },
  Story: { Icon: FiBookmark, className: 'text-emerald-600 dark:text-emerald-300' },
  Task: { Icon: FiCheckSquare, className: 'text-blue-600 dark:text-blue-300' },
  Epic: { Icon: FiZap, className: 'text-violet-600 dark:text-violet-300' },
  Subtask: { Icon: FiLayers, className: 'text-cyan-600 dark:text-cyan-300' }
};

const TypeIcon = ({ type }) => {
  const presentation = typePresentation[type] || typePresentation.Task;
  const { Icon } = presentation;
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center ${presentation.className}`}
      title={type}
      aria-label={type}
    >
      <Icon className='size-3.5' aria-hidden='true' />
    </span>
  );
};

const IssueMeta = ({ issue, showPriority = true }) => (
  <div className='mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400'>
    <span>{issue.key}</span>
    {showPriority && (
      <>
        <span>•</span>
        <span className={`font-bold ${priorityClass(issue.priority)}`}>{issue.priority}</span>
      </>
    )}
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
    <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Good afternoon, Sukhdeep</h2>
        <p className='mt-1 text-sm text-slate-500'>Here is what is moving across Portfolio Website this sprint.</p>
      </div>
      <Link
        href='/admin/issues?view=projects'
        className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
      >
        Manage projects
      </Link>
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
            className='grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
          >
            <CreatorAvatar creator={issue.creator} />
            <div>
              <div className='flex items-center gap-2'>
                <TypeIcon type={issue.type} />
                <strong className='text-sm'>{issue.title}</strong>
              </div>
              <IssueMeta issue={issue} />
            </div>
            <span
              className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2.5 text-[10px] font-bold ${badgeClass(issue.status)}`}
            >
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
    <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Backlog</h2>
        <p className='mt-1 text-sm text-slate-500'>Rank work and commit it to upcoming sprints.</p>
      </div>
      <button
        type='button'
        className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
      >
        + Create sprint
      </button>
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
            className='grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
          >
            <span className='cursor-grab text-slate-400'>⠿</span>
            <CreatorAvatar creator={issue.creator} />
            <div>
              <div className='flex items-center gap-2'>
                <TypeIcon type={issue.type} />
                <strong className='text-sm'>{issue.title}</strong>
              </div>
              <IssueMeta issue={issue} showPriority={false} />
            </div>
            <div className='hidden max-w-48 flex-wrap justify-end gap-1 sm:flex'>
              {issue.labels.map((label) => (
                <LabelPill key={label} label={label} />
              ))}
            </div>
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

const workStateClass = (workState) => {
  if (workState === 'Blocked') return 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40';
  if (workState === 'Rejected')
    return 'border-slate-300 bg-slate-100 opacity-75 dark:border-slate-700 dark:bg-slate-800';
  return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950';
};

const ParentIssueCard = ({ issue, returnTo, onStateChange }) => {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const workState = issue.workState || 'Normal';
  const stateDotClass = {
    Normal: 'bg-emerald-500',
    Blocked: 'bg-rose-500',
    Rejected: 'bg-slate-500'
  };
  return (
    <article className={`rounded-xl border p-3 shadow-sm ${workStateClass(issue.workState)}`}>
      <div className='flex items-start justify-between gap-2'>
        <IssueLink issue={issue} returnTo={returnTo} className='min-w-0 flex-1'>
          <span className='flex items-center gap-2 text-[10px] text-slate-500'>
            <TypeIcon type={issue.type} /> {issue.key}
          </span>
          <h3 className='mt-2 text-sm font-normal leading-snug'>{issue.title}</h3>
        </IssueLink>
        <span className={`shrink-0 text-[10px] font-bold ${priorityClass(issue.priority)}`}>{issue.priority}</span>
      </div>
      <div
        className='relative mt-2 inline-block'
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setStateMenuOpen(false);
        }}
      >
        <button
          type='button'
          onClick={() => setStateMenuOpen((open) => !open)}
          aria-label={`State for ${issue.key}`}
          aria-haspopup='listbox'
          aria-expanded={stateMenuOpen}
          className='inline-flex h-6 items-center gap-1.5 rounded-md bg-transparent px-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:text-slate-300 dark:hover:bg-slate-800'
        >
          <span className={`size-1.5 rounded-full ${stateDotClass[workState]}`} aria-hidden='true' />
          <span>{workState}</span>
          <FiChevronDown className={`ml-1 size-3 transition ${stateMenuOpen ? 'rotate-180' : ''}`} aria-hidden='true' />
        </button>
        {stateMenuOpen && (
          <div
            role='listbox'
            aria-label={`Choose state for ${issue.key}`}
            className='absolute left-0 top-7 z-30 w-28 rounded-lg bg-white p-0.5 shadow-lg dark:bg-slate-900'
          >
            {['Normal', 'Blocked', 'Rejected'].map((state) => (
              <button
                key={state}
                type='button'
                role='option'
                aria-selected={workState === state}
                onClick={() => {
                  onStateChange(state);
                  setStateMenuOpen(false);
                }}
                className={`flex h-6 w-full items-center gap-1.5 rounded-md px-2 text-left text-[10px] font-semibold leading-none transition hover:bg-slate-100 dark:hover:bg-slate-800 ${workState === state ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
              >
                <span className={`size-1.5 rounded-full ${stateDotClass[state]}`} aria-hidden='true' />
                {state}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className='mt-3 flex items-center justify-between text-[10px] text-slate-500'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            className='inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800'
            onClick={() => setChecklistOpen((current) => !current)}
            aria-expanded={checklistOpen}
          >
            <FiCheckSquare aria-hidden='true' /> {issue.checklist}
            <FiChevronDown className={`transition ${checklistOpen ? 'rotate-180' : ''}`} aria-hidden='true' />
          </button>
          <span>{issue.estimate} points</span>
        </div>
        <CreatorAvatar creator={issue.creator} />
      </div>
      {checklistOpen && (
        <ul className='mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800'>
          {issue.checklistItems?.map((item) => (
            <li key={item.text} className='flex items-center gap-2 leading-5'>
              <FiCheckSquare className={`shrink-0 ${item.done ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className={item.done ? 'text-slate-400 line-through' : ''}>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

const Board = ({ returnTo }) => {
  const [parentIssues, setParentIssues] = useState(() =>
    issueboardIssues.map((issue) => ({ ...issue, workState: 'Normal' }))
  );
  const [subtasks, setSubtasks] = useState(boardSubtasks);
  const [quickCreateParent, setQuickCreateParent] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');

  const moveSubtask = (key, status) => {
    setSubtasks((current) => current.map((subtask) => (subtask.key === key ? { ...subtask, status } : subtask)));
  };

  const setParentWorkState = (key, workState) => {
    setParentIssues((current) => current.map((issue) => (issue.key === key ? { ...issue, workState } : issue)));
  };

  const createSubtask = (event) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setSubtasks((current) => [
      ...current,
      {
        key: `PORT-${86 + current.length}`,
        parentKey: quickCreateParent,
        type: 'Subtask',
        title,
        status: 'To do',
        creator: { name: 'Local development', initials: 'LD' }
      }
    ]);
    setQuickTitle('');
    setQuickCreateParent(null);
  };

  return (
    <>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Sprint 04 board</h2>
          <p className='mt-1 text-sm text-slate-500'>September foundation · 8 days remaining</p>
        </div>
        <div className='flex gap-2'>
          <button
            type='button'
            className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700'
          >
            Sprint details
          </button>
          <button
            type='button'
            className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700'
          >
            Complete sprint
          </button>
        </div>
      </div>
      <Filters />
      <div className='overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800'>
        <div className='min-w-[90rem]'>
          <div className='grid grid-cols-[repeat(6,minmax(15rem,1fr))] bg-slate-100 dark:bg-slate-900'>
            <header className='flex items-center justify-between border-r border-slate-200 p-3 dark:border-slate-800'>
              <strong className='issueboard-swimlane-title text-xs  tracking-wider'>Parent issue</strong>
              <span className='inline-flex size-6 items-center justify-center rounded-md bg-slate-300 text-[10px] leading-none dark:bg-slate-800'>
                {parentIssues.length}
              </span>
            </header>
            {boardStatuses.map((status) => (
              <header
                key={status}
                className='flex items-center justify-between border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-800'
              >
                <strong className='issueboard-swimlane-title text-xs  tracking-wider'>{status}</strong>
                <span className='inline-flex size-6 items-center justify-center rounded-md bg-slate-300 text-[10px] leading-none dark:bg-slate-800'>
                  {subtasks.filter((subtask) => subtask.status === status).length}
                </span>
              </header>
            ))}
          </div>
          {parentIssues.map((issue) => (
            <section
              key={issue.key}
              className='grid grid-cols-[repeat(6,minmax(15rem,1fr))] border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
            >
              <div className='border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70'>
                <ParentIssueCard
                  issue={issue}
                  returnTo={returnTo}
                  onStateChange={(workState) => setParentWorkState(issue.key, workState)}
                />
              </div>
              {boardStatuses.map((status) => {
                const relatedSubtasks = subtasks.filter(
                  (subtask) => subtask.parentKey === issue.key && subtask.status === status
                );
                return (
                  <div
                    key={status}
                    className='min-h-44 border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-800'
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => moveSubtask(event.dataTransfer.getData('text/plain'), status)}
                  >
                    {relatedSubtasks.map((subtask) => (
                      <article
                        key={subtask.key}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('text/plain', subtask.key)}
                        className='mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950'
                      >
                        <div className='text-[10px] text-slate-500'>
                          <span className='flex items-center gap-2'>
                            <TypeIcon type={subtask.type} /> {subtask.key}
                          </span>
                        </div>
                        <h3 className='my-2 text-sm font-normal leading-snug'>{subtask.title}</h3>
                        <div className='mt-3 flex items-center justify-end text-[10px] text-slate-500'>
                          <CreatorAvatar creator={subtask.creator} />
                        </div>
                      </article>
                    ))}
                    {status === 'To do' &&
                      (quickCreateParent === issue.key ? (
                        <form
                          className='rounded-xl border border-dashed border-slate-400 bg-white p-2 dark:bg-slate-900'
                          onSubmit={createSubtask}
                        >
                          <input
                            autoFocus
                            value={quickTitle}
                            onChange={(event) => setQuickTitle(event.target.value)}
                            className='w-full bg-transparent px-1 py-1 text-xs outline-none'
                            placeholder='Subtask title'
                          />
                          <div className='mt-2 flex justify-end gap-1'>
                            <button
                              type='button'
                              className='h-6 px-2 text-[10px] leading-none'
                              onClick={() => setQuickCreateParent(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type='submit'
                              className='h-6 rounded bg-emerald-700 px-2 text-[10px] font-bold leading-none text-white'
                            >
                              Create
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type='button'
                          onClick={() => setQuickCreateParent(issue.key)}
                          title={`Add subtask to ${issue.key}`}
                          aria-label={`Add subtask to ${issue.key}`}
                          className='inline-flex size-7 items-center justify-center rounded-lg border border-dashed border-slate-300 text-base leading-none text-slate-500 hover:border-emerald-500 hover:text-emerald-700'
                        >
                          +
                        </button>
                      ))}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </>
  );
};

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

const CreateIssueModal = ({ onClose }) => {
  const [description, setDescription] = useState('\n\n### Checklist\n\n- [ ] ');
  return (
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
          <div className='grid gap-1.5 text-xs font-bold sm:col-span-2'>
            <span>Description and checklist</span>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder='Describe the issue, then add checklist items below…'
              ariaLabel='New issue description and checklist'
              minHeight='min-h-48'
            />
            <span className='font-normal text-slate-500'>Checklist items use Markdown task syntax: - [ ] item</span>
          </div>
          <label className='grid gap-1.5 text-xs font-bold sm:col-span-2'>
            Labels
            <input
              className='rounded-lg border border-slate-300 bg-transparent p-2.5 font-normal dark:border-slate-700'
              placeholder='bug, enhancement, frontend…'
            />
            <span className='font-normal text-slate-500'>
              New label names are created automatically with a readable color.
            </span>
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
};

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
      {view === 'reports' && <ReportsView />}
      {view === 'projects' && <ProjectsView />}
      {view === 'integrations' && <IntegrationsHealthView />}
      {view === 'settings' && <ProjectSettingsView />}
      {!['overview', 'backlog', 'board', 'reports', 'projects', 'integrations', 'settings'].includes(view) && (
        <PlaceholderView view={view} />
      )}
      {createOpen && <CreateIssueModal onClose={() => setCreateOpen(false)} />}
    </IssueboardShell>
  );
};

export default IssueboardWorkspace;
