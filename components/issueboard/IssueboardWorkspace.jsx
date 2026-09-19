import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBookmark,
  FiCheckCircle,
  FiCheckSquare,
  FiChevronDown,
  FiColumns,
  FiImage,
  FiInfo,
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
import { issueHref } from '@utils/issueboardNavigation';
import { useIssueboardData } from '@utils/issueboard/useIssueboardData';

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

const daysRemaining = (endsAt) => Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000));

const priorityClass = (priority) => {
  if (priority === 'Highest') return 'text-rose-700 dark:text-rose-300';
  if (priority === 'High') return 'text-orange-700 dark:text-orange-300';
  if (priority === 'Low') return 'text-sky-700 dark:text-sky-300';
  return 'text-amber-700 dark:text-amber-300';
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const workStateClass = (workState) => {
  if (workState === 'Blocked') {
    return 'blocked-bg border-rose-300 dark:border-rose-800/60';
  }
  if (workState === 'Rejected') {
    return 'border-slate-300 bg-slate-100/80 opacity-75 dark:border-slate-800 dark:bg-slate-900/50';
  }
  if (workState === 'Approved') {
    return 'border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20';
  }
  if (workState === 'Active') {
    return 'border-sky-300/60 bg-sky-50/40 dark:border-sky-800/40 dark:bg-sky-950/20';
  }
  if (workState === 'Done') {
    return 'border-purple-300/60 bg-purple-50/40 dark:border-purple-800/40 dark:bg-purple-950/20';
  }
  return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950';
};

const stateCapsulePresentation = {
  Approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
  Active: 'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300',
  Blocked: 'bg-rose-500/20 text-rose-700 border-rose-500/40 dark:text-rose-200 dark:bg-rose-900/40',
  Done: 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300',
  Rejected: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400',
  Normal: 'bg-slate-500/10 text-slate-600 border-slate-400/20 dark:text-slate-400'
};

const stateDotClass = {
  Approved: 'bg-emerald-500',
  Active: 'bg-sky-500',
  Blocked: 'bg-rose-500',
  Done: 'bg-purple-500',
  Rejected: 'bg-slate-500',
  Normal: 'bg-slate-400'
};

const severityCapsulePresentation = {
  Highest:
    'bg-rose-600/15 text-rose-700 border-rose-500/30 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
  High: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  Medium: 'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
  Low: 'bg-slate-500/15 text-slate-700 border-slate-400/30 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Lowest:
    'bg-slate-500/10 text-slate-500 border-slate-400/20 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
};

const SeverityCapsule = ({ priority }) => {
  const norm = capitalize(priority) || 'Medium';
  const label = norm === 'Highest' ? 'Critical' : norm;
  const style = severityCapsulePresentation[norm] || severityCapsulePresentation.Medium;
  return (
    <span
      className={`inline-flex h-5 items-center justify-center rounded-full border px-2 text-[10px] font-bold leading-none shrink-0 ${style}`}
    >
      {label}
    </span>
  );
};

const initialsFromName = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

const AssigneeDropdown = ({
  currentAssignee,
  options = [],
  onChange,
  compact = false,
  dropUp = true,
  align = 'right'
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.trim().toLowerCase();
    return options.filter((name) => name.toLowerCase().includes(term));
  }, [options, search]);

  return (
    <div
      ref={dropdownRef}
      className='relative inline-block text-left'
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type='button'
        onClick={(event) => {
          event.stopPropagation();
          setOpen((o) => !o);
        }}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-transparent transition hover:border-slate-300 hover:bg-slate-200/50 dark:hover:border-slate-700 dark:hover:bg-slate-800 ${
          compact ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-xs'
        }`}
        title={`Change assignee (currently ${currentAssignee || 'Unassigned'})`}
        aria-label={`Change assignee (currently ${currentAssignee || 'Unassigned'})`}
      >
        {currentAssignee ? (
          <span
            className={`inline-flex ${
              compact ? 'size-5 text-[8px]' : 'size-6 text-[9px]'
            } shrink-0 items-center justify-center rounded-full bg-slate-800 font-extrabold text-white ring-1 ring-white dark:bg-emerald-700 dark:ring-slate-900`}
          >
            {initialsFromName(currentAssignee)}
          </span>
        ) : (
          <span
            className={`inline-flex ${
              compact ? 'size-5 text-[9px]' : 'size-6 text-[10px]'
            } shrink-0 items-center justify-center rounded-full border border-dashed border-slate-400 text-slate-400 dark:border-slate-600`}
            title='Unassigned'
          >
            &times;
          </span>
        )}
        <span className='font-medium text-slate-700 dark:text-slate-300 truncate max-w-[5.5rem]'>
          {currentAssignee || 'Unassigned'}
        </span>
        <FiChevronDown className={`size-3 text-slate-400 transition duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role='listbox'
          className={`absolute ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 max-h-56 w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900`}
        >
          <div className='mb-1 px-1 pt-0.5'>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Filter or type name…'
              className='w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            type='button'
            role='option'
            aria-selected={!currentAssignee}
            onClick={async (event) => {
              event.stopPropagation();
              setOpen(false);
              if (!currentAssignee) return;
              setBusy(true);
              try {
                await onChange(null);
              } finally {
                setBusy(false);
              }
            }}
            className={`flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
              !currentAssignee
                ? 'bg-slate-100 font-bold text-slate-950 dark:bg-slate-800 dark:text-white'
                : 'text-slate-500'
            }`}
          >
            <span className='size-4 rounded-full border border-dashed border-slate-400 grid place-items-center text-[9px] text-slate-400 shrink-0'>
              &times;
            </span>
            <span>Unassigned</span>
          </button>
          {filteredOptions.length === 0 && (
            <div className='px-2 py-1.5 text-[10px] text-slate-400 dark:text-slate-500 italic'>No matching users</div>
          )}
          {filteredOptions.map((name) => (
            <button
              key={name}
              type='button'
              role='option'
              aria-selected={currentAssignee === name}
              onClick={async (event) => {
                event.stopPropagation();
                setOpen(false);
                if (currentAssignee === name) return;
                setBusy(true);
                try {
                  await onChange(name);
                } finally {
                  setBusy(false);
                }
              }}
              className={`flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                currentAssignee === name
                  ? 'bg-slate-100 font-bold text-slate-950 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className='size-4 rounded-full bg-slate-800 text-white dark:bg-emerald-700 text-[8px] font-bold grid place-items-center shrink-0'>
                {initialsFromName(name)}
              </span>
              <span className='truncate'>{name}</span>
            </button>
          ))}
          {search.trim() && !options.some((n) => n.toLowerCase() === search.trim().toLowerCase()) && (
            <button
              type='button'
              onClick={async (event) => {
                event.stopPropagation();
                setOpen(false);
                setBusy(true);
                try {
                  await onChange(search.trim());
                } finally {
                  setBusy(false);
                }
              }}
              className='flex h-7 w-full items-center gap-1.5 rounded-lg px-2 text-left text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            >
              <span>+ Assign &quot;{search.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Adapts a real issueService record onto the presentational shape this prototype UI
// was built around. Fields with no backend yet (labels, checklist, attachments) are
// left empty rather than faked.
const toDisplayIssue = (issue) => ({
  id: issue.id,
  key: issue.key,
  type: capitalize(issue.type),
  title: issue.title,
  description: issue.description || '',
  status: issue.status?.name || 'Backlog',
  statusId: issue.status?.id || issue.statusId,
  sprintId: issue.sprintId,
  workState: capitalize(issue.workState) || 'Normal',
  priority: capitalize(issue.priority),
  rawPriority: issue.priority,
  estimate: issue.storyPoints ?? undefined,
  assignee: issue.assignee || null,
  labels: issue.labels || [],
  checklist: null,
  checklistItems: [],
  attachments: 0,
  creator: { name: issue.reporter, initials: initialsFromName(issue.reporter) },
  updatedAt: issue.updatedAt,
  due: issue.dueAt ? new Date(issue.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : undefined
});

const LabelPill = ({ label }) => (
  <span
    className='inline-flex h-4 items-center rounded-full px-2 text-[10px] font-bold leading-none'
    style={{ backgroundColor: label.backgroundColor, color: label.textColor }}
  >
    {label.name}
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
    {typeof issue.estimate === 'number' && (
      <>
        <span>•</span>
        <span>{issue.estimate} points</span>
      </>
    )}
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
    {issue.labels?.map((label) => (
      <LabelPill key={label.id} label={label} />
    ))}
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

const issueTypes = ['task', 'story', 'bug', 'epic', 'feature', 'improvement', 'research', 'subtask'];
const priorities = ['highest', 'high', 'medium', 'low', 'lowest'];

const Filters = ({
  search = '',
  onSearchChange,
  type = '',
  onTypeChange,
  priority = '',
  onPriorityChange,
  assignee = '',
  onAssigneeChange,
  availableAssignees = []
}) => (
  <div className='mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
    <label className='relative min-w-[15rem] flex-1'>
      <FiSearch className='absolute left-3 top-3 text-slate-400' />
      <span className='sr-only'>Search issues</span>
      <input
        value={search}
        onChange={(event) => onSearchChange?.(event.target.value)}
        className='w-full rounded-lg border border-slate-300 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700'
        placeholder='Search issue key, title, or description…'
      />
    </label>
    <select
      value={type}
      onChange={(event) => onTypeChange?.(event.target.value)}
      className='rounded-lg border border-slate-300 bg-white py-2 pl-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900'
      aria-label='Filter by type'
    >
      <option value=''>All types</option>
      {issueTypes.map((value) => (
        <option key={value} value={value}>
          {capitalize(value)}
        </option>
      ))}
    </select>
    <select
      value={priority}
      onChange={(event) => onPriorityChange?.(event.target.value)}
      className='rounded-lg border border-slate-300 bg-white py-2 pl-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900'
      aria-label='Filter by priority'
    >
      <option value=''>All priorities</option>
      {priorities.map((value) => (
        <option key={value} value={value}>
          {capitalize(value)}
        </option>
      ))}
    </select>
    <select
      value={assignee}
      onChange={(event) => onAssigneeChange?.(event.target.value)}
      className='rounded-lg border border-slate-300 bg-white py-2 pl-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900'
      aria-label='Filter by assignee'
    >
      <option value=''>All assignees</option>
      <option value='__unassigned__'>Unassigned</option>
      {availableAssignees.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  </div>
);

const DatastoreUnavailableNotice = ({ error }) => (
  <div className='rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
    <strong className='block'>Issue management is temporarily unavailable</strong>
    <p className='mt-1 text-xs leading-5'>
      {error || 'The database or storage could not be reached.'} Nothing was lost — try again shortly.
    </p>
  </div>
);

const NoProjectsNotice = () => (
  <div className='rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900'>
    <h3 className='font-bold'>No projects yet</h3>
    <p className='mx-auto mt-1 max-w-sm text-sm text-slate-500'>Create your first project to start tracking issues.</p>
    <Link href='/admin/issues?view=projects' className='button mt-4 inline-flex items-center justify-center text-sm'>
      Create a project
    </Link>
  </div>
);

const Overview = ({ returnTo, data }) => {
  const { status, project, issues, error, loadedAt } = data;
  if (status === 'loading') return null;
  if (status === 'unavailable') return <DatastoreUnavailableNotice error={error} />;
  if (status === 'no-projects') return <NoProjectsNotice />;

  const openIssues = issues.filter((issue) => issue.status?.category !== 'done');
  const unassigned = openIssues.filter((issue) => !issue.assignee);
  const dueSoon = openIssues.filter((issue) => {
    if (!issue.dueAt) return false;
    const daysUntilDue = (new Date(issue.dueAt).getTime() - loadedAt) / 86_400_000;
    return daysUntilDue <= 3;
  });
  const attention = [...openIssues]
    .sort((a, b) => a.priority.localeCompare(b.priority))
    .slice(0, 4)
    .map(toDisplayIssue);

  return (
    <>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>{project.name}</h2>
          <p className='mt-1 text-sm text-slate-500'>Here is what is moving across {project.key} right now.</p>
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
          ['Open issues', openIssues.length],
          ['Total issues', issues.length],
          ['Due soon', dueSoon.length],
          ['Unassigned', unassigned.length]
        ].map(([label, value]) => (
          <article
            key={label}
            className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'
          >
            <p className='text-xs font-semibold text-slate-500'>{label}</p>
            <strong className='my-1 block text-3xl tracking-tight'>{value}</strong>
          </article>
        ))}
      </div>
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,.7fr)]'>
        <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <header className='border-b border-slate-200 px-5 py-4 dark:border-slate-800'>
            <h3 className='font-bold'>Needs your attention</h3>
            <p className='text-xs text-slate-500'>Priority, age, and due-date signals</p>
          </header>
          {attention.length === 0 && <p className='px-4 py-6 text-sm text-slate-500'>No open issues yet.</p>}
          {attention.map((issue) => (
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
          <h3 className='font-bold'>Active sprint</h3>
          <p className='mt-1 text-xs text-slate-500'>Sprint planning has not started for {project.key} yet.</p>
        </aside>
      </div>
    </>
  );
};

const NewSprintForm = ({ onCreate, onClose }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ name, goal });
      onClose();
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className='mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900'
    >
      <label className='grid gap-1 text-xs font-bold'>
        Sprint name
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm font-normal dark:border-slate-700'
          placeholder='Sprint 1'
        />
      </label>
      <label className='grid gap-1 text-xs font-bold'>
        Goal (optional)
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm font-normal dark:border-slate-700'
          placeholder='What are we trying to ship?'
        />
      </label>
      <button type='submit' disabled={submitting} className='button text-xs disabled:opacity-60'>
        {submitting ? 'Creating…' : 'Create sprint'}
      </button>
      <button
        type='button'
        onClick={onClose}
        className='rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
      >
        Cancel
      </button>
      {error && <p className='w-full text-xs font-semibold text-rose-600 dark:text-rose-300'>{error}</p>}
    </form>
  );
};

const StartSprintForm = ({ onStart, onClose }) => {
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  useEffect(() => {
    setStartsAt(new Date().toISOString().slice(0, 10));
    setEndsAt(new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));
  }, []);

  const submit = async (event, force = false) => {
    event?.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onStart({ startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), force });
      onClose();
    } catch (submitError) {
      if (submitError.code === 'EMPTY_SPRINT') {
        setEmptyConfirm(true);
        setSubmitting(false);
        return;
      }
      setError(submitError.message);
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className='mt-3 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800'
    >
      <label className='grid gap-1 text-xs font-bold'>
        Starts
        <input
          type='date'
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm font-normal dark:border-slate-700'
        />
      </label>
      <label className='grid gap-1 text-xs font-bold'>
        Ends
        <input
          type='date'
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm font-normal dark:border-slate-700'
        />
      </label>
      {emptyConfirm ? (
        <button
          type='button'
          onClick={(event) => submit(event, true)}
          disabled={submitting}
          className='rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60'
        >
          No issues planned -- start anyway?
        </button>
      ) : (
        <button type='submit' disabled={submitting} className='button text-xs disabled:opacity-60'>
          {submitting ? 'Starting…' : 'Start sprint'}
        </button>
      )}
      <button
        type='button'
        onClick={onClose}
        className='rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
      >
        Cancel
      </button>
      {error && <p className='w-full text-xs font-semibold text-rose-600 dark:text-rose-300'>{error}</p>}
    </form>
  );
};

const IssueRow = ({ issue, returnTo, sprintOptions, onMoveSprint }) => (
  <div className='grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-slate-100 px-4 py-2 last:border-0 dark:border-slate-800'>
    <CreatorAvatar creator={issue.creator} />
    <IssueLink issue={issue} returnTo={returnTo}>
      <div className='flex items-center gap-2'>
        <TypeIcon type={issue.type} />
        <strong className='text-sm'>{issue.title}</strong>
      </div>
      <IssueMeta issue={issue} showPriority />
    </IssueLink>
    <span
      className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2.5 text-[10px] font-bold ${badgeClass(issue.status)}`}
    >
      {issue.status}
    </span>
    <select
      value={issue.sprintId || ''}
      onChange={(event) => onMoveSprint(event.target.value || null)}
      aria-label={`Move ${issue.key} to a different sprint`}
      className='rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] dark:border-slate-800 dark:bg-slate-900'
    >
      <option value=''>Backlog</option>
      {sprintOptions.map((sprint) => (
        <option key={sprint.id} value={sprint.id}>
          {sprint.name}
        </option>
      ))}
    </select>
  </div>
);

const SprintSection = ({
  sprint,
  issues,
  returnTo,
  sprintOptions,
  onMoveSprint,
  onCreateIssue,
  onStart,
  onComplete,
  onCancel
}) => {
  const [starting, setStarting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const complete = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await onComplete();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await onCancel();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className='mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
      <header className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900'>
        <div>
          <strong>{sprint.name}</strong>
          {sprint.goal && <span className='ml-2 text-xs text-slate-500'>{sprint.goal}</span>}
          <span
            className={`ml-2 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold ${sprint.state === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
          >
            {sprint.state}
          </span>
          <span className='ml-2 text-xs text-slate-500'>{issues.length} issues</span>
        </div>
        <div className='flex gap-2'>
          {sprint.state === 'planned' && !starting && (
            <button
              type='button'
              onClick={() => setStarting(true)}
              className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-700'
            >
              Start sprint
            </button>
          )}
          {sprint.state === 'active' && (
            <button
              type='button'
              onClick={complete}
              disabled={busy}
              className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold disabled:opacity-60 dark:border-slate-700'
            >
              {busy ? '…' : 'Complete sprint'}
            </button>
          )}
          {sprint.state === 'planned' && (
            <button
              type='button'
              onClick={cancel}
              disabled={busy}
              className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-rose-600 disabled:opacity-60 dark:border-slate-700'
            >
              Cancel
            </button>
          )}
        </div>
      </header>
      {actionError && <p className='px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{actionError}</p>}
      {issues.length === 0 && <p className='px-4 py-6 text-sm text-slate-500'>No issues in this sprint yet.</p>}
      {issues.map((issue) => (
        <IssueRow
          key={issue.key}
          issue={issue}
          returnTo={returnTo}
          sprintOptions={sprintOptions}
          onMoveSprint={(sprintId) => onMoveSprint(issue, sprintId)}
        />
      ))}
      {sprint.state === 'planned' && (
        <button
          type='button'
          onClick={onCreateIssue}
          className='w-full px-5 py-3 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-emerald-700 dark:hover:bg-slate-800'
        >
          ＋ Create issue
        </button>
      )}
      {starting && (
        <div className='px-4 pb-4'>
          <StartSprintForm onStart={onStart} onClose={() => setStarting(false)} />
        </div>
      )}
    </section>
  );
};

const Backlog = ({ returnTo, data, onCreateIssue }) => {
  const { status, issues, sprints, error, moveIssueSprint, createSprint, startSprint, completeSprint, cancelSprint } =
    data;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [moveError, setMoveError] = useState(null);

  if (status === 'loading') return null;
  if (status === 'unavailable') return <DatastoreUnavailableNotice error={error} />;
  if (status === 'no-projects') return <NoProjectsNotice />;

  const availableAssignees = [
    ...new Set(
      issues.flatMap((issue) => (issue.assignee ? issue.assignee.split(',').map((s) => s.trim()) : [])).filter(Boolean)
    )
  ].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredIssues = issues.filter((issue) => {
    if (issue.archivedAt) return false;
    if (typeFilter && issue.type !== typeFilter) return false;
    if (priorityFilter && issue.priority !== priorityFilter) return false;
    if (assigneeFilter === '__unassigned__' && issue.assignee) return false;
    if (assigneeFilter && assigneeFilter !== '__unassigned__' && issue.assignee !== assigneeFilter) return false;
    if (
      normalizedSearch &&
      !issue.key.toLowerCase().includes(normalizedSearch) &&
      !issue.title.toLowerCase().includes(normalizedSearch) &&
      !issue.description?.toLowerCase().includes(normalizedSearch)
    )
      return false;
    return true;
  });
  const filtersActive = Boolean(search || typeFilter || priorityFilter || assigneeFilter);
  const byRank = (a, b) => a.rank.localeCompare(b.rank);
  const toRows = (list) => [...list].sort(byRank).map(toDisplayIssue);

  const openSprints = [...sprints]
    .filter((sprint) => sprint.state === 'planned' || sprint.state === 'active')
    .sort((a, b) => (a.state === 'active' ? -1 : b.state === 'active' ? 1 : b.sequence - a.sequence));
  const backlogIssues = toRows(filteredIssues.filter((issue) => !issue.sprintId));

  const handleMoveSprint = async (issue, sprintId) => {
    setMoveError(null);
    try {
      await moveIssueSprint(issue, sprintId);
    } catch (moveErr) {
      setMoveError(moveErr.message);
    }
  };

  return (
    <>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Backlog</h2>
          <p className='mt-1 text-sm text-slate-500'>Plan sprints and rank work not yet committed to one.</p>
        </div>
        {!creatingSprint && (
          <button
            type='button'
            onClick={() => setCreatingSprint(true)}
            className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
          >
            + Create sprint
          </button>
        )}
      </div>
      <Filters
        search={search}
        onSearchChange={setSearch}
        type={typeFilter}
        onTypeChange={setTypeFilter}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        assignee={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        availableAssignees={availableAssignees}
      />
      {moveError && (
        <p className='mb-3 rounded-lg border border-rose-300 bg-rose-50 p-2 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'>
          {moveError}
        </p>
      )}
      {creatingSprint && <NewSprintForm onCreate={createSprint} onClose={() => setCreatingSprint(false)} />}
      {openSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          issues={toRows(filteredIssues.filter((issue) => issue.sprintId === sprint.id))}
          returnTo={returnTo}
          sprintOptions={openSprints.filter((entry) => entry.id !== sprint.id)}
          onMoveSprint={handleMoveSprint}
          onCreateIssue={onCreateIssue}
          onStart={(input) => startSprint(sprint.id, input)}
          onComplete={() => completeSprint(sprint.id, null)}
          onCancel={() => cancelSprint(sprint.id)}
        />
      ))}
      <section className='mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <header className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900'>
          <div>
            <strong>Backlog</strong>
            <span className='ml-2 text-xs text-slate-500'>
              {backlogIssues.length}{' '}
              {filtersActive ? `of ${issues.filter((i) => !i.sprintId).length} issues` : 'issues'}
            </span>
          </div>
        </header>
        {backlogIssues.length === 0 && (
          <p className='px-4 py-6 text-sm text-slate-500'>
            {filtersActive ? 'No issues match these filters.' : 'No issues yet. Create the first one below.'}
          </p>
        )}
        {backlogIssues.map((issue) => (
          <IssueRow
            key={issue.key}
            issue={issue}
            returnTo={returnTo}
            sprintOptions={openSprints}
            onMoveSprint={(sprintId) => handleMoveSprint(issue, sprintId)}
          />
        ))}
        <button
          type='button'
          onClick={onCreateIssue}
          className='w-full px-5 py-3 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-emerald-700 dark:hover:bg-slate-800'
        >
          ＋ Create issue
        </button>
      </section>
    </>
  );
};

const BoardCard = ({ issue, returnTo, onDragStart, assigneeOptions = [], onAssigneeChange }) => {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/issueboard/issues/${encodeURIComponent(issue.key)}/checklists`, {
      headers: { Accept: 'application/json' }
    })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !payload?.ok) return;
        const items = payload.checklists.flatMap((checklist) => checklist.items);
        if (items.length > 0) setChecklistItems(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [issue.key]);

  const checklistDone = checklistItems?.filter((item) => item.isComplete).length ?? 0;
  const checklistTotal = checklistItems?.length ?? 0;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const toggleChecklistItem = async (event, item) => {
    event.stopPropagation();
    const newIsComplete = !item.isComplete;
    setChecklistItems((prev) =>
      (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: newIsComplete } : entry))
    );
    try {
      const response = await fetch(`/api/issueboard/checklist-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ isComplete: newIsComplete })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setChecklistItems((prev) =>
          (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: !newIsComplete } : entry))
        );
      }
    } catch {
      setChecklistItems((prev) =>
        (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: !newIsComplete } : entry))
      );
    }
  };

  return (
    <article
      draggable
      onDragStart={onDragStart}
      className='mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950'
    >
      <IssueLink issue={issue} returnTo={returnTo}>
        <div className='flex items-center justify-between gap-1 text-[10px] text-slate-500'>
          <span className='flex items-center gap-1.5'>
            <TypeIcon type={issue.type} />
            <span className='font-mono font-bold text-slate-600 dark:text-slate-400'>{issue.key}</span>
          </span>
          <SeverityCapsule priority={issue.priority} />
        </div>
        <h3 className='my-2 text-sm font-medium leading-snug text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition'>
          {issue.title}
        </h3>
      </IssueLink>

      {checklistTotal > 0 && (
        <div className='my-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80'>
          <button
            type='button'
            onClick={() => setChecklistOpen((open) => !open)}
            className='w-full flex items-center justify-between text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition'
          >
            <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono'>
              <FiCheckSquare className='size-3 shrink-0' />
              <span>
                {checklistDone}/{checklistTotal}
              </span>
            </span>
            <FiChevronDown className={`size-3 transition duration-150 ${checklistOpen ? 'rotate-180' : ''}`} />
          </button>
          {checklistOpen && (
            <div className='mt-1.5 space-y-1'>
              <div className='w-full h-1 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800'>
                <div className='h-full bg-emerald-500 rounded-full' style={{ width: `${checklistPct}%` }} />
              </div>
              <ul className='space-y-0.5 pt-0.5 text-[10px] text-slate-600 dark:text-slate-300'>
                {checklistItems.map((item) => (
                  <li
                    key={item.id}
                    onClick={(e) => toggleChecklistItem(e, item)}
                    className='flex items-center gap-1.5 leading-tight cursor-pointer rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition'
                  >
                    <input
                      type='checkbox'
                      checked={Boolean(item.isComplete)}
                      onChange={(e) => toggleChecklistItem(e, item)}
                      onClick={(e) => e.stopPropagation()}
                      className='size-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer'
                    />
                    <span className={item.isComplete ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                      {item.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className='flex items-center justify-between text-[10px] text-slate-500 pt-1'>
        {typeof issue.estimate === 'number' ? (
          <span className='font-mono font-semibold'>{issue.estimate} pts</span>
        ) : (
          <span />
        )}
        <AssigneeDropdown
          currentAssignee={issue.assignee}
          options={assigneeOptions}
          onChange={(newAssignee) => onAssigneeChange?.(issue, newAssignee)}
          compact
          dropUp
        />
      </div>
    </article>
  );
};

const ParentIssueCard = ({ issue, returnTo, onStateChange, assigneeOptions = [], onAssigneeChange }) => {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [stateBusy, setStateBusy] = useState(false);
  const [checklistItems, setChecklistItems] = useState(null);
  const stateMenuRef = useRef(null);
  const workState = issue.workState === 'Normal' ? 'Active' : issue.workState || 'Active';

  useEffect(() => {
    if (!stateMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (stateMenuRef.current && !stateMenuRef.current.contains(e.target)) {
        setStateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [stateMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/issueboard/issues/${encodeURIComponent(issue.key)}/checklists`, {
      headers: { Accept: 'application/json' }
    })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !payload?.ok) return;
        setChecklistItems(payload.checklists.flatMap((checklist) => checklist.items));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [issue.key]);

  const checklistDone = checklistItems?.filter((item) => item.isComplete).length ?? 0;
  const checklistTotal = checklistItems?.length ?? 0;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const toggleChecklistItem = async (event, item) => {
    event.stopPropagation();
    const newIsComplete = !item.isComplete;
    setChecklistItems((prev) =>
      (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: newIsComplete } : entry))
    );
    try {
      const response = await fetch(`/api/issueboard/checklist-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ isComplete: newIsComplete })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setChecklistItems((prev) =>
          (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: !newIsComplete } : entry))
        );
      }
    } catch {
      setChecklistItems((prev) =>
        (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: !newIsComplete } : entry))
      );
    }
  };

  return (
    <article
      className={`rounded-xl border p-3.5 shadow-sm transition-all duration-150 ${workStateClass(issue.workState)}`}
    >
      <div className='flex items-start justify-between gap-2'>
        <IssueLink issue={issue} returnTo={returnTo} className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5 text-[10px] text-slate-500'>
            <TypeIcon type={issue.type} />
            <span className='font-mono font-bold'>{issue.key}</span>
          </div>
          <h3 className='mt-1.5 text-sm font-semibold leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer'>
            {issue.title}
          </h3>
        </IssueLink>
        <SeverityCapsule priority={issue.priority} />
      </div>

      <div ref={stateMenuRef} className='relative mt-2.5 inline-block'>
        <button
          type='button'
          onClick={() => setStateMenuOpen((open) => !open)}
          disabled={stateBusy}
          aria-label={`State for ${issue.key}`}
          aria-haspopup='listbox'
          aria-expanded={stateMenuOpen}
          className={`inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-bold leading-none shrink-0 transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 ${
            stateCapsulePresentation[workState] || stateCapsulePresentation.Active
          }`}
        >
          <span className={`size-1.5 rounded-full ${stateDotClass[workState] || 'bg-sky-500'}`} aria-hidden='true' />
          <span>{workState}</span>
          <FiChevronDown
            className={`ml-0.5 size-2.5 transition duration-150 ${stateMenuOpen ? 'rotate-180' : ''}`}
            aria-hidden='true'
          />
        </button>
        {stateMenuOpen && (
          <div
            role='listbox'
            aria-label={`Choose state for ${issue.key}`}
            className='absolute left-0 top-6 z-30 w-32 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900'
          >
            {['Active', 'Approved', 'Blocked', 'Done', 'Rejected'].map((state) => (
              <button
                key={state}
                type='button'
                role='option'
                aria-selected={workState === state}
                onClick={async () => {
                  setStateMenuOpen(false);
                  if (state === workState) return;
                  setStateBusy(true);
                  try {
                    await onStateChange(state.toLowerCase());
                  } finally {
                    setStateBusy(false);
                  }
                }}
                className={`flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  workState === state
                    ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${stateDotClass[state] || 'bg-slate-400'}`}
                  aria-hidden='true'
                />
                <span>{state}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {checklistTotal > 0 && (
        <div className='mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60'>
          <button
            type='button'
            onClick={() => setChecklistOpen((open) => !open)}
            className='w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition'
          >
            <span className='flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono'>
              <FiCheckSquare className='size-3.5 shrink-0' />
              <span>
                {checklistDone}/{checklistTotal}
              </span>
            </span>
            <FiChevronDown className={`size-3 transition duration-150 ${checklistOpen ? 'rotate-180' : ''}`} />
          </button>
          {checklistOpen && (
            <div className='mt-2 space-y-1.5'>
              <div className='w-full h-1 rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800'>
                <div
                  className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
              <ul className='space-y-1 pt-0.5 text-[11px] text-slate-600 dark:text-slate-300'>
                {checklistItems.map((item) => (
                  <li
                    key={item.id}
                    onClick={(e) => toggleChecklistItem(e, item)}
                    className='flex items-center gap-2 leading-tight cursor-pointer rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition'
                  >
                    <input
                      type='checkbox'
                      checked={Boolean(item.isComplete)}
                      onChange={(e) => toggleChecklistItem(e, item)}
                      onClick={(e) => e.stopPropagation()}
                      className='size-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer'
                    />
                    <span className={item.isComplete ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                      {item.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className='mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800/60'>
        <AssigneeDropdown
          currentAssignee={issue.assignee}
          options={assigneeOptions}
          onChange={(newAssignee) => onAssigneeChange?.(issue, newAssignee)}
          dropUp
        />
        {typeof issue.estimate === 'number' && (
          <span className='font-mono font-bold text-slate-500'>{issue.estimate} pts</span>
        )}
      </div>
    </article>
  );
};

const handleBoardScroll = (e) => {
  const target = e.currentTarget;
  target.classList.add('scrolling');
  clearTimeout(target._scrollTimeout);
  target._scrollTimeout = setTimeout(() => {
    target.classList.remove('scrolling');
  }, 800);
};

const StoryPod = ({
  issue,
  returnTo,
  isCollapsed,
  onToggleCollapse,
  parentSubtasks = [],
  sprintStatuses = [],
  filtersActive,
  matchesFilters,
  dragIssueKey,
  setDragIssueKey,
  onMoveSubtask,
  quickCreateParent,
  setQuickCreateParent,
  quickTitle,
  setQuickTitle,
  onCreateSubtask,
  quickCreateBusy,
  assigneeOptions = [],
  onAssigneeChange,
  onStateChange
}) => {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState(null);
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const stateMenuRef = useRef(null);

  const isBlocked = issue.workState === 'Blocked';
  const workState = issue.workState === 'Normal' ? 'Active' : issue.workState || 'Active';

  useEffect(() => {
    if (!stateMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (stateMenuRef.current && !stateMenuRef.current.contains(e.target)) {
        setStateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [stateMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/issueboard/issues/${encodeURIComponent(issue.key)}/checklists`, {
      headers: { Accept: 'application/json' }
    })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !payload?.ok) return;
        const items = payload.checklists.flatMap((checklist) => checklist.items);
        setChecklistItems(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [issue.key]);

  const checklistDone = checklistItems?.filter((item) => item.isComplete).length ?? 0;
  const checklistTotal = checklistItems?.length ?? 0;

  const toggleChecklistItem = async (event, item) => {
    event.stopPropagation();
    const newIsComplete = !item.isComplete;
    setChecklistItems((prev) =>
      (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: newIsComplete } : entry))
    );
    try {
      const response = await fetch(`/api/issueboard/checklist-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ isComplete: newIsComplete })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setChecklistItems((prev) =>
          (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: !newIsComplete } : entry))
        );
      }
    } catch {
      setChecklistItems((prev) =>
        (prev || []).map((entry) => (entry.id === item.id ? { ...entry, isComplete: !newIsComplete } : entry))
      );
    }
  };

  return (
    <section
      className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
        isBlocked
          ? 'blocked-bg border-rose-400/60 shadow-rose-950/20'
          : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60'
      }`}
    >
      {/* Pod Header Bar with distinctly darker / accent background */}
      <header
        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-l-4 transition-colors ${
          isBlocked
            ? 'border-rose-300/80 border-l-rose-500 bg-rose-100/90 text-rose-950 dark:border-rose-800/60 dark:border-l-rose-500 dark:bg-rose-950/70 dark:text-rose-100'
            : 'border-slate-300/80 border-l-emerald-600 bg-slate-200/90 text-slate-900 dark:border-slate-800 dark:border-l-emerald-500 dark:bg-slate-900/95 dark:text-slate-100'
        }`}
      >
        <div className='flex items-center gap-3 min-w-0'>
          <button
            type='button'
            onClick={onToggleCollapse}
            className='size-7 rounded-lg border border-slate-400/60 bg-white/90 text-xs font-bold text-slate-800 shadow-sm hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 grid place-items-center transition shrink-0'
            title={isCollapsed ? 'Expand Story Pod' : 'Collapse Story Pod'}
          >
            {isCollapsed ? '+' : '−'}
          </button>

          <div className='min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <TypeIcon type={issue.type} />
              <IssueLink
                issue={issue}
                returnTo={returnTo}
                className='font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline'
              >
                {issue.key}
              </IssueLink>
              <h3 className='text-sm font-bold text-slate-900 dark:text-slate-100 truncate'>{issue.title}</h3>
            </div>
            <div className='flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1 flex-wrap'>
              <span className='text-[11px] font-semibold text-slate-500'>Assignee:</span>
              <AssigneeDropdown
                currentAssignee={issue.assignee}
                options={assigneeOptions}
                onChange={(newAssignee) => onAssigneeChange?.(issue, newAssignee)}
                compact
                dropUp={false}
              />
              {typeof issue.storyPoints === 'number' && (
                <span className='font-mono font-medium'>· {issue.storyPoints} pts</span>
              )}
              <span className='font-medium'>· {parentSubtasks.length} subtasks</span>
              {checklistTotal > 0 && (
                <button
                  type='button'
                  onClick={() => setChecklistOpen((open) => !open)}
                  className='inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100/90 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60 transition shadow-xs'
                  title={checklistOpen ? 'Hide checklist' : 'Show checklist'}
                >
                  <FiCheckSquare className='size-3 shrink-0' />
                  <span>
                    {checklistDone}/{checklistTotal}
                  </span>
                  <FiChevronDown className={`size-2.5 transition duration-150 ${checklistOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
              {isBlocked && <span className='font-bold text-rose-600 dark:text-rose-400'>· Blocked</span>}
            </div>
          </div>
        </div>

        {/* State and Priority Capsules: Vertically Centered on exact same center line */}
        <div className='flex items-center self-center gap-2 shrink-0'>
          {/* Parent State Dropdown with click outside handler */}
          <div ref={stateMenuRef} className='relative inline-flex items-center'>
            <button
              type='button'
              onClick={() => setStateMenuOpen((open) => !open)}
              className={`inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-bold leading-none shrink-0 transition focus-visible:outline-none focus-visible:ring-2 ${
                stateCapsulePresentation[workState] || stateCapsulePresentation.Active
              }`}
            >
              <span className={`size-1.5 rounded-full ${stateDotClass[workState] || 'bg-sky-500'}`} />
              <span>{workState}</span>
              <FiChevronDown
                className={`ml-0.5 size-2.5 transition duration-150 ${stateMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {stateMenuOpen && (
              <div
                role='listbox'
                className='absolute right-0 top-6 z-30 w-32 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900'
              >
                {['Active', 'Approved', 'Blocked', 'Done', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    type='button'
                    onClick={async () => {
                      setStateMenuOpen(false);
                      if (st.toLowerCase() === workState.toLowerCase()) return;
                      await onStateChange(issue, st.toLowerCase());
                    }}
                    className={`flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      workState === st
                        ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${stateDotClass[st] || 'bg-slate-400'}`} />
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <SeverityCapsule priority={issue.priority} />
        </div>
      </header>

      {/* Expandable Parent Task Checklist with interactive check/uncheck */}
      {checklistOpen && checklistItems && checklistItems.length > 0 && (
        <div className='border-b border-slate-300/80 bg-slate-100/90 dark:border-slate-800 dark:bg-slate-900/90 px-4 py-2.5'>
          <div className='flex items-center justify-between mb-1.5'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
              Parent Task Checklist ({checklistDone}/{checklistTotal})
            </span>
          </div>
          <ul className='flex flex-col gap-1 text-xs'>
            {checklistItems.map((item, idx) => (
              <li
                key={item.id}
                onClick={(e) => toggleChecklistItem(e, item)}
                className='flex items-center gap-2.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 px-3 py-1.5 cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-400 transition shadow-2xs'
              >
                <input
                  type='checkbox'
                  checked={Boolean(item.isComplete)}
                  onChange={(e) => toggleChecklistItem(e, item)}
                  onClick={(e) => e.stopPropagation()}
                  className='size-3.5 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0'
                />
                <span className='font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0 select-none'>
                  {idx + 1}.
                </span>
                <span
                  className={`text-xs ${item.isComplete ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200 font-medium'}`}
                >
                  {item.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pod Body: Active Columns */}
      {!isCollapsed && (
        <div onScroll={handleBoardScroll} className='sprint-board-scroll p-4 bg-slate-50/40 dark:bg-slate-950/40'>
          <div
            className='grid gap-4'
            style={{
              gridTemplateColumns: `repeat(${sprintStatuses.length}, minmax(15rem, 1fr))`,
              minWidth: `${sprintStatuses.length * 15}rem`
            }}
          >
            {sprintStatuses.map((columnStatus) => {
              const cellSubtasks = parentSubtasks.filter(
                (subtask) => subtask.status?.id === columnStatus.id && (!filtersActive || matchesFilters(subtask))
              );
              return (
                <div
                  key={columnStatus.id}
                  className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/50 min-h-36'
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    const subtask = parentSubtasks.find((entry) => entry.key === dragIssueKey);
                    if (subtask) onMoveSubtask(subtask, columnStatus.id);
                    setDragIssueKey(null);
                  }}
                >
                  <div className='flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-100 dark:border-slate-800'>
                    <span>{columnStatus.name}</span>
                    <span className='font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full'>
                      {cellSubtasks.length}
                    </span>
                  </div>

                  {cellSubtasks.map((subtask) => (
                    <BoardCard
                      key={subtask.key}
                      issue={toDisplayIssue(subtask)}
                      returnTo={returnTo}
                      onDragStart={() => setDragIssueKey(subtask.key)}
                      assigneeOptions={assigneeOptions}
                      onAssigneeChange={onAssigneeChange}
                    />
                  ))}

                  {columnStatus.id === sprintStatuses[0]?.id &&
                    (quickCreateParent === issue.key ? (
                      <form
                        className='rounded-xl border border-dashed border-slate-400 bg-white p-2 dark:bg-slate-900 mt-2'
                        onSubmit={(event) => onCreateSubtask(event, issue)}
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
                            disabled={quickCreateBusy}
                            className='h-6 rounded bg-emerald-700 px-2 text-[10px] font-bold leading-none text-white disabled:opacity-60'
                          >
                            {quickCreateBusy ? 'Adding…' : 'Add'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type='button'
                        onClick={() => {
                          setQuickTitle('');
                          setQuickCreateParent(issue.key);
                        }}
                        className='mt-2 w-full rounded-lg border border-dashed border-slate-300 py-1.5 text-center text-xs font-semibold text-slate-500 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:hover:border-emerald-500'
                      >
                        ＋ Add subtask
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

const Board = ({ returnTo, data, moveIssueStatus, setIssueWorkState, boardLayout = 'swimlane' }) => {
  const { status, issues, statuses, sprints, error, project, createIssue, moveIssueSprint } = data;
  const [moveError, setMoveError] = useState(null);
  const [dragIssueKey, setDragIssueKey] = useState(null);
  const [quickCreateParent, setQuickCreateParent] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCreateBusy, setQuickCreateBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [collapsedPods, setCollapsedPods] = useState({});
  const [projectUsers, setProjectUsers] = useState(data.projectUsers || []);

  const defaultTeamMembers = useMemo(() => ['Sukhdeep Singh', 'Alex Rivera', 'Sarah Chen', 'Marcus Brody'], []);

  useEffect(() => {
    if (data.projectUsers?.length) {
      setProjectUsers(data.projectUsers);
    }
  }, [data.projectUsers]);

  useEffect(() => {
    if (!project?.key) return;
    let cancelled = false;
    fetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/users`)
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled || !payload?.ok) return;
        setProjectUsers(payload.users || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [project?.key]);

  const assigneeOptions = useMemo(() => {
    const names = new Set();
    const sourceUsers = [...(data.projectUsers || []), ...(projectUsers || [])];
    sourceUsers.forEach((u) => {
      if (u.name) names.add(u.name);
      else if (u.email) names.add(u.email);
    });
    (issues || []).forEach((issue) => {
      if (issue.assignee) {
        issue.assignee.split(',').forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) names.add(trimmed);
        });
      }
    });
    if (names.size === 0) {
      defaultTeamMembers.forEach((m) => names.add(m));
    }
    return Array.from(names).sort();
  }, [data.projectUsers, projectUsers, issues, defaultTeamMembers]);

  const togglePod = (key) => {
    setCollapsedPods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (status === 'loading') return null;
  if (status === 'unavailable') return <DatastoreUnavailableNotice error={error} />;
  if (status === 'no-projects') return <NoProjectsNotice />;
  if (statuses.length === 0)
    return <p className='px-4 py-6 text-sm text-slate-500'>This project has no workflow statuses configured.</p>;

  // Filter out "Backlog" category and status named Backlog from sprint board
  const sprintStatuses = statuses.filter((st) => st.category !== 'backlog' && st.name.toLowerCase() !== 'backlog');

  const availableAssignees = [
    ...new Set(
      issues.flatMap((issue) => (issue.assignee ? issue.assignee.split(',').map((s) => s.trim()) : [])).filter(Boolean)
    )
  ].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filtersActive = Boolean(search || typeFilter || priorityFilter || assigneeFilter);
  const matchesFilters = (issue) => {
    if (typeFilter && issue.type !== typeFilter) return false;
    if (priorityFilter && issue.priority !== priorityFilter) return false;
    if (assigneeFilter === '__unassigned__' && issue.assignee) return false;
    if (assigneeFilter && assigneeFilter !== '__unassigned__' && issue.assignee !== assigneeFilter) return false;
    if (
      normalizedSearch &&
      !issue.key.toLowerCase().includes(normalizedSearch) &&
      !issue.title.toLowerCase().includes(normalizedSearch) &&
      !issue.description?.toLowerCase().includes(normalizedSearch)
    )
      return false;
    return true;
  };

  const activeSprint = sprints.find((sprint) => sprint.state === 'active');
  const activeIssues = issues.filter(
    (issue) => !issue.archivedAt && (!activeSprint || issue.sprintId === activeSprint.id)
  );
  const allParentIssues = activeIssues.filter((issue) => !issue.parentIssueId);
  const subtasksByParent = {};
  issues
    .filter((issue) => issue.parentIssueId && !issue.archivedAt)
    .forEach((subtask) => {
      (subtasksByParent[subtask.parentIssueId] ||= []).push(subtask);
    });
  const parentIssues = filtersActive
    ? allParentIssues.filter(
        (issue) => matchesFilters(issue) || (subtasksByParent[issue.id] || []).some(matchesFilters)
      )
    : allParentIssues;

  const move = async (issue, statusId) => {
    if (statusId === issue.status?.id) return;
    setMoveError(null);
    try {
      await moveIssueStatus(issue, statusId);
    } catch (moveErr) {
      setMoveError(moveErr.message);
    }
  };

  const createSubtask = async (event, parentIssue) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || quickCreateBusy) return;
    setQuickCreateBusy(true);
    setMoveError(null);
    try {
      const subtask = await createIssue({
        projectKey: project.key,
        issueType: 'subtask',
        title,
        priority: 'medium',
        parentIssueId: parentIssue.id
      });
      setQuickTitle('');
      setQuickCreateParent(null);
      if (activeSprint) await moveIssueSprint(subtask, activeSprint.id);
    } catch (createErr) {
      setMoveError(createErr.message);
    } finally {
      setQuickCreateBusy(false);
    }
  };

  return (
    <div className='flex flex-1 flex-col min-h-0 h-full overflow-hidden'>
      <div className='shrink-0 mb-4'>
        {/* Untouched Filters Row: search row + priority + type + Assignee */}
        <Filters
          search={search}
          onSearchChange={setSearch}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          assignee={assigneeFilter}
          onAssigneeChange={setAssigneeFilter}
          availableAssignees={availableAssignees}
        />

        {moveError && (
          <p className='mb-3 rounded-lg border border-rose-300 bg-rose-50 p-2 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'>
            {moveError}
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LAYOUT 1: TREE-RAIL SWIMLANE MATRIX                                      */}
      {/* ========================================================================= */}
      {boardLayout === 'swimlane' && (
        <div
          onScroll={handleBoardScroll}
          className='flex-1 min-h-0 sprint-board-scroll rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm'
        >
          <div style={{ minWidth: `${(1 + sprintStatuses.length) * 16}rem` }}>
            <div
              className='sticky top-0 z-20 grid bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs'
              style={{ gridTemplateColumns: `repeat(${1 + sprintStatuses.length}, minmax(16rem, 1fr))` }}
            >
              <header className='flex items-center justify-between border-r border-slate-200 p-3 dark:border-slate-800 bg-slate-100 dark:bg-slate-900'>
                <strong className='issueboard-swimlane-title text-xs tracking-wider'>Parent issue</strong>
                <span className='inline-flex size-6 items-center justify-center rounded-md bg-slate-300 text-[10px] leading-none dark:bg-slate-800 font-bold'>
                  {parentIssues.length}
                </span>
              </header>
              {sprintStatuses.map((columnStatus) => (
                <header
                  key={columnStatus.id}
                  className='flex items-center justify-between border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-800 bg-slate-100 dark:bg-slate-900'
                >
                  <strong className='issueboard-swimlane-title text-xs tracking-wider'>{columnStatus.name}</strong>
                  <span className='inline-flex size-6 items-center justify-center rounded-md bg-slate-300 text-[10px] leading-none dark:bg-slate-800 font-bold'>
                    {
                      parentIssues
                        .flatMap((parent) => subtasksByParent[parent.id] || [])
                        .filter((subtask) => subtask.status?.id === columnStatus.id).length
                    }
                  </span>
                </header>
              ))}
            </div>

            {parentIssues.length === 0 ? (
              <p className='p-8 text-center text-sm text-slate-500'>
                {filtersActive ? 'No parent issues match these filters.' : 'No parent issues in this sprint.'}
              </p>
            ) : (
              parentIssues.map((issue) => {
                const isBlocked = issue.workState === 'Blocked';
                return (
                  <section
                    key={issue.key}
                    className={`grid border-t transition-colors duration-150 ${
                      isBlocked
                        ? 'blocked-bg border-rose-400/40 dark:border-rose-800/60'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                    }`}
                    style={{ gridTemplateColumns: `repeat(${1 + sprintStatuses.length}, minmax(16rem, 1fr))` }}
                  >
                    <div
                      className={`border-r p-3 transition-colors ${
                        isBlocked
                          ? 'border-rose-300/40 bg-rose-50/40 dark:border-rose-800/40 dark:bg-rose-950/20'
                          : 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60'
                      }`}
                    >
                      <ParentIssueCard
                        issue={toDisplayIssue(issue)}
                        returnTo={returnTo}
                        onStateChange={(workState) => setIssueWorkState(issue, workState)}
                        assigneeOptions={assigneeOptions}
                        onAssigneeChange={(issueToUpdate, newAssignee) =>
                          data.updateIssueAssignee(issueToUpdate, newAssignee)
                        }
                      />
                    </div>
                    {sprintStatuses.map((columnStatus) => {
                      const cellSubtasks = (subtasksByParent[issue.id] || []).filter(
                        (subtask) =>
                          subtask.status?.id === columnStatus.id && (!filtersActive || matchesFilters(subtask))
                      );
                      return (
                        <div
                          key={columnStatus.id}
                          className='min-h-44 border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-800'
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            const subtask = (subtasksByParent[issue.id] || []).find(
                              (entry) => entry.key === dragIssueKey
                            );
                            if (subtask) move(subtask, columnStatus.id);
                            setDragIssueKey(null);
                          }}
                        >
                          {cellSubtasks.map((subtask) => (
                            <BoardCard
                              key={subtask.key}
                              issue={toDisplayIssue(subtask)}
                              returnTo={returnTo}
                              onDragStart={() => setDragIssueKey(subtask.key)}
                              assigneeOptions={assigneeOptions}
                              onAssigneeChange={(issueToUpdate, newAssignee) =>
                                data.updateIssueAssignee(issueToUpdate, newAssignee)
                              }
                            />
                          ))}
                          {columnStatus.id === sprintStatuses[0]?.id &&
                            (quickCreateParent === issue.key ? (
                              <form
                                className='rounded-xl border border-dashed border-slate-400 bg-white p-2 dark:bg-slate-900 mt-2'
                                onSubmit={(event) => createSubtask(event, issue)}
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
                                    disabled={quickCreateBusy}
                                    className='h-6 rounded bg-emerald-700 px-2 text-[10px] font-bold leading-none text-white disabled:opacity-60'
                                  >
                                    Create
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                type='button'
                                onClick={() => {
                                  setQuickTitle('');
                                  setQuickCreateParent(issue.key);
                                }}
                                title={`Add subtask to ${issue.key}`}
                                aria-label={`Add subtask to ${issue.key}`}
                                className='mt-2 inline-flex size-7 items-center justify-center rounded-lg border border-dashed border-slate-300 text-base leading-none text-slate-500 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:hover:border-emerald-400 dark:hover:text-emerald-300'
                              >
                                +
                              </button>
                            ))}
                        </div>
                      );
                    })}
                  </section>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT 3: STORY POD ACCORDIONS                                           */}
      {/* ========================================================================= */}
      {boardLayout === 'accordion' && (
        <div onScroll={handleBoardScroll} className='flex-1 min-h-0 sprint-board-scroll space-y-4 pr-1.5'>
          {parentIssues.length === 0 ? (
            <p className='rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900'>
              {filtersActive ? 'No parent issues match these filters.' : 'No parent issues in this sprint.'}
            </p>
          ) : (
            parentIssues.map((issue) => (
              <StoryPod
                key={issue.key}
                issue={toDisplayIssue(issue)}
                returnTo={returnTo}
                isCollapsed={Boolean(collapsedPods[issue.key])}
                onToggleCollapse={() => togglePod(issue.key)}
                parentSubtasks={subtasksByParent[issue.id] || []}
                sprintStatuses={sprintStatuses}
                filtersActive={filtersActive}
                matchesFilters={matchesFilters}
                dragIssueKey={dragIssueKey}
                setDragIssueKey={setDragIssueKey}
                onMoveSubtask={move}
                quickCreateParent={quickCreateParent}
                setQuickCreateParent={setQuickCreateParent}
                quickTitle={quickTitle}
                setQuickTitle={setQuickTitle}
                onCreateSubtask={createSubtask}
                quickCreateBusy={quickCreateBusy}
                assigneeOptions={assigneeOptions}
                onAssigneeChange={(issueToUpdate, newAssignee) => data.updateIssueAssignee(issueToUpdate, newAssignee)}
                onStateChange={(issueToUpdate, workState) => setIssueWorkState(issueToUpdate, workState)}
              />
            ))
          )}
        </div>
      )}
    </div>
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

const CreateIssueModal = ({ project, onCreate, onClose }) => {
  const [description, setDescription] = useState('\n\n### Checklist\n\n- [ ] ');
  const [title, setTitle] = useState('');
  const [issueType, setIssueType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({ projectKey: project.key, issueType, title, description, priority });
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Could not create the issue.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <form
        onSubmit={submit}
        className='relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900'
      >
        <header className='flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800'>
          <div>
            <span className='text-[10px] text-slate-500'>{project.name}</span>
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
          <label className='grid gap-1.5 text-xs font-bold'>
            Issue type
            <select
              value={issueType}
              onChange={(event) => setIssueType(event.target.value)}
              className='rounded-lg border border-slate-300 bg-transparent p-2.5 font-normal dark:border-slate-700'
            >
              {['task', 'story', 'bug', 'epic', 'feature', 'improvement', 'research'].map((type) => (
                <option key={type} value={type}>
                  {capitalize(type)}
                </option>
              ))}
            </select>
          </label>
          <label className='grid gap-1.5 text-xs font-bold'>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className='rounded-lg border border-slate-300 bg-transparent p-2.5 font-normal dark:border-slate-700'
            >
              {['highest', 'high', 'medium', 'low', 'lowest'].map((level) => (
                <option key={level} value={level}>
                  {capitalize(level)}
                </option>
              ))}
            </select>
          </label>
          <label className='grid gap-1.5 text-xs font-bold sm:col-span-2'>
            Title
            <input
              required
              minLength={3}
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
            <span className='font-normal text-slate-500'>
              Checklist items are not saved yet — this workspace stores the description as Markdown.
            </span>
          </div>
          <div className='rounded-xl border border-dashed border-emerald-400 bg-emerald-50 p-4 text-xs sm:col-span-2 dark:bg-emerald-950/40'>
            <strong>Images will be compressed in your browser</strong>
            <p className='mt-1 text-slate-500'>
              JPEG, PNG, or WebP · target 1 MB / 1920 px · direct upload to private Supabase Storage — coming in a later
              slice.
            </p>
          </div>
          {error && (
            <p
              role='alert'
              className='rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800 sm:col-span-2 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
            >
              {error}
            </p>
          )}
        </div>
        <footer className='flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={submitting}
            className='button disabled:cursor-not-allowed disabled:opacity-60'
          >
            {submitting ? 'Creating…' : 'Create issue'}
          </button>
        </footer>
      </form>
    </div>
  );
};

const IssueboardWorkspace = ({ adminEmail }) => {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const view = validViews.includes(router.query.view) ? router.query.view : 'overview';
  const returnTo = useMemo(() => router.asPath, [router.asPath]);
  const projectKey = typeof router.query.project === 'string' ? router.query.project.toUpperCase() : undefined;
  const data = useIssueboardData(projectKey);

  const [boardLayout, setBoardLayout] = useState(data.project?.sprintBoardLayout || 'swimlane');
  const [layoutError, setLayoutError] = useState(null);

  useEffect(() => {
    if (data.project?.sprintBoardLayout) {
      setBoardLayout(data.project.sprintBoardLayout);
    }
  }, [data.project?.sprintBoardLayout]);

  const handleSwitchLayout = useCallback(
    async (newLayout) => {
      if (newLayout === boardLayout) return;
      const previousLayout = boardLayout;
      setBoardLayout(newLayout);
      setLayoutError(null);
      try {
        await data.setSprintBoardLayout?.(newLayout);
      } catch (layoutErr) {
        setBoardLayout(previousLayout);
        setLayoutError(layoutErr.message || 'Could not save the board layout.');
      }
    },
    [boardLayout, data]
  );

  const activeSprint = useMemo(() => {
    return (data.sprints || []).find((s) => s.state === 'active');
  }, [data.sprints]);

  const pageTitle = useMemo(() => {
    if (view === 'board') {
      return activeSprint?.name || 'Sprint 1';
    }
    return viewTitles[view];
  }, [view, activeSprint]);

  const pageSubtitle = useMemo(() => {
    if (view === 'board' && activeSprint?.endsAt) {
      return `${daysRemaining(activeSprint.endsAt)} days remaining`;
    }
    return null;
  }, [view, activeSprint]);

  const headerActions = useMemo(() => {
    if (view !== 'board') return null;
    return (
      <div className='flex items-center gap-2'>
        {/* Dual Layout Switcher (Clean icon buttons with tooltip) */}
        <div className='flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800 shadow-2xs'>
          <button
            type='button'
            onClick={() => handleSwitchLayout('swimlane')}
            className={`flex size-8 items-center justify-center rounded-md transition ${
              boardLayout === 'swimlane'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
            title='Swimlane Matrix'
            aria-label='Swimlane Matrix'
          >
            <FiColumns className='size-4' />
          </button>
          <button
            type='button'
            onClick={() => handleSwitchLayout('accordion')}
            className={`flex size-8 items-center justify-center rounded-md transition ${
              boardLayout === 'accordion'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
            title='Story Pod Accordions'
            aria-label='Story Pod Accordions'
          >
            <FiLayers className='size-4' />
          </button>
        </div>

        {layoutError && (
          <button
            type='button'
            onClick={() => setLayoutError(null)}
            className='max-w-[12rem] truncate rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
            title={`${layoutError} (click to dismiss)`}
          >
            {layoutError}
          </button>
        )}

        {/* Sprint details button */}
        <button
          type='button'
          className='flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition shadow-2xs'
          title='Sprint details'
          aria-label='Sprint details'
        >
          <FiInfo className='size-4' />
        </button>

        {/* Complete sprint button */}
        {activeSprint && (
          <button
            type='button'
            onClick={() => data.completeSprint?.(activeSprint.id, null)}
            className='flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition shadow-2xs'
            title='Complete sprint'
            aria-label='Complete sprint'
          >
            <FiCheckCircle className='size-4' />
          </button>
        )}
      </div>
    );
  }, [view, boardLayout, activeSprint, data, handleSwitchLayout, layoutError]);

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
      currentProject={data.project}
      projects={data.projects}
      title={pageTitle}
      subtitle={pageSubtitle}
      headerActions={headerActions}
      onCreate={() => data.project && setCreateOpen(true)}
    >
      {view === 'overview' && <Overview returnTo={returnTo} data={data} />}
      {view === 'backlog' && (
        <Backlog returnTo={returnTo} data={data} onCreateIssue={() => data.project && setCreateOpen(true)} />
      )}
      {view === 'board' && (
        <Board
          returnTo={returnTo}
          data={data}
          moveIssueStatus={data.moveIssueStatus}
          setIssueWorkState={data.setIssueWorkState}
          boardLayout={boardLayout}
        />
      )}
      {view === 'reports' && <ReportsView project={data.project} />}
      {view === 'projects' && <ProjectsView />}
      {view === 'integrations' && <IntegrationsHealthView />}
      {view === 'settings' && data.project && (
        <ProjectSettingsView
          project={data.project}
          onProjectUpdated={data.reload}
          onProjectArchived={() => {
            data.reload();
            router.push('/admin/issues?view=projects');
          }}
        />
      )}
      {!['overview', 'backlog', 'board', 'reports', 'projects', 'integrations', 'settings'].includes(view) && (
        <PlaceholderView view={view} />
      )}
      {createOpen && data.project && (
        <CreateIssueModal project={data.project} onCreate={data.createIssue} onClose={() => setCreateOpen(false)} />
      )}
    </IssueboardShell>
  );
};

export default IssueboardWorkspace;
