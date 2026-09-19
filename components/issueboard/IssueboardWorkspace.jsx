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

const priorityClass = (priority) => {
  if (priority === 'Highest') return 'text-rose-700 dark:text-rose-300';
  if (priority === 'High') return 'text-orange-700 dark:text-orange-300';
  if (priority === 'Low') return 'text-sky-700 dark:text-sky-300';
  return 'text-amber-700 dark:text-amber-300';
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const workStateClass = (workState) => {
  if (workState === 'Blocked') return 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40';
  if (workState === 'Rejected')
    return 'border-slate-300 bg-slate-100 opacity-75 dark:border-slate-700 dark:bg-slate-800';
  return 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950';
};

const initialsFromName = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

// Adapts a real issueService record onto the presentational shape this prototype UI
// was built around. Fields with no backend yet (labels, checklist, attachments) are
// left empty rather than faked.
const toDisplayIssue = (issue) => ({
  key: issue.key,
  type: capitalize(issue.type),
  title: issue.title,
  status: issue.status?.name || 'Backlog',
  statusId: issue.status?.id,
  sprintId: issue.sprintId,
  workState: capitalize(issue.workState) || 'Normal',
  priority: capitalize(issue.priority),
  estimate: issue.storyPoints ?? undefined,
  labels: issue.labels || [],
  checklist: null,
  checklistItems: [],
  attachments: 0,
  creator: { name: issue.reporter, initials: initialsFromName(issue.reporter) },
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

const BoardCard = ({ issue, returnTo, onDragStart }) => (
  <article
    draggable
    onDragStart={onDragStart}
    className='mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950'
  >
    <IssueLink issue={issue} returnTo={returnTo}>
      <div className='flex items-center gap-2 text-[10px] text-slate-500'>
        <TypeIcon type={issue.type} /> {issue.key}
      </div>
      <h3 className='my-2 text-sm font-normal leading-snug'>{issue.title}</h3>
    </IssueLink>
    <div className='flex items-center justify-end text-[10px] text-slate-500'>
      <CreatorAvatar creator={issue.creator} />
    </div>
  </article>
);

const ParentIssueCard = ({ issue, returnTo, onStateChange }) => {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [stateBusy, setStateBusy] = useState(false);
  const [checklistItems, setChecklistItems] = useState(null);
  const workState = issue.workState || 'Normal';

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
          disabled={stateBusy}
          aria-label={`State for ${issue.key}`}
          aria-haspopup='listbox'
          aria-expanded={stateMenuOpen}
          className='inline-flex h-6 items-center gap-1.5 rounded-md bg-transparent px-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800'
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
          {checklistTotal > 0 && (
            <button
              type='button'
              className='inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800'
              onClick={() => setChecklistOpen((current) => !current)}
              aria-expanded={checklistOpen}
            >
              <FiCheckSquare aria-hidden='true' /> {checklistDone}/{checklistTotal}
              <FiChevronDown className={`transition ${checklistOpen ? 'rotate-180' : ''}`} aria-hidden='true' />
            </button>
          )}
          {typeof issue.estimate === 'number' && <span>{issue.estimate} points</span>}
        </div>
        <CreatorAvatar creator={issue.creator} />
      </div>
      {checklistOpen && (
        <ul className='mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800'>
          {checklistItems?.map((item) => (
            <li key={item.id} className='flex items-center gap-2 leading-5'>
              <FiCheckSquare className={`shrink-0 ${item.isComplete ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className={item.isComplete ? 'text-slate-400 line-through' : ''}>{item.body}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

const daysRemaining = (endsAt) => Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000));

const Board = ({ returnTo, data, moveIssueStatus, setIssueWorkState }) => {
  const { status, issues, statuses, sprints, error, completeSprint, project, createIssue, moveIssueSprint } = data;
  const [moveError, setMoveError] = useState(null);
  const [dragIssueKey, setDragIssueKey] = useState(null);
  const [quickCreateParent, setQuickCreateParent] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCreateBusy, setQuickCreateBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  if (status === 'loading') return null;
  if (status === 'unavailable') return <DatastoreUnavailableNotice error={error} />;
  if (status === 'no-projects') return <NoProjectsNotice />;
  if (statuses.length === 0)
    return <p className='px-4 py-6 text-sm text-slate-500'>This project has no workflow statuses configured.</p>;

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
    <>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Sprint board</h2>
          <p className='mt-1 text-sm text-slate-500'>
            {activeSprint
              ? `${activeSprint.name} · ${daysRemaining(activeSprint.endsAt)} days remaining`
              : 'Continuous flow · all open issues by status.'}
          </p>
        </div>
        {activeSprint && (
          <div className='flex gap-2'>
            <button
              type='button'
              className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700'
            >
              Sprint details
            </button>
            <button
              type='button'
              onClick={() => completeSprint(activeSprint.id, null)}
              className='rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700'
            >
              Complete sprint
            </button>
          </div>
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
      <div className='overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800'>
        <div style={{ minWidth: `${(1 + statuses.length) * 15}rem` }}>
          <div
            className='grid bg-slate-100 dark:bg-slate-900'
            style={{ gridTemplateColumns: `repeat(${1 + statuses.length}, minmax(15rem, 1fr))` }}
          >
            <header className='flex items-center justify-between border-r border-slate-200 p-3 dark:border-slate-800'>
              <strong className='issueboard-swimlane-title text-xs tracking-wider'>Parent issue</strong>
              <span className='inline-flex size-6 items-center justify-center rounded-md bg-slate-300 text-[10px] leading-none dark:bg-slate-800'>
                {parentIssues.length}
              </span>
            </header>
            {statuses.map((columnStatus) => (
              <header
                key={columnStatus.id}
                className='flex items-center justify-between border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-800'
              >
                <strong className='issueboard-swimlane-title text-xs tracking-wider'>{columnStatus.name}</strong>
                <span className='inline-flex size-6 items-center justify-center rounded-md bg-slate-300 text-[10px] leading-none dark:bg-slate-800'>
                  {
                    parentIssues
                      .flatMap((parent) => subtasksByParent[parent.id] || [])
                      .filter((subtask) => subtask.status?.id === columnStatus.id).length
                  }
                </span>
              </header>
            ))}
          </div>
          {parentIssues.map((issue) => (
            <section
              key={issue.key}
              className='grid border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
              style={{ gridTemplateColumns: `repeat(${1 + statuses.length}, minmax(15rem, 1fr))` }}
            >
              <div className='border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70'>
                <ParentIssueCard
                  issue={toDisplayIssue(issue)}
                  returnTo={returnTo}
                  onStateChange={(workState) => setIssueWorkState(issue, workState)}
                />
              </div>
              {statuses.map((columnStatus) => {
                const cellSubtasks = (subtasksByParent[issue.id] || []).filter(
                  (subtask) => subtask.status?.id === columnStatus.id && (!filtersActive || matchesFilters(subtask))
                );
                return (
                  <div
                    key={columnStatus.id}
                    className='min-h-44 border-r border-slate-200 p-3 last:border-r-0 dark:border-slate-800'
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      const subtask = (subtasksByParent[issue.id] || []).find((entry) => entry.key === dragIssueKey);
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
                      />
                    ))}
                    {columnStatus.id === statuses[0].id &&
                      (quickCreateParent === issue.key ? (
                        <form
                          className='rounded-xl border border-dashed border-slate-400 bg-white p-2 dark:bg-slate-900'
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
      title={viewTitles[view]}
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
