import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiBookmark,
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiChevronDown,
  FiColumns,
  FiEdit2,
  FiExternalLink,
  FiGitBranch,
  FiImage,
  FiInfo,
  FiLayers,
  FiList,
  FiMoreHorizontal,
  FiSearch,
  FiSidebar,
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

const formatSprintDates = (startsAt, endsAt) => {
  if (!startsAt && !endsAt) return 'Dates not planned';
  const options = { month: 'short', day: 'numeric' };
  const startStr = startsAt ? new Date(startsAt).toLocaleDateString(undefined, options) : null;
  const endStr = endsAt ? new Date(endsAt).toLocaleDateString(undefined, { ...options, year: 'numeric' }) : null;
  if (startStr && endStr) return `${startStr} – ${endStr}`;
  return startStr ? `Starts ${startStr}` : `Ends ${endStr}`;
};

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
  issueType: issue.issueType || issue.type,
  parentIssueId: issue.parentIssueId,
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
      className='rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900'
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
      className='rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900'
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
      className='rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900'
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
      className='rounded-lg border border-slate-200 bg-slate-50 pl-2.5 pr-7 py-1 text-[11px] font-medium min-w-[6.5rem] dark:border-slate-800 dark:bg-slate-900'
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

const SprintSwitcherDropdown = ({ sprints = [], currentSprintId, issues = [], onSelectSprint }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  const activeSprints = sprints.filter((s) => s.state === 'active');
  const plannedSprints = sprints.filter((s) => s.state === 'planned');
  const closedSprints = sprints.filter((s) => s.state === 'closed');

  const currentSprint =
    sprints.find((s) => s.id === currentSprintId) || activeSprints[0] || plannedSprints[0] || sprints[0];

  const getSprintPoints = (sprintId) => {
    return issues
      .filter((i) => i.sprintId === sprintId && !i.archivedAt)
      .reduce((acc, i) => acc + (Number(i.estimate ?? i.storyPoints) || 0), 0);
  };

  const getSprintIssueCount = (sprintId) => {
    return issues.filter((i) => i.sprintId === sprintId && !i.archivedAt).length;
  };

  if (!currentSprint && sprints.length === 0) return null;

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 shadow-2xs transition'
        aria-haspopup='true'
        aria-expanded={open}
      >
        <span className='flex items-center gap-1.5'>
          {currentSprint?.state === 'active' && <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />}
          {currentSprint?.state === 'planned' && <span className='size-2 rounded-full bg-amber-500' />}
          {currentSprint?.state === 'closed' && <span className='size-2 rounded-full bg-purple-500' />}
          <span className='font-bold text-slate-900 dark:text-slate-100 max-w-[9rem] truncate'>
            {currentSprint?.name || 'Select Sprint'}
          </span>
        </span>

        {currentSprint?.state === 'active' && currentSprint.endsAt && (
          <span className='hidden sm:inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono'>
            {daysRemaining(currentSprint.endsAt)}d left
          </span>
        )}
        {currentSprint?.state === 'planned' && (
          <span className='hidden sm:inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'>
            Planned
          </span>
        )}
        {currentSprint?.state === 'closed' && (
          <span className='hidden sm:inline-block rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'>
            Archived
          </span>
        )}

        <FiChevronDown className={`size-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className='absolute left-0 mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 dark:border-slate-800 dark:bg-slate-900 text-xs'>
          <div className='max-h-80 overflow-y-auto space-y-2.5 custom-scrollbar pr-1'>
            {/* Active Sprints */}
            {activeSprints.length > 0 && (
              <div>
                <div className='flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider'>
                  <span className='size-1.5 rounded-full bg-emerald-500' />
                  <span>Active Sprint</span>
                </div>
                {activeSprints.map((s) => {
                  const isSelected = s.id === currentSprint?.id;
                  const pts = getSprintPoints(s.id);
                  const count = getSprintIssueCount(s.id);
                  return (
                    <button
                      key={s.id}
                      type='button'
                      onClick={() => {
                        onSelectSprint(s.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left rounded-xl p-2 transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className='min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-slate-800 dark:text-slate-100 truncate'>{s.name}</span>
                          {isSelected && <span className='text-[10px] text-emerald-600 font-bold'>✓</span>}
                        </div>
                        <div className='text-[10px] text-slate-500 dark:text-slate-400'>
                          {formatSprintDates(s.startsAt, s.endsAt)}
                          {s.endsAt ? ` • ${daysRemaining(s.endsAt)}d left` : ''}
                        </div>
                      </div>
                      <div className='text-right shrink-0'>
                        <div className='font-mono font-bold text-slate-700 dark:text-slate-300'>{pts} pts</div>
                        <div className='text-[10px] text-slate-400'>{count} issues</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Planned Sprints */}
            {plannedSprints.length > 0 && (
              <div>
                <div className='flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider'>
                  <span className='size-1.5 rounded-full bg-amber-500' />
                  <span>Upcoming / Planned ({plannedSprints.length})</span>
                </div>
                {plannedSprints.map((s) => {
                  const isSelected = s.id === currentSprint?.id;
                  const pts = getSprintPoints(s.id);
                  const count = getSprintIssueCount(s.id);
                  return (
                    <button
                      key={s.id}
                      type='button'
                      onClick={() => {
                        onSelectSprint(s.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left rounded-xl p-2 transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-50 border border-amber-300 dark:bg-amber-950/50 dark:border-amber-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className='min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-slate-800 dark:text-slate-100 truncate'>{s.name}</span>
                          {isSelected && <span className='text-[10px] text-amber-600 font-bold'>✓</span>}
                        </div>
                        <div className='text-[10px] text-slate-500 dark:text-slate-400'>
                          {formatSprintDates(s.startsAt, s.endsAt)}
                        </div>
                      </div>
                      <div className='text-right shrink-0'>
                        <div className='font-mono font-bold text-slate-700 dark:text-slate-300'>{pts} pts</div>
                        <div className='text-[10px] text-slate-400'>{count} issues</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Closed Sprints */}
            {closedSprints.length > 0 && (
              <div>
                <div className='flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider'>
                  <span className='size-1.5 rounded-full bg-purple-500' />
                  <span>Completed Sprints ({closedSprints.length})</span>
                </div>
                {closedSprints.map((s) => {
                  const isSelected = s.id === currentSprint?.id;
                  const pts = getSprintPoints(s.id);
                  const count = getSprintIssueCount(s.id);
                  return (
                    <button
                      key={s.id}
                      type='button'
                      onClick={() => {
                        onSelectSprint(s.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left rounded-xl p-2 transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-purple-50 border border-purple-300 dark:bg-purple-950/50 dark:border-purple-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className='min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-slate-800 dark:text-slate-100 truncate'>{s.name}</span>
                          {isSelected && <span className='text-[10px] text-purple-600 font-bold'>✓</span>}
                          <span className='rounded bg-slate-100 dark:bg-slate-800 px-1 text-[9px] text-slate-500 font-medium'>
                            Archived
                          </span>
                        </div>
                        <div className='text-[10px] text-slate-500 dark:text-slate-400'>
                          {formatSprintDates(s.startsAt, s.endsAt)}
                        </div>
                      </div>
                      <div className='text-right shrink-0'>
                        <div className='font-mono font-bold text-slate-700 dark:text-slate-300'>{pts} pts</div>
                        <div className='text-[10px] text-slate-400'>{count} issues</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CompactSprintCard = ({ sprint, issues = [], onOpenBoard, onStart, onComplete }) => {
  const [starting, setStarting] = useState(false);
  const sprintIssues = issues.filter((iss) => iss.sprintId === sprint.id && !iss.archivedAt);

  const typeCounts = {
    story: 0,
    task: 0,
    bug: 0,
    epic: 0,
    other: 0
  };

  sprintIssues.forEach((iss) => {
    const t = (iss.issueType || iss.type || 'task').toLowerCase();
    if (t.includes('story')) typeCounts.story++;
    else if (t.includes('bug')) typeCounts.bug++;
    else if (t.includes('task') || t.includes('subtask')) typeCounts.task++;
    else if (t.includes('epic')) typeCounts.epic++;
    else typeCounts.other++;
  });

  const totalPoints = sprintIssues.reduce((sum, iss) => sum + (Number(iss.estimate ?? iss.storyPoints) || 0), 0);
  const doneCount = sprintIssues.filter((iss) => {
    const statusName =
      iss.status?.name?.toLowerCase?.() || (typeof iss.status === 'string' ? iss.status.toLowerCase() : '');
    const category = iss.status?.category?.toLowerCase?.() || '';
    return category === 'done' || statusName === 'done';
  }).length;
  const percentDone = sprintIssues.length > 0 ? Math.round((doneCount / sprintIssues.length) * 100) : 0;

  const isActive = sprint.state === 'active';
  const isPlanned = sprint.state === 'planned';

  return (
    <div
      onClick={() => onOpenBoard(sprint.id)}
      className={`group relative rounded-2xl border p-3.5 shadow-xs transition hover:shadow-md cursor-pointer ${
        isActive
          ? 'border-emerald-400/80 bg-white dark:border-emerald-800/80 dark:bg-slate-900'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
      }`}
    >
      {/* Top status line */}
      <div className='flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60'>
        <div className='flex items-center gap-1.5'>
          {isActive ? (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-800'>
              <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
              Active Sprint
            </span>
          ) : (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800'>
              ⏳ Upcoming
            </span>
          )}
        </div>
        {isActive && sprint.endsAt ? (
          <span className='text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono'>
            {daysRemaining(sprint.endsAt)}d left
          </span>
        ) : (
          <span className='text-[10px] font-mono text-slate-400'>{sprintIssues.length} issues</span>
        )}
      </div>

      {/* Sprint Name and points */}
      <div className='pt-2 flex items-center justify-between gap-2'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onOpenBoard(sprint.id);
          }}
          className='font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5 text-left'
        >
          <span className='truncate'>{sprint.name}</span>
          <FiExternalLink className='size-3 text-slate-400 group-hover:text-emerald-500 transition shrink-0' />
        </button>
        <span className='font-mono text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0'>
          {totalPoints} pts
        </span>
      </div>

      {/* Planned Dates */}
      <div className='flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1'>
        <FiCalendar className='size-3 shrink-0' />
        <span className='truncate'>{formatSprintDates(sprint.startsAt, sprint.endsAt)}</span>
      </div>

      {/* Goal if any */}
      {sprint.goal && (
        <p className='text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 truncate'>
          &ldquo;{sprint.goal}&rdquo;
        </p>
      )}

      {/* Task Types breakdown: icon + count only, hover reveals what it is */}
      <div className='flex flex-wrap items-center gap-1.5 pt-2.5'>
        {typeCounts.story > 0 && (
          <span
            className='inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 cursor-default shadow-2xs'
            title={`${typeCounts.story} ${typeCounts.story === 1 ? 'User Story' : 'User Stories'}`}
          >
            <FiBookmark className='size-3 text-emerald-600 dark:text-emerald-400 shrink-0' />
            <span className='font-mono leading-none'>{typeCounts.story}</span>
          </span>
        )}
        {typeCounts.task > 0 && (
          <span
            className='inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 cursor-default shadow-2xs'
            title={`${typeCounts.task} ${typeCounts.task === 1 ? 'Task' : 'Tasks'}`}
          >
            <FiCheckSquare className='size-3 text-blue-600 dark:text-blue-400 shrink-0' />
            <span className='font-mono leading-none'>{typeCounts.task}</span>
          </span>
        )}
        {typeCounts.bug > 0 && (
          <span
            className='inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 cursor-default shadow-2xs'
            title={`${typeCounts.bug} ${typeCounts.bug === 1 ? 'Bug' : 'Bugs'}`}
          >
            <FaBug className='size-3 text-rose-600 dark:text-rose-400 shrink-0' />
            <span className='font-mono leading-none'>{typeCounts.bug}</span>
          </span>
        )}
        {typeCounts.epic > 0 && (
          <span
            className='inline-flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 cursor-default shadow-2xs'
            title={`${typeCounts.epic} ${typeCounts.epic === 1 ? 'Epic' : 'Epics'}`}
          >
            <FiZap className='size-3 text-purple-600 dark:text-purple-400 shrink-0' />
            <span className='font-mono leading-none'>{typeCounts.epic}</span>
          </span>
        )}
        {typeCounts.other > 0 && (
          <span
            className='inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-xs font-bold text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/80 cursor-default shadow-2xs'
            title={`${typeCounts.other} ${typeCounts.other === 1 ? 'Subtask / Other' : 'Subtasks / Other'}`}
          >
            <FiLayers className='size-3 text-cyan-600 dark:text-cyan-400 shrink-0' />
            <span className='font-mono leading-none'>{typeCounts.other}</span>
          </span>
        )}
        {sprintIssues.length === 0 && <span className='text-[10px] text-slate-400 italic'>No tickets committed</span>}
      </div>

      {/* Progress Bar for Active Sprint */}
      {isActive && sprintIssues.length > 0 && (
        <div className='pt-2.5 space-y-1'>
          <div className='flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400'>
            <span>
              Completed ({doneCount}/{sprintIssues.length})
            </span>
            <span className='font-bold text-emerald-600 dark:text-emerald-400'>{percentDone}%</span>
          </div>
          <div className='h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800'>
            <div
              className='h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300'
              style={{ width: `${percentDone}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer quick action */}
      <div className='flex items-center justify-between gap-2'>
        {isPlanned && onStart && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              setStarting((prev) => !prev);
            }}
            className='rounded-lg bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-emerald-500 transition'
          >
            {starting ? 'Cancel' : 'Start Sprint'}
          </button>
        )}
      </div>

      {starting && onStart && (
        <div className='mt-2 pt-2 border-t border-slate-100 dark:border-slate-800' onClick={(e) => e.stopPropagation()}>
          <StartSprintForm
            onStart={(input) => {
              onStart(input);
              setStarting(false);
            }}
            onClose={() => setStarting(false)}
          />
        </div>
      )}
    </div>
  );
};

const BacklogSprintSidebar = ({
  sprints = [],
  issues = [],
  onOpenBoard,
  onCreateSprint,
  onStartSprint,
  onCompleteSprint
}) => {
  const activeSprints = sprints.filter((s) => s.state === 'active');
  const plannedSprints = sprints.filter((s) => s.state === 'planned');
  const closedSprints = sprints.filter((s) => s.state === 'closed');
  const [showPast, setShowPast] = useState(false);

  return (
    <aside className='w-full lg:w-80 shrink-0 space-y-3.5'>
      {/* Sidebar Header */}
      <div className='flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800'>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full bg-emerald-500' />
          <h3 className='text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider'>
            Sprints Overview
          </h3>
        </div>
        <button
          type='button'
          onClick={onCreateSprint}
          className='text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-400'
        >
          + New Sprint
        </button>
      </div>

      {/* Sprints Cards list */}
      <div className='space-y-2.5'>
        {activeSprints.map((sprint) => (
          <CompactSprintCard
            key={sprint.id}
            sprint={sprint}
            issues={issues}
            onOpenBoard={onOpenBoard}
            onComplete={onCompleteSprint}
          />
        ))}

        {plannedSprints.map((sprint) => (
          <CompactSprintCard
            key={sprint.id}
            sprint={sprint}
            issues={issues}
            onOpenBoard={onOpenBoard}
            onStart={(input) => onStartSprint(sprint.id, input)}
          />
        ))}

        {activeSprints.length === 0 && plannedSprints.length === 0 && (
          <div className='rounded-2xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'>
            <p className='text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium'>No active or planned sprints.</p>
            <button
              type='button'
              onClick={onCreateSprint}
              className='button text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-3'
            >
              + Create Sprint
            </button>
          </div>
        )}
      </div>

      {/* Past Sprints Section */}
      {closedSprints.length > 0 && (
        <div className='pt-2 border-t border-slate-200/80 dark:border-slate-800/80'>
          <button
            type='button'
            onClick={() => setShowPast((prev) => !prev)}
            className='flex w-full items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-1'
          >
            <span>Past Sprints ({closedSprints.length})</span>
            <span className='text-[10px]'>{showPast ? '▲' : '▼'}</span>
          </button>
          {showPast && (
            <div className='space-y-2 pt-1'>
              {closedSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  onClick={() => onOpenBoard(sprint.id)}
                  className='rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 cursor-pointer transition'
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-bold text-slate-700 dark:text-slate-300'>{sprint.name}</span>
                    <span className='text-[10px] text-purple-600 dark:text-purple-400 font-semibold'>Archived</span>
                  </div>
                  <div className='flex items-center justify-between text-[10px] text-slate-400 pt-1'>
                    <span>{formatSprintDates(sprint.startsAt, sprint.endsAt)}</span>
                    <span className='text-emerald-600 hover:underline dark:text-emerald-400 font-semibold'>
                      View on Board →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

const BacklogIssueRow = ({ issue, sprints, returnTo, onMoveSprint, isChild = false }) => {
  const currentSprint = sprints.find((s) => s.id === issue.sprintId);
  const sprintLabel = currentSprint?.name || 'Backlog';

  return (
    <div
      key={issue.key}
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition ${
        isChild
          ? 'border-slate-200/80 bg-slate-50/60 hover:border-purple-300 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:border-purple-800'
          : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/50 dark:hover:border-slate-700'
      }`}
    >
      <div className='flex items-center gap-2.5 min-w-0 flex-1'>
        <TypeIcon type={issue.type} />
        <Link
          href={issueHref(issue.key, returnTo)}
          className='w-20 shrink-0 font-mono font-bold text-slate-600 hover:underline dark:text-slate-400'
        >
          {issue.key}
        </Link>
        <span className='truncate font-medium text-slate-800 dark:text-slate-200' title={issue.title}>
          {issue.title}
        </span>
      </div>
      <div className='flex items-center gap-2.5 shrink-0'>
        <span
          title={sprintLabel}
          className={`w-24 shrink-0 text-center truncate inline-flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
            issue.sprintId
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {sprintLabel}
        </span>
        <select
          value={issue.sprintId || ''}
          onChange={(e) => onMoveSprint(issue, e.target.value || null)}
          aria-label={`Move ${issue.key} to sprint`}
          className='w-28 shrink-0 rounded-lg border border-slate-200 bg-white pl-2 pr-6 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 truncate'
        >
          <option value=''>Backlog</option>
          {sprints.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>
        <span className={`w-16 shrink-0 text-center text-[10px] font-bold ${priorityClass(issue.priority)}`}>
          {issue.priority}
        </span>
        <span className='w-14 shrink-0 text-center px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
          {issue.estimate ?? issue.storyPoints ?? 0} pts
        </span>
      </div>
    </div>
  );
};

const BacklogEpicTree = ({
  projectKey,
  issues,
  allIssues,
  sprints,
  returnTo,
  onMoveSprint,
  onCreateIssue,
  onUpdateIssue,
  onCreateIssueModal
}) => {
  const epics = useMemo(() => {
    return allIssues.filter(
      (iss) => (iss.issueType === 'epic' || iss.type?.toLowerCase() === 'epic') && !iss.archivedAt
    );
  }, [allIssues]);

  const [collapsedEpics, setCollapsedEpics] = useState({});
  const [creatingEpic, setCreatingEpic] = useState(false);
  const [epicTitle, setEpicTitle] = useState('');
  const [epicDescription, setEpicDescription] = useState('');
  const [epicError, setEpicError] = useState(null);
  const [submittingEpic, setSubmittingEpic] = useState(false);

  const [editingEpicId, setEditingEpicId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('high');
  const [savingEpic, setSavingEpic] = useState(false);
  const [editError, setEditError] = useState(null);

  const [activeChildInputFor, setActiveChildInputFor] = useState(null);
  const [childTitle, setChildTitle] = useState('');
  const [submittingChild, setSubmittingChild] = useState(false);

  const toggleEpic = (epicId) => {
    setCollapsedEpics((prev) => ({ ...prev, [epicId]: !prev[epicId] }));
  };

  const startEditEpic = (epic) => {
    setEditingEpicId(epic.id);
    setEditTitle(epic.title || '');
    setEditDescription(epic.description || '');
    setEditPriority((epic.rawPriority || epic.priority || 'high').toLowerCase());
    setEditError(null);
  };

  const cancelEditEpic = () => {
    setEditingEpicId(null);
    setEditError(null);
  };

  const handleSaveEpic = async (epic) => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setEditError('Epic title must be at least 3 characters.');
      return;
    }
    setSavingEpic(true);
    setEditError(null);
    try {
      if (onUpdateIssue) {
        await onUpdateIssue(epic, {
          title: trimmedTitle,
          description: editDescription.trim(),
          priority: editPriority
        });
      }
      setEditingEpicId(null);
    } catch (err) {
      console.error('Failed to update epic:', err);
      setEditError(err.message || 'Failed to update epic.');
    } finally {
      setSavingEpic(false);
    }
  };

  const handleCreateEpic = async (e) => {
    e.preventDefault();
    const title = epicTitle.trim();
    if (!title || submittingEpic) return;
    if (title.length < 3) {
      setEpicError('Epic title must be at least 3 characters.');
      return;
    }
    setEpicError(null);
    setSubmittingEpic(true);
    try {
      await onCreateIssue({
        projectKey,
        title,
        description: epicDescription.trim(),
        issueType: 'epic',
        priority: 'high'
      });
      setEpicTitle('');
      setEpicDescription('');
      setCreatingEpic(false);
    } catch (err) {
      console.error('Failed to create epic:', err);
      setEpicError(err.message || 'Failed to create epic.');
    } finally {
      setSubmittingEpic(false);
    }
  };

  const handleCreateChild = async (e, epic) => {
    e.preventDefault();
    const title = childTitle.trim();
    if (!title || title.length < 3 || submittingChild) return;
    setSubmittingChild(true);
    try {
      await onCreateIssue({
        projectKey: projectKey || epic.key?.split('-')[0],
        title,
        parentIssueId: epic.id,
        issueType: 'task',
        priority: 'medium'
      });
      setChildTitle('');
      setActiveChildInputFor(null);
    } catch (err) {
      console.error('Failed to create child issue:', err);
    } finally {
      setSubmittingChild(false);
    }
  };

  const epicIdSet = useMemo(() => new Set(epics.map((e) => e.id)), [epics]);

  const unassignedIssues = useMemo(() => {
    return issues.filter(
      (iss) =>
        (!iss.parentIssueId || !epicIdSet.has(iss.parentIssueId)) &&
        iss.issueType !== 'epic' &&
        iss.type?.toLowerCase() !== 'epic'
    );
  }, [issues, epicIdSet]);

  return (
    <div className='space-y-4'>
      {/* Top Action Bar for Epics */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='size-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 font-bold grid place-items-center text-xs'>
            👑
          </span>
          <span className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
            Epics & Themes ({epics.length})
          </span>
        </div>
        {!creatingEpic && (
          <button
            type='button'
            onClick={() => setCreatingEpic(true)}
            className='rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 transition shadow-2xs'
          >
            + New Epic
          </button>
        )}
      </div>

      {/* Inline Quick Epic Creator */}
      {creatingEpic && (
        <form
          onSubmit={handleCreateEpic}
          className='rounded-2xl border border-dashed border-purple-400 bg-purple-50/40 p-4 dark:border-purple-800 dark:bg-purple-950/30 space-y-2'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='size-5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold grid place-items-center text-[10px]'>
                👑
              </span>
              <strong className='text-xs text-slate-800 dark:text-slate-200'>Create New Epic</strong>
            </div>
            <button
              type='button'
              onClick={() => onCreateIssueModal?.({ issueType: 'epic' })}
              className='text-[11px] text-purple-600 hover:underline dark:text-purple-400'
            >
              Open full modal →
            </button>
          </div>
          <div className='space-y-1.5'>
            <input
              autoFocus
              value={epicTitle}
              onChange={(e) => setEpicTitle(e.target.value)}
              placeholder='Epic title (e.g. Realtime Collaboration Engine)…'
              className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-purple-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            />
            <input
              value={epicDescription}
              onChange={(e) => setEpicDescription(e.target.value)}
              placeholder='Strategic goal or milestone description (optional)…'
              className='w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            />
          </div>
          {epicError && <p className='text-xs font-semibold text-rose-600 dark:text-rose-400'>{epicError}</p>}
          <div className='flex items-center gap-2 pt-1'>
            <button
              type='submit'
              disabled={submittingEpic || !epicTitle.trim()}
              className='button text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60'
            >
              {submittingEpic ? 'Creating…' : 'Create Epic'}
            </button>
            <button
              type='button'
              onClick={() => {
                setCreatingEpic(false);
                setEpicError(null);
              }}
              className='rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800'
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {epics.length === 0 && !creatingEpic && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20'>
          <div className='flex items-center gap-2.5'>
            <span className='size-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 font-bold grid place-items-center text-xs'>
              👑
            </span>
            <div>
              <h4 className='text-xs font-bold text-slate-800 dark:text-slate-200'>No Epics Created Yet</h4>
              <p className='text-[11px] text-slate-500 dark:text-slate-400'>
                Group your backlog tickets under parent Epics to visualize quarterly milestone progress and child issue
                rollups.
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setCreatingEpic(true)}
            className='rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-500 transition'
          >
            + Create Epic
          </button>
        </div>
      )}

      {/* Render Each Epic Group */}
      {epics.map((epic) => {
        const isCollapsed = Boolean(collapsedEpics[epic.id]);
        const children = allIssues.filter(
          (iss) => (iss.parentIssueId === epic.id || iss.parentIssueId === epic.key) && iss.id !== epic.id
        );
        const doneCount = children.filter(
          (c) => c.status === 'Done' || c.status?.category === 'done' || c.status?.name?.toLowerCase() === 'done'
        ).length;
        const totalPoints = children.reduce((sum, c) => sum + (Number(c.estimate ?? c.storyPoints) || 0), 0);
        const percent = children.length > 0 ? Math.round((doneCount / children.length) * 100) : 0;
        const isAddingChild = activeChildInputFor === epic.id;
        const isEditing = editingEpicId === epic.id;

        return (
          <div
            key={epic.id}
            className='rounded-2xl border border-purple-300/60 bg-white p-4 shadow-sm dark:border-purple-900/40 dark:bg-slate-900/90'
          >
            {/* Epic Header Row or Inline Editor */}
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEpic(epic);
                }}
                className='pb-3 border-b border-purple-200 dark:border-purple-900/60 space-y-2'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <span className='size-5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold grid place-items-center text-[10px]'>
                      👑
                    </span>
                    <span className='font-mono text-xs font-bold text-purple-700 dark:text-purple-300'>
                      Edit {epic.key}
                    </span>
                  </div>
                  <Link
                    href={issueHref(epic.key, returnTo)}
                    className='text-[11px] text-purple-600 hover:underline dark:text-purple-400'
                  >
                    Open full details →
                  </Link>
                </div>
                <div className='space-y-1.5'>
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder='Epic title…'
                    className='w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-purple-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                  />
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder='Epic milestone description (optional)…'
                    className='w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  />
                </div>
                <div className='flex flex-wrap items-center justify-between gap-2 pt-1'>
                  <div className='flex items-center gap-2'>
                    <label className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>Priority:</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className='rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    >
                      <option value='highest'>Highest</option>
                      <option value='high'>High</option>
                      <option value='medium'>Medium</option>
                      <option value='low'>Low</option>
                      <option value='lowest'>Lowest</option>
                    </select>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      type='submit'
                      disabled={savingEpic || !editTitle.trim()}
                      className='button text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60 py-1'
                    >
                      {savingEpic ? 'Saving…' : 'Save Epic'}
                    </button>
                    <button
                      type='button'
                      onClick={cancelEditEpic}
                      className='rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {editError && <p className='text-xs font-semibold text-rose-600 dark:text-rose-400'>{editError}</p>}
              </form>
            ) : (
              <div className='flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80'>
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                  <button
                    type='button'
                    onClick={() => toggleEpic(epic.id)}
                    className='text-purple-600 dark:text-purple-400 text-xs font-bold hover:scale-110 transition shrink-0'
                    title={isCollapsed ? 'Expand Epic' : 'Collapse Epic'}
                  >
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <span className='size-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 font-bold grid place-items-center text-xs shrink-0'>
                    👑
                  </span>
                  <div className='min-w-0 flex flex-col justify-center leading-tight'>
                    <div className='flex items-center gap-2 truncate leading-snug'>
                      <Link
                        href={issueHref(epic.key, returnTo)}
                        className='font-mono text-xs font-bold text-purple-700 hover:underline dark:text-purple-400 shrink-0'
                      >
                        {epic.key}
                      </Link>
                      <span className='truncate text-xs font-bold text-slate-900 dark:text-slate-100'>
                        {epic.title}
                      </span>
                      <span className='hidden sm:inline-flex rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0'>
                        EPIC
                      </span>
                      <button
                        type='button'
                        onClick={() => startEditEpic(epic)}
                        title='Edit Epic title & description'
                        className='p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 rounded transition shrink-0'
                      >
                        <FiEdit2 className='size-3' />
                      </button>
                    </div>
                    {epic.description && (
                      <p className='truncate text-[11px] text-slate-500 dark:text-slate-400 leading-tight max-w-xl mt-0.5'>
                        {epic.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rollup Progress Meter & Quick Add */}
                <div className='flex items-center gap-3 shrink-0'>
                  <div className='w-28 sm:w-36'>
                    <div className='flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1'>
                      <span>Rollup</span>
                      <span className='font-bold text-purple-600 dark:text-purple-400'>
                        {percent}% ({doneCount}/{children.length})
                      </span>
                    </div>
                    <div className='h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800'>
                      <div
                        className='h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300'
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      setActiveChildInputFor((prev) => (prev === epic.id ? null : epic.id));
                      setChildTitle('');
                    }}
                    className='text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400'
                  >
                    {isAddingChild ? 'Cancel' : '+ Add Issue'}
                  </button>
                </div>
              </div>
            )}

            {/* Tree Rail & Child Issues */}
            {!isCollapsed && (
              <div className='pl-5 border-l-2 border-purple-500/20 dark:border-purple-500/30 space-y-2 mt-3 ml-3'>
                {/* Inline Child Issue Creator */}
                {isAddingChild && (
                  <form
                    onSubmit={(e) => handleCreateChild(e, epic)}
                    className='flex items-center gap-2 rounded-xl border border-dashed border-purple-400 bg-purple-50/30 p-2 dark:border-purple-800 dark:bg-purple-950/20'
                  >
                    <input
                      autoFocus
                      value={childTitle}
                      onChange={(e) => setChildTitle(e.target.value)}
                      placeholder={`New issue in ${epic.key} (press Enter to create)…`}
                      className='flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                    />
                    <button
                      type='submit'
                      disabled={submittingChild || !childTitle.trim()}
                      className='button text-xs font-bold disabled:opacity-60 shrink-0'
                    >
                      {submittingChild ? 'Adding…' : 'Add'}
                    </button>
                    <button
                      type='button'
                      onClick={() => onCreateIssueModal?.({ parentIssueId: epic.id })}
                      className='text-[10px] text-purple-600 hover:underline dark:text-purple-400 whitespace-nowrap px-1'
                      title='Open full modal with this epic linked'
                    >
                      Modal →
                    </button>
                    <button
                      type='button'
                      onClick={() => setActiveChildInputFor(null)}
                      className='text-slate-400 hover:text-slate-600 text-xs px-1'
                    >
                      ✕
                    </button>
                  </form>
                )}

                {children.length === 0 && !isAddingChild ? (
                  <p className='text-xs text-slate-400 italic py-1'>
                    No child issues linked to this epic yet. Click &quot;+ Add Issue&quot; above to create one.
                  </p>
                ) : (
                  <>
                    <div className='hidden sm:flex items-center justify-between px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400'></div>
                    {children.map((child) => (
                      <BacklogIssueRow
                        key={child.key}
                        issue={child}
                        sprints={sprints}
                        returnTo={returnTo}
                        onMoveSprint={onMoveSprint}
                        isChild
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* General Backlog / Unassigned to Epic */}
      {unassignedIssues.length > 0 && (
        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800'>
            <div className='flex items-center gap-2'>
              <span className='size-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 font-bold grid place-items-center text-xs'>
                📦
              </span>
              <h3 className='text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider'>
                General Backlog Reservoir ({unassignedIssues.length} issues)
              </h3>
            </div>
            <button
              type='button'
              onClick={() => onCreateIssueModal?.({ parentIssueId: '' })}
              className='text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400'
            >
              + Create Issue
            </button>
          </div>

          <div className='space-y-1.5'>
            {unassignedIssues.map((issue) => (
              <BacklogIssueRow
                key={issue.key}
                issue={issue}
                sprints={sprints}
                returnTo={returnTo}
                onMoveSprint={onMoveSprint}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BacklogHighDensity = ({
  issues,
  sprints,
  returnTo,
  availableAssignees = [],
  onMoveSprint,
  onBatchMoveSprint,
  onBatchAssign,
  onCreateIssue
}) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  // Guarantee no epics are ever shown in Backlog Linear Terminal
  const terminalIssues = useMemo(() => {
    return issues.filter((iss) => iss.issueType !== 'epic' && iss.type?.toLowerCase() !== 'epic');
  }, [issues]);

  const allSelected = terminalIssues.length > 0 && selectedKeys.size === terminalIssues.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(terminalIssues.map((i) => i.key)));
    }
  };

  const toggleSelectOne = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExecuteBatchMove = async (targetSprintId) => {
    if (batchBusy || selectedKeys.size === 0) return;
    setBatchBusy(true);
    try {
      await onBatchMoveSprint(Array.from(selectedKeys), targetSprintId || null);
      setSelectedKeys(new Set());
    } finally {
      setBatchBusy(false);
    }
  };

  const handleExecuteBatchAssign = async (targetAssignee) => {
    if (batchBusy || selectedKeys.size === 0) return;
    setBatchBusy(true);
    try {
      await onBatchAssign(Array.from(selectedKeys), targetAssignee || null);
      setSelectedKeys(new Set());
    } finally {
      setBatchBusy(false);
    }
  };

  const totalPoints = terminalIssues.reduce((acc, i) => acc + (Number(i.estimate ?? i.storyPoints) || 0), 0);

  return (
    <div className='space-y-3'>
      {/* Batch Actions Toolbar when 1+ selected */}
      {selectedKeys.size > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-teal-500/40 bg-teal-50/80 p-3 shadow-md dark:border-teal-500/40 dark:bg-teal-950/60'>
          <div className='flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-200'>
            <span className='size-2 rounded-full bg-teal-500 animate-pulse' />
            <span>{selectedKeys.size} issues selected</span>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {/* Batch Move to Sprint */}
            <select
              disabled={batchBusy}
              defaultValue=''
              onChange={(e) => {
                if (e.target.value !== '') {
                  handleExecuteBatchMove(e.target.value === '__backlog__' ? null : e.target.value);
                  e.target.value = '';
                }
              }}
              className='rounded-lg border border-teal-400/60 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-teal-700 dark:bg-slate-900 dark:text-slate-200'
            >
              <option value='' disabled>
                Move to Sprint…
              </option>
              <option value='__backlog__'>📦 Backlog Pool</option>
              {sprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  🏁 {sp.name}
                </option>
              ))}
            </select>

            {/* Batch Assign */}
            <select
              disabled={batchBusy}
              defaultValue=''
              onChange={(e) => {
                if (e.target.value !== '') {
                  handleExecuteBatchAssign(e.target.value === '__unassigned__' ? null : e.target.value);
                  e.target.value = '';
                }
              }}
              className='rounded-lg border border-teal-400/60 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-teal-700 dark:bg-slate-900 dark:text-slate-200'
            >
              <option value='' disabled>
                Batch Assign…
              </option>
              <option value='__unassigned__'>Unassigned</option>
              {availableAssignees.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Clear Selection */}
            <button
              type='button'
              onClick={() => setSelectedKeys(new Set())}
              className='rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-white/80 dark:hover:bg-slate-900 transition'
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* High Density Table */}
      <div className='overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
        <table className='w-full text-left border-collapse text-xs'>
          <thead>
            <tr className='border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400'>
              <th className='p-2.5 w-10 text-center'>
                <input
                  type='checkbox'
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label='Select all backlog issues'
                  className='issueboard-checkbox'
                />
              </th>
              <th className='p-2.5 w-24'>Key</th>
              <th className='p-2.5'>Title</th>
              <th className='p-2.5 w-24'>Type</th>
              <th className='p-2.5 w-24'>Priority</th>
              <th className='p-2.5 w-36'>Sprint</th>
              <th className='p-2.5 w-32'>Assignee</th>
              <th className='p-2.5 w-20 text-right'>Points</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 font-mono text-xs dark:divide-slate-800/60'>
            {terminalIssues.length === 0 && (
              <tr>
                <td colSpan={8} className='p-6 text-center text-slate-400 font-sans italic'>
                  No issues in this view.
                </td>
              </tr>
            )}
            {terminalIssues.map((issue) => {
              const isSelected = selectedKeys.has(issue.key);
              return (
                <tr
                  key={issue.key}
                  className={`transition ${
                    isSelected
                      ? 'bg-teal-500/10 dark:bg-teal-950/30'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className='p-2.5 text-center'>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => toggleSelectOne(issue.key)}
                      aria-label={`Select ${issue.key}`}
                      className='issueboard-checkbox'
                    />
                  </td>
                  <td className='p-2.5 font-bold text-emerald-600 dark:text-emerald-400'>
                    <Link href={issueHref(issue.key, returnTo)} className='hover:underline'>
                      {issue.key}
                    </Link>
                  </td>
                  <td className='p-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200'>
                    <Link
                      href={issueHref(issue.key, returnTo)}
                      className='hover:text-emerald-600 truncate block max-w-md'
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className='p-2.5 font-sans'>
                    <span className='inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                      <TypeIcon type={issue.type} />
                      <span>{issue.type}</span>
                    </span>
                  </td>
                  <td className='p-2.5 font-sans'>
                    <span className={`text-[11px] font-bold ${priorityClass(issue.priority)}`}>{issue.priority}</span>
                  </td>
                  <td className='p-2.5 font-sans'>
                    <select
                      value={issue.sprintId || ''}
                      onChange={(e) => onMoveSprint(issue, e.target.value || null)}
                      aria-label={`Move ${issue.key} sprint`}
                      className='w-full rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 py-1 text-[11px] font-medium text-slate-700 min-w-[7.5rem] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                    >
                      <option value=''>📦 Backlog</option>
                      {sprints.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          🏁 {sp.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className='p-2.5 font-sans text-slate-600 dark:text-slate-400 truncate max-w-[120px]'>
                    {issue.assignee || 'Unassigned'}
                  </td>
                  <td className='p-2.5 text-right font-bold text-slate-800 dark:text-slate-200'>
                    {issue.estimate ?? issue.storyPoints ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Summary */}
        <div className='flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400'>
          <span>
            Showing {issues.length} issue{issues.length === 1 ? '' : 's'}
          </span>
          <span className='font-mono font-bold text-slate-700 dark:text-slate-300'>
            {totalPoints} Total Story Points
          </span>
        </div>
      </div>
    </div>
  );
};

const Backlog = ({
  returnTo,
  data,
  backlogLayout = 'epic-tree',
  creatingSprint = false,
  setCreatingSprint = () => {},
  onCreateIssue,
  onCreateIssueModal,
  onOpenSprintBoard,
  showSprintSidebar = true
}) => {
  const {
    status,
    issues,
    statuses,
    sprints,
    error,
    moveIssueSprint,
    moveIssueStatus,
    updateIssue,
    updateIssueAssignee,
    createSprint,
    startSprint,
    completeSprint
  } = data;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
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
    if (issue.issueType === 'subtask' || issue.type?.toLowerCase() === 'subtask') return false;
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
  const nonEpicBacklogIssues = backlogIssues.filter((i) => i.issueType !== 'epic' && i.type?.toLowerCase() !== 'epic');
  const totalNonEpicCount = issues.filter(
    (i) => !i.sprintId && i.issueType !== 'epic' && i.type?.toLowerCase() !== 'epic'
  ).length;

  const handleMoveSprint = async (issue, sprintId) => {
    setMoveError(null);
    try {
      await moveIssueSprint(issue, sprintId);
      if (
        sprintId &&
        moveIssueStatus &&
        (issue.status?.toLowerCase?.() === 'backlog' || issue.status?.category === 'backlog')
      ) {
        const todoStatus =
          (statuses || []).find((s) => s.category === 'todo' || s.name.toLowerCase() === 'to do') ||
          (statuses || []).find((s) => s.category !== 'backlog');
        if (todoStatus) {
          await moveIssueStatus(issue, todoStatus.id);
        }
      }
    } catch (moveErr) {
      setMoveError(moveErr.message);
    }
  };

  const handleBatchMoveSprint = async (issueKeys, targetSprintId) => {
    setMoveError(null);
    try {
      for (const key of issueKeys) {
        const target = issues.find((iss) => iss.key === key);
        if (target) {
          await moveIssueSprint(target, targetSprintId);
          if (
            targetSprintId &&
            moveIssueStatus &&
            (target.status?.name?.toLowerCase() === 'backlog' || target.status?.category === 'backlog')
          ) {
            const todoStatus =
              (statuses || []).find((s) => s.category === 'todo' || s.name.toLowerCase() === 'to do') ||
              (statuses || []).find((s) => s.category !== 'backlog');
            if (todoStatus) {
              await moveIssueStatus(target, todoStatus.id);
            }
          }
        }
      }
    } catch (err) {
      setMoveError(err.message || 'Could not move some issues.');
    }
  };

  const handleBatchAssign = async (issueKeys, targetAssignee) => {
    if (!updateIssueAssignee) return;
    setMoveError(null);
    try {
      for (const key of issueKeys) {
        const target = issues.find((iss) => iss.key === key);
        if (target) {
          await updateIssueAssignee(target, targetAssignee);
        }
      }
    } catch (err) {
      setMoveError(err.message || 'Could not assign some issues.');
    }
  };

  return (
    <>
      {/* Top search & filters */}
      <div className='mb-3'>
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
      </div>

      {moveError && (
        <p className='mb-3 rounded-lg border border-rose-300 bg-rose-50 p-2 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'>
          {moveError}
        </p>
      )}

      {creatingSprint && <NewSprintForm onCreate={createSprint} onClose={() => setCreatingSprint(false)} />}

      <div className='flex flex-col lg:flex-row items-start gap-4'>
        {/* Main Left Column: Backlog Epics or Linear Terminal */}
        <div className='flex-1 min-w-0 w-full'>
          {backlogLayout === 'high-density' ? (
            <section className='mb-4'>
              <header className='flex flex-wrap items-center justify-between gap-3 mb-3'>
                <div className='flex items-center gap-2'>
                  <span className='size-2.5 rounded-full bg-teal-500' />
                  <h3 className='text-sm font-bold text-slate-800 dark:text-slate-100'>Backlog Linear Terminal</h3>
                  <span className='text-xs text-slate-500 font-mono'>
                    ({nonEpicBacklogIssues.length} {filtersActive ? `of ${totalNonEpicCount} issues` : 'issues'})
                  </span>
                </div>
              </header>
              <BacklogHighDensity
                issues={nonEpicBacklogIssues}
                sprints={openSprints}
                returnTo={returnTo}
                availableAssignees={availableAssignees}
                onMoveSprint={handleMoveSprint}
                onBatchMoveSprint={handleBatchMoveSprint}
                onBatchAssign={handleBatchAssign}
                onCreateIssue={onCreateIssue}
              />
            </section>
          ) : (
            <section className='mb-4'>
              <header className='flex flex-wrap items-center justify-between gap-3 mb-3'>
                <div className='flex items-center gap-2'>
                  <span className='size-2.5 rounded-full bg-purple-500' />
                  <h3 className='text-sm font-bold text-slate-800 dark:text-slate-100'>Backlog Epics & Milestones</h3>
                  <span className='text-xs text-slate-500 font-mono'>
                    ({backlogIssues.length}{' '}
                    {filtersActive ? `of ${issues.filter((i) => !i.sprintId).length} issues` : 'issues'})
                  </span>
                </div>
              </header>
              <BacklogEpicTree
                projectKey={data.project?.key}
                issues={backlogIssues}
                allIssues={filteredIssues}
                sprints={openSprints}
                returnTo={returnTo}
                onMoveSprint={handleMoveSprint}
                onCreateIssue={data.createIssue}
                onUpdateIssue={updateIssue}
                onCreateIssueModal={onCreateIssueModal}
              />
            </section>
          )}
        </div>

        {/* Right Column: Compact Sprint Cards Sidebar */}
        {showSprintSidebar && (
          <BacklogSprintSidebar
            sprints={sprints}
            issues={filteredIssues}
            onOpenBoard={onOpenSprintBoard}
            onCreateSprint={() => setCreatingSprint(true)}
            onStartSprint={startSprint}
            onCompleteSprint={completeSprint}
          />
        )}
      </div>
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

const Board = ({
  returnTo,
  data,
  moveIssueStatus,
  setIssueWorkState,
  boardLayout = 'swimlane',
  selectedSprint = null,
  onSelectSprint = () => {}
}) => {
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
  const targetSprint =
    selectedSprint || activeSprint || sprints.find((s) => s.state === 'planned') || sprints[0] || null;
  const isClosedSprint = targetSprint?.state === 'closed';
  const isPlannedSprint = targetSprint?.state === 'planned';

  const activeIssues = issues.filter(
    (issue) => !issue.archivedAt && (!targetSprint || issue.sprintId === targetSprint.id)
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
    if (isClosedSprint) {
      setMoveError('Completed sprints are read-only historical archives. Issues cannot be moved.');
      return;
    }
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
    if (isClosedSprint) {
      setMoveError('Cannot add subtasks to a completed sprint.');
      return;
    }
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
      if (targetSprint && !isClosedSprint) await moveIssueSprint(subtask, targetSprint.id);
    } catch (createErr) {
      setMoveError(createErr.message);
    } finally {
      setQuickCreateBusy(false);
    }
  };

  return (
    <div className='flex flex-1 flex-col min-h-0 h-full overflow-hidden'>
      <div className='shrink-0 mb-3'>
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
          <p className='my-2 rounded-lg border border-rose-300 bg-rose-50 p-2 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'>
            {moveError}
          </p>
        )}

        {/* Sprint Status Context Banner */}
        {targetSprint && isClosedSprint && (
          <div className='mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/80 p-3 text-xs text-purple-900 dark:border-purple-800/80 dark:bg-purple-950/40 dark:text-purple-200 shadow-2xs'>
            <div className='flex items-center gap-2.5'>
              <span className='size-6 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold grid place-items-center text-xs shrink-0'>
                🏁
              </span>
              <div>
                <strong className='font-bold text-slate-900 dark:text-slate-100'>{targetSprint.name}</strong>
                <span className='ml-2 text-[11px] text-slate-600 dark:text-slate-400'>
                  Completed on{' '}
                  {targetSprint.endsAt ? new Date(targetSprint.endsAt).toLocaleDateString() : 'earlier date'} •{' '}
                  {activeIssues.length} issues • Read-only archive
                </span>
              </div>
            </div>
            {activeSprint && (
              <button
                type='button'
                onClick={() => onSelectSprint(activeSprint.id)}
                className='rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 border border-purple-300 dark:border-purple-700 dark:bg-slate-900 dark:text-purple-300 transition shrink-0'
              >
                Switch to Active Sprint →
              </button>
            )}
          </div>
        )}

        {targetSprint && isPlannedSprint && (
          <div className='mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs'>
            <div className='flex items-center gap-2.5'>
              <span className='size-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold grid place-items-center text-xs shrink-0'>
                ⏳
              </span>
              <div>
                <strong className='font-bold text-slate-900 dark:text-slate-100'>{targetSprint.name} (Upcoming)</strong>
                <span className='ml-2 text-[11px] text-slate-600 dark:text-slate-400'>
                  {activeIssues.length} issues committed •{' '}
                  {formatSprintDates(targetSprint.startsAt, targetSprint.endsAt)}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <Link
                href={`/admin/issues?project=${project?.key}&view=backlog`}
                className='rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 border border-amber-300 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-300 transition'
              >
                Manage in Backlog →
              </Link>
            </div>
          </div>
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

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

const CreateIssueModal = ({
  project,
  currentView = 'overview',
  activeSprint,
  sprints = [],
  issues = [],
  projectUsers = [],
  moveIssueSprint,
  onCreate,
  onClose,
  initialIssueType = 'task',
  initialParentId = '',
  initialSprintId = ''
}) => {
  const router = useRouter();
  const defaultSprintId = useMemo(() => {
    if (initialSprintId) return initialSprintId;
    if (initialIssueType === 'epic') return '';
    if (currentView === 'board' && activeSprint) {
      return activeSprint.id;
    }
    return '';
  }, [currentView, activeSprint, initialSprintId, initialIssueType]);

  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [issueType, setIssueType] = useState(initialIssueType);
  const [priority, setPriority] = useState(initialIssueType === 'epic' ? 'high' : 'medium');
  const [targetSprintId, setTargetSprintId] = useState(defaultSprintId);
  const [storyPoints, setStoryPoints] = useState('');
  const [assignee, setAssignee] = useState('');
  const [parentIssueId, setParentIssueId] = useState(initialParentId);
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [attachmentError, setAttachmentError] = useState(null);
  const [createAnother, setCreateAnother] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  const checklistInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (defaultSprintId && !targetSprintId) {
      setTargetSprintId(defaultSprintId);
    }
  }, [defaultSprintId, targetSprintId]);

  const candidateIssues = useMemo(() => {
    return (issues || []).filter((iss) => iss.issueType !== 'subtask' && !iss.archivedAt);
  }, [issues]);

  const linkedIssue = useMemo(() => {
    return candidateIssues.find((iss) => iss.id === parentIssueId);
  }, [candidateIssues, parentIssueId]);

  const assigneeOptions = useMemo(() => {
    const names = new Set();
    (projectUsers || []).forEach((u) => {
      if (u.name) names.add(u.name);
      else if (u.email) names.add(u.email);
    });
    (issues || []).forEach((iss) => {
      if (iss.assignee) {
        iss.assignee.split(',').forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) names.add(trimmed);
        });
      }
    });
    if (names.size === 0) {
      ['Sukhdeep Singh', 'Alex Rivera', 'Sarah Chen', 'Marcus Brody'].forEach((m) => names.add(m));
    }
    return Array.from(names).sort();
  }, [projectUsers, issues]);

  const handleAddChecklistItem = () => {
    const trimmed = newChecklistItem.trim();
    if (!trimmed) return;
    setChecklist((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, body: trimmed, isComplete: false }]);
    setNewChecklistItem('');
    checklistInputRef.current?.focus();
  };

  const processFiles = (files) => {
    setAttachmentError(null);
    const newStaged = [];
    for (const file of files) {
      const isImg = Boolean(file.type?.startsWith('image/'));
      const maxBytes = isImg ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setAttachmentError(
          isImg ? `"${file.name}" exceeds the 5 MB image limit.` : `"${file.name}" exceeds the 10 MB file limit.`
        );
        continue;
      }
      newStaged.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        isImg
      });
    }
    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const submit = async (event, openAfter = false) => {
    if (event) event.preventDefault();
    if (submitting) return;
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await onCreate({
        projectKey: project.key,
        issueType,
        title: title.trim(),
        description,
        priority,
        storyPoints: issueType !== 'epic' && storyPoints !== '' ? Number(storyPoints) : undefined,
        assignee: assignee || undefined,
        parentIssueId: issueType !== 'epic' && parentIssueId ? parentIssueId : undefined
      });

      if (issueType !== 'epic' && targetSprintId && moveIssueSprint && created) {
        try {
          await moveIssueSprint(created, targetSprintId);
        } catch (sprintErr) {
          console.error('Failed to assign sprint:', sprintErr);
        }
      }

      if (checklist.length > 0 && created?.key) {
        try {
          const clRes = await fetch(`/api/issueboard/issues/${encodeURIComponent(created.key)}/checklists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Checklist' })
          }).then((r) => r.json());

          if (clRes?.ok && clRes?.checklist?.id) {
            for (const it of checklist) {
              if (it.body?.trim()) {
                await fetch(`/api/issueboard/checklists/${clRes.checklist.id}/items`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ body: it.body.trim(), isComplete: it.isComplete })
                });
              }
            }
          }
        } catch (clErr) {
          console.error('Failed to save checklist:', clErr);
        }
      }

      if (stagedFiles.length > 0 && created?.key) {
        for (const sf of stagedFiles) {
          try {
            const file = sf.file;
            const mime = file.type || 'application/octet-stream';
            const authRes = await fetch(`/api/issueboard/issues/${encodeURIComponent(created.key)}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalFilename: file.name,
                mimeType: mime,
                byteSize: file.size
              })
            }).then((r) => r.json());

            if (authRes?.ok && authRes?.signedUrl && authRes?.attachmentId) {
              await fetch(authRes.signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': mime },
                body: file
              });
              await fetch(`/api/issueboard/issues/${encodeURIComponent(created.key)}/attachments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attachmentId: authRes.attachmentId })
              });
            }
          } catch (fileErr) {
            console.error('Failed to upload file:', fileErr);
          }
        }
      }

      if (openAfter && created?.key) {
        onClose();
        router.push(issueHref(created.key));
        return;
      }

      if (createAnother) {
        setTitle('');
        setDescription('');
        setChecklist([]);
        setNewChecklistItem('');
        setStagedFiles([]);
        setStoryPoints('');
        setSuccessNotice(`Issue ${created?.key || ''} created successfully! You can draft another.`);
        setTimeout(() => setSuccessNotice(null), 4000);
      } else {
        onClose();
      }
    } catch (submitError) {
      setError(submitError.message || 'Could not create the issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs'
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
      <div className='relative flex flex-col w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden'>
        {/* Header */}
        <header className='flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-950/50'>
          <div className='flex items-center gap-2.5'>
            <span
              className={`size-6 rounded-lg grid place-items-center text-xs font-bold ${
                issueType === 'epic'
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-600 dark:text-purple-400'
                  : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {issueType === 'epic' ? '👑' : '⚡'}
            </span>
            <div>
              <h2 id='create-issue-title' className='text-sm font-bold text-slate-900 dark:text-slate-100'>
                {issueType === 'epic' ? 'Create Epic' : 'Create Issue'}
              </h2>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition'
          >
            <FiX />
          </button>
        </header>

        {/* Success Notice if "Create Another" was triggered */}
        {successNotice && (
          <div className='bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 flex items-center justify-between'>
            <span>✓ {successNotice}</span>
            <button
              type='button'
              onClick={() => setSuccessNotice(null)}
              className='text-emerald-600 hover:text-emerald-800 text-xs font-bold'
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Split Body */}
        <div className='grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12 min-h-0'>
          {/* Left Column (7 cols): Document Canvas & Subtasks */}
          <div className='flex flex-col space-y-4 overflow-y-auto p-5 md:p-6 lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 custom-scrollbar'>
            {/* Title */}
            <div>
              <input
                required
                minLength={3}
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder='What needs to be done?'
                className='w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-bold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 shadow-2xs'
              />
            </div>

            {/* Description with authentic MarkdownEditor & formatting bar */}
            <div>
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                placeholder='Describe the issue, acceptance criteria, or technical spec…'
                ariaLabel='New issue description'
                minHeight='min-h-48'
              />
            </div>

            {/* Checklist Section — matching IssueDetail.jsx */}
            <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90'>
              <div className='mb-2.5 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    Checklist
                  </span>
                  {checklist.length > 0 && (
                    <span className='font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                      {checklist.filter((item) => item.isComplete).length} of {checklist.length} done (
                      {checklist.length
                        ? Math.round((checklist.filter((item) => item.isComplete).length / checklist.length) * 100)
                        : 0}
                      %)
                    </span>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => checklistInputRef.current?.focus()}
                  className='rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60'
                >
                  + Add item
                </button>
              </div>

              {checklist.length > 0 && (
                <div className='mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all duration-300'
                    style={{
                      width: `${(checklist.filter((item) => item.isComplete).length / checklist.length) * 100}%`
                    }}
                  />
                </div>
              )}

              {checklist.length > 0 && (
                <div className='space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60 mb-3'>
                  {checklist.map((item) => (
                    <div key={item.id} className='group relative py-1 text-sm leading-5'>
                      <div className='flex min-h-8 items-center gap-2 rounded-lg px-1 transition hover:bg-slate-50 dark:hover:bg-slate-800/30'>
                        <input
                          type='checkbox'
                          checked={item.isComplete}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setChecklist((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, isComplete: checked } : it))
                            );
                          }}
                          className='issueboard-checkbox'
                        />
                        <div className='min-w-0 flex-1'>
                          <span
                            className={
                              item.isComplete
                                ? 'text-xs text-slate-400 line-through dark:text-slate-500'
                                : 'text-xs text-slate-800 dark:text-slate-200'
                            }
                          >
                            {item.body}
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() => setChecklist((prev) => prev.filter((it) => it.id !== item.id))}
                          className='text-slate-400 hover:text-rose-500 text-xs px-1'
                          title='Remove checklist item'
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Always visible Checklist Item Input Form */}
              <div className='flex gap-2'>
                <input
                  ref={checklistInputRef}
                  value={newChecklistItem}
                  onChange={(event) => setNewChecklistItem(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  placeholder='New checklist item (e.g. Write integration test)…'
                  aria-label='New checklist item'
                  className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                />
                <button
                  type='button'
                  disabled={!newChecklistItem.trim()}
                  onClick={handleAddChecklistItem}
                  className='button text-xs disabled:opacity-60'
                >
                  Add
                </button>
              </div>
            </section>

            {/* Attachments Card with Buttons and Clickable Dropzone */}
            <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90'>
              <div className='mb-2.5 flex items-center justify-between'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                      Attachments
                    </span>
                    {stagedFiles.length > 0 && (
                      <span className='font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                        {stagedFiles.length} file{stagedFiles.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <p className='mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500'>
                    Images max 5 MB • Documents & files max 10 MB
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700/60'
                >
                  + Upload file
                </button>
              </div>

              <input ref={fileInputRef} type='file' multiple className='hidden' onChange={handleFileSelect} />

              {attachmentError && (
                <p className='mb-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{attachmentError}</p>
              )}

              {/* Staged Files List */}
              {stagedFiles.length > 0 && (
                <div className='mb-3 space-y-1.5'>
                  {stagedFiles.map((sf) => (
                    <div
                      key={sf.id}
                      className='flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-800 dark:bg-slate-950'
                    >
                      <div className='flex items-center gap-2 truncate'>
                        <span className='text-base'>{sf.isImg ? '📷' : '📄'}</span>
                        <span className='truncate font-medium text-slate-800 dark:text-slate-200'>{sf.name}</span>
                        <span className='font-mono text-[10px] text-slate-400'>({formatBytes(sf.size)})</span>
                      </div>
                      <button
                        type='button'
                        onClick={() => setStagedFiles((prev) => prev.filter((f) => f.id !== sf.id))}
                        className='text-slate-400 hover:text-rose-500 text-xs px-1'
                        title='Remove file'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Clickable & Draggable Dropzone Area */}
              <div
                role='button'
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className='cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 text-center transition hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-emerald-500/60 dark:hover:bg-emerald-950/10'
              >
                <div className='flex flex-col items-center justify-center gap-1'>
                  <span className='text-lg'>📎</span>
                  <p className='text-xs font-semibold text-slate-700 dark:text-slate-300'>
                    Click or drag files here to upload
                  </p>
                  <p className='text-[10px] text-slate-400 dark:text-slate-500'>
                    Supports images, text, pdf, logs, and binary archives
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (5 cols): Modular Card-Deck (Scrollable) */}
          <div className='flex flex-col justify-between space-y-4 overflow-y-auto p-4 md:p-5 bg-slate-50/60 dark:bg-slate-950/60 lg:col-span-5 custom-scrollbar'>
            <div className='space-y-3.5'>
              {/* Card A: Workflow & Target */}
              <div className='rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3'>
                <div className='grid grid-cols-2 gap-2.5'>
                  {/* Task Type Dropdown */}
                  <div>
                    <label className='block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1'>
                      TASK TYPE
                    </label>
                    <select
                      value={issueType}
                      onChange={(event) => setIssueType(event.target.value)}
                      className='w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-emerald-500'
                    >
                      {['task', 'story', 'bug', 'epic', 'feature', 'improvement', 'research'].map((type) => (
                        <option key={type} value={type}>
                          {capitalize(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Dropdown */}
                  <div>
                    <label className='block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1'>
                      PRIORITY
                    </label>
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value)}
                      className='w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-emerald-500'
                    >
                      {['highest', 'high', 'medium', 'low', 'lowest'].map((level) => (
                        <option key={level} value={level}>
                          {capitalize(level)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Sprint Dropdown (Context-Aware Default, Hidden for Epics) */}
                {issueType !== 'epic' && (
                  <div>
                    <div className='flex items-center justify-between mb-1'>
                      <label className='block text-[11px] font-bold text-slate-600 dark:text-slate-400'>
                        TARGET SPRINT
                      </label>
                      <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-mono'>
                        {currentView === 'board' ? 'Default: Board' : 'Default: Backlog'}
                      </span>
                    </div>
                    <select
                      value={targetSprintId}
                      onChange={(event) => setTargetSprintId(event.target.value)}
                      className='w-full rounded-lg border border-slate-300 bg-white py-2 pl-2.5 pr-8 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-emerald-500'
                    >
                      <option value=''>📦 Backlog Reservoir</option>
                      {sprints.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          🏁 {sp.name} {sp.state === 'active' ? '(Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Story Points Text Box (Hidden for Epics) */}
                {issueType !== 'epic' && (
                  <div>
                    <label className='block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1'>
                      STORY POINTS
                    </label>
                    <input
                      type='number'
                      min='0'
                      max='999'
                      value={storyPoints}
                      onChange={(e) => setStoryPoints(e.target.value)}
                      placeholder='e.g. 5'
                      className='w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 shadow-2xs focus:outline-none focus:border-emerald-500'
                    />
                  </div>
                )}

                {/* Epic Context Notice */}
                {issueType === 'epic' && (
                  <div className='rounded-xl border border-purple-200 bg-purple-50/70 p-3 dark:border-purple-900/50 dark:bg-purple-950/30 text-xs text-purple-900 dark:text-purple-200 space-y-1'>
                    <div className='flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300'>
                      <span>👑</span>
                      <span>Macro Initiative</span>
                    </div>
                    <p className='text-[11px] text-purple-700/90 dark:text-purple-300/90 leading-relaxed'>
                      Epics live across the roadmap rather than a single sprint. Story points and completion metrics
                      automatically roll up from child tasks.
                    </p>
                  </div>
                )}

                {/* Assignee Dropdown */}
                <div>
                  <label className='block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1'>
                    ASSIGNEE
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className='w-full rounded-lg border border-slate-300 bg-white py-2 pl-2.5 pr-8 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:border-emerald-500'
                  >
                    <option value=''>Unassigned</option>
                    {assigneeOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card B: Relations & Linked Issues (Hidden for root Epics) */}
              {issueType !== 'epic' && (
                <div className='rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5'>
                  <span className='block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    Linked Issue
                  </span>

                  {parentIssueId ? (
                    <div className='flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-800 dark:bg-slate-950'>
                      <div className='flex items-center gap-2 truncate'>
                        <span className='rounded bg-purple-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'>
                          {linkedIssue?.key}
                        </span>
                        <span className='truncate text-slate-700 dark:text-slate-300 font-medium'>
                          {linkedIssue?.title}
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={() => setParentIssueId('')}
                        className='ml-1 text-slate-400 hover:text-rose-500 font-bold px-1'
                        title='Unlink issue'
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={parentIssueId}
                      onChange={(e) => setParentIssueId(e.target.value)}
                      className='w-full rounded-lg border border-slate-300 bg-white py-2 pl-2.5 pr-8 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                    >
                      <option value=''>None · Select parent / linked issue</option>
                      {candidateIssues.map((iss) => (
                        <option key={iss.id} value={iss.id}>
                          {iss.key}: {iss.title.length > 40 ? iss.title.slice(0, 40) + '…' : iss.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p
                role='alert'
                className='rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
              >
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions: Checkbox + 3 Buttons */}
        <footer className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900 shrink-0'>
          <label className='flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200'>
            <input
              type='checkbox'
              checked={createAnother}
              onChange={(e) => setCreateAnother(e.target.checked)}
              className='rounded border-slate-300 text-emerald-600 focus:ring-0 dark:border-slate-700'
            />
            <span>Create another issue after submit</span>
          </label>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition'
            >
              Dismiss
            </button>
            <button
              type='button'
              disabled={submitting || !title.trim()}
              onClick={(e) => submit(e, true)}
              className='rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition shadow-2xs'
            >
              Create & Open
            </button>
            <button
              type='button'
              disabled={submitting || !title.trim()}
              onClick={(e) => submit(e, false)}
              className='button text-xs font-bold disabled:opacity-50 shadow-md shadow-emerald-900/20'
            >
              {submitting ? 'Creating…' : issueType === 'epic' ? 'Create Epic' : 'Create issue'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

const IssueboardWorkspace = ({ adminEmail }) => {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState({ issueType: 'task', parentIssueId: '', targetSprintId: '' });
  const view = validViews.includes(router.query.view) ? router.query.view : 'overview';
  const returnTo = useMemo(() => router.asPath, [router.asPath]);
  const projectKey = typeof router.query.project === 'string' ? router.query.project.toUpperCase() : undefined;
  const data = useIssueboardData(projectKey);

  const handleOpenCreateModal = useCallback((defaults = {}) => {
    setCreateDefaults({
      issueType: defaults.issueType || 'task',
      parentIssueId: defaults.parentIssueId || '',
      targetSprintId: defaults.targetSprintId || ''
    });
    setCreateOpen(true);
  }, []);

  const [boardLayout, setBoardLayout] = useState(data.project?.sprintBoardLayout || 'swimlane');
  const [backlogLayout, setBacklogLayout] = useState('epic-tree');
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [layoutError, setLayoutError] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('issueboard:backlogLayout');
      if (saved === 'epic-tree' || saved === 'high-density') {
        setBacklogLayout(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSwitchBacklogLayout = useCallback((newLayout) => {
    setBacklogLayout(newLayout);
    try {
      localStorage.setItem('issueboard:backlogLayout', newLayout);
    } catch {
      // ignore
    }
  }, []);

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

  const [selectedSprintId, setSelectedSprintId] = useState(
    typeof router.query.sprintId === 'string' ? router.query.sprintId : null
  );

  useEffect(() => {
    if (typeof router.query.sprintId === 'string') {
      setSelectedSprintId(router.query.sprintId);
    }
  }, [router.query.sprintId]);

  const activeSprint = useMemo(() => {
    return (data.sprints || []).find((s) => s.state === 'active');
  }, [data.sprints]);

  const currentBoardSprint = useMemo(() => {
    if (selectedSprintId) {
      const found = (data.sprints || []).find((s) => s.id === selectedSprintId);
      if (found) return found;
    }
    return activeSprint || (data.sprints || []).find((s) => s.state === 'planned') || (data.sprints || [])[0] || null;
  }, [selectedSprintId, data.sprints, activeSprint]);

  const handleSelectSprint = useCallback(
    (sprintId) => {
      setSelectedSprintId(sprintId);
      router.replace({ pathname: router.pathname, query: { ...router.query, sprintId } }, undefined, { shallow: true });
    },
    [router]
  );

  const handleOpenSprintOnBoard = useCallback(
    (sprintId) => {
      setSelectedSprintId(sprintId);
      router.push({ pathname: router.pathname, query: { ...router.query, view: 'board', sprintId } }, undefined, {
        shallow: true
      });
    },
    [router]
  );

  const [showSprintSidebar, setShowSprintSidebar] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('issueboard:showSprintSidebar');
      if (saved !== null) {
        setShowSprintSidebar(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSprintSidebar = useCallback(() => {
    setShowSprintSidebar((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('issueboard:showSprintSidebar', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const pageTitle = useMemo(() => {
    if (view === 'board') {
      return currentBoardSprint?.name || 'Sprint Board';
    }
    return viewTitles[view];
  }, [view, currentBoardSprint]);

  const pageSubtitle = useMemo(() => {
    if (view === 'board' && currentBoardSprint) {
      if (currentBoardSprint.state === 'active' && currentBoardSprint.endsAt) {
        return `Active • ${daysRemaining(currentBoardSprint.endsAt)} days remaining`;
      }
      if (currentBoardSprint.state === 'planned') {
        return `Planned • ${currentBoardSprint.startsAt ? new Date(currentBoardSprint.startsAt).toLocaleDateString() : 'Ready to start'}`;
      }
      if (currentBoardSprint.state === 'closed') {
        return `Completed • ${currentBoardSprint.endsAt ? new Date(currentBoardSprint.endsAt).toLocaleDateString() : 'Archived'}`;
      }
    }
    return null;
  }, [view, currentBoardSprint]);

  const headerActions = useMemo(() => {
    if (view === 'board') {
      return (
        <div className='flex items-center gap-2'>
          {/* Sprint Switcher Dropdown (Option 1) */}
          <SprintSwitcherDropdown
            sprints={data.sprints || []}
            currentSprintId={currentBoardSprint?.id}
            issues={data.issues || []}
            onSelectSprint={handleSelectSprint}
          />

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

          {/* Inline triage error if layout switch failed */}
          {layoutError && (
            <span className='text-[11px] text-rose-500 font-medium' title={layoutError}>
              Layout sync failed
            </span>
          )}

          {/* Quick complete active sprint button if viewing active sprint */}
          {currentBoardSprint?.state === 'active' && (
            <button
              type='button'
              onClick={() => data.completeSprint?.(currentBoardSprint.id)}
              className='flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition shadow-2xs'
              title='Complete Sprint'
              aria-label='Complete Sprint'
            >
              <FiCheckCircle className='size-4' />
            </button>
          )}
        </div>
      );
    }

    if (view === 'backlog') {
      return (
        <div className='flex items-center gap-2'>
          {/* Backlog Dual Layout Switcher (Artefact 2: Epic Tree vs Artefact 5: High-Density Terminal) */}
          <div className='flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800 shadow-2xs'>
            <button
              type='button'
              onClick={() => handleSwitchBacklogLayout('epic-tree')}
              className={`flex size-8 items-center justify-center rounded-md transition ${
                backlogLayout === 'epic-tree'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
              title='Nested Epic Hierarchy Tree'
              aria-label='Nested Epic Hierarchy Tree'
            >
              <FiGitBranch className='size-4' />
            </button>
            <button
              type='button'
              onClick={() => handleSwitchBacklogLayout('high-density')}
              className={`flex size-8 items-center justify-center rounded-md transition ${
                backlogLayout === 'high-density'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
              title='High-Density Terminal'
              aria-label='High-Density Terminal'
            >
              <FiList className='size-4' />
            </button>
          </div>

          {/* Toggle Sprints Sidebar button (icon button) */}
          <button
            type='button'
            onClick={toggleSprintSidebar}
            className={`flex size-8 items-center justify-center rounded-lg border transition shadow-2xs ${
              showSprintSidebar
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-400'
                : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
            }`}
            title={showSprintSidebar ? 'Hide sprint sidebar' : 'Show sprint sidebar'}
            aria-label={showSprintSidebar ? 'Hide sprint sidebar' : 'Show sprint sidebar'}
          >
            <FiSidebar className='size-4' />
          </button>

          {/* Create sprint button */}
          <button
            type='button'
            onClick={() => setCreatingSprint((prev) => !prev)}
            className={`flex size-8 items-center justify-center rounded-lg border transition shadow-2xs ${
              creatingSprint
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-400'
                : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
            }`}
            title='Create sprint'
            aria-label='Create sprint'
          >
            <FiCalendar className='size-4' />
          </button>
        </div>
      );
    }

    return null;
  }, [
    view,
    boardLayout,
    backlogLayout,
    creatingSprint,
    showSprintSidebar,
    currentBoardSprint,
    data,
    handleSwitchLayout,
    handleSwitchBacklogLayout,
    handleSelectSprint,
    toggleSprintSidebar,
    layoutError
  ]);

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
      onCreate={() => data.project && handleOpenCreateModal()}
    >
      {view === 'overview' && <Overview returnTo={returnTo} data={data} />}
      {view === 'backlog' && (
        <Backlog
          returnTo={returnTo}
          data={data}
          backlogLayout={backlogLayout}
          creatingSprint={creatingSprint}
          setCreatingSprint={setCreatingSprint}
          onCreateIssue={() => data.project && handleOpenCreateModal()}
          onCreateIssueModal={handleOpenCreateModal}
          onOpenSprintBoard={handleOpenSprintOnBoard}
          showSprintSidebar={showSprintSidebar}
        />
      )}
      {view === 'board' && (
        <Board
          returnTo={returnTo}
          data={data}
          moveIssueStatus={data.moveIssueStatus}
          setIssueWorkState={data.setIssueWorkState}
          boardLayout={boardLayout}
          selectedSprint={currentBoardSprint}
          onSelectSprint={handleSelectSprint}
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
        <CreateIssueModal
          project={data.project}
          currentView={view}
          activeSprint={activeSprint}
          sprints={data.sprints || []}
          issues={data.issues || []}
          projectUsers={data.projectUsers || []}
          moveIssueSprint={data.moveIssueSprint}
          onCreate={data.createIssue}
          onClose={() => setCreateOpen(false)}
          initialIssueType={createDefaults.issueType}
          initialParentId={createDefaults.parentIssueId}
          initialSprintId={createDefaults.targetSprintId}
        />
      )}
    </IssueboardShell>
  );
};

export default IssueboardWorkspace;
