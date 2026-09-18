import { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiCloud,
  FiCode,
  FiDatabase,
  FiExternalLink,
  FiImage,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiSlack,
  FiTrash2,
  FiX
} from 'react-icons/fi';

const surface = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const control =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-800';

const PageIntro = ({ title, description, action, icon: Icon, onAction, actionDisabled = false }) => (
  <div className='mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
    <div>
      <h2 className='text-xl font-bold tracking-tight'>{title}</h2>
      <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{description}</p>
    </div>
    {action && (
      <button
        type='button'
        onClick={onAction}
        disabled={actionDisabled}
        className='button inline-flex w-fit items-center gap-2 text-sm disabled:cursor-wait disabled:opacity-60'
      >
        <Icon aria-hidden='true' /> {action}
      </button>
    )}
  </div>
);

const settingsSections = ['Details', 'Workflow', 'Issue types', 'Priorities', 'Labels', 'Access', 'Danger zone'];

const Field = ({ label, children, full = false }) => (
  <label className={`text-xs font-semibold text-slate-700 dark:text-slate-300 ${full ? 'sm:col-span-2' : ''}`}>
    {label}
    {children}
  </label>
);

const ISSUE_TYPE_OPTIONS = ['task', 'story', 'bug', 'epic', 'feature', 'improvement', 'research'];
const PRIORITY_OPTIONS = ['highest', 'high', 'medium', 'low', 'lowest'];
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const DetailsPanel = ({ project, form, onFieldChange, saveError }) => (
  <>
    <PanelHeading title='Project details' description='Names, defaults, and dates shown throughout the workspace.' />
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field label='Project name'>
        <input className={control} value={form.name} onChange={(event) => onFieldChange('name', event.target.value)} />
      </Field>
      <Field label='Project key'>
        <input className={control} value={project.key} disabled />
      </Field>
      <Field label='Description' full>
        <textarea
          className={`${control} min-h-24 resize-y`}
          value={form.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
        />
      </Field>
      <Field label='Default issue type'>
        <select
          className={control}
          value={form.defaultIssueType}
          onChange={(event) => onFieldChange('defaultIssueType', event.target.value)}
        >
          {ISSUE_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {capitalize(type)}
            </option>
          ))}
        </select>
      </Field>
      <Field label='Default priority'>
        <select
          className={control}
          value={form.defaultPriority}
          onChange={(event) => onFieldChange('defaultPriority', event.target.value)}
        >
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {capitalize(priority)}
            </option>
          ))}
        </select>
      </Field>
    </div>
    {saveError && <p className='mt-4 text-xs font-semibold text-rose-600 dark:text-rose-300'>{saveError}</p>}
  </>
);

const CATEGORY_OPTIONS = [
  ['backlog', 'Backlog'],
  ['todo', 'To do'],
  ['in_progress', 'In progress'],
  ['done', 'Done']
];
const categoryLabel = (value) => CATEGORY_OPTIONS.find(([key]) => key === value)?.[1] || value;
const DEFAULT_STATUS_FORM = { name: '', category: 'todo', color: '#64748b', wipLimit: '' };
const toStatusPayload = (form) => ({
  name: form.name.trim(),
  category: form.category,
  color: form.color,
  wipLimit: form.wipLimit === '' ? undefined : Number(form.wipLimit)
});

const StatusEditRow = ({ form, onChange, onSave, onCancel, busy }) => (
  <div className='grid grid-cols-2 items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 last:border-0 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[auto_1fr_9rem_5rem_auto]'>
    <input
      type='color'
      value={form.color}
      onChange={(event) => onChange({ ...form, color: event.target.value })}
      className='h-8 w-8 rounded border border-slate-300 dark:border-slate-700'
      aria-label='Status color'
    />
    <input
      value={form.name}
      onChange={(event) => onChange({ ...form, name: event.target.value })}
      placeholder='Status name'
      className='min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'
    />
    <select
      value={form.category}
      onChange={(event) => onChange({ ...form, category: event.target.value })}
      className='rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'
    >
      {CATEGORY_OPTIONS.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
    <input
      type='number'
      min='1'
      value={form.wipLimit}
      onChange={(event) => onChange({ ...form, wipLimit: event.target.value })}
      placeholder='WIP'
      className='min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'
    />
    <div className='col-span-2 flex justify-end gap-1 sm:col-span-1'>
      <button
        type='button'
        onClick={onSave}
        disabled={busy || !form.name.trim()}
        className='rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60'
      >
        Save
      </button>
      <button
        type='button'
        onClick={onCancel}
        disabled={busy}
        className='rounded-lg px-2 py-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
      >
        <FiX />
      </button>
    </div>
  </div>
);

const WorkflowPanel = ({ project }) => {
  const [status, setStatus] = useState('loading');
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(DEFAULT_STATUS_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_STATUS_FORM);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setStatus('loading');
    const response = await fetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/statuses`, {
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message || 'Could not load workflow statuses.');
      setStatus('error');
      return;
    }
    setStatuses(payload.statuses);
    setStatus('ready');
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.key]);

  const createStatus = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(toStatusPayload(newForm))
    });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message || 'Could not create the status.');
      return;
    }
    setStatuses((current) => [...current, payload.status]);
    setAdding(false);
    setNewForm(DEFAULT_STATUS_FORM);
  };

  const beginEdit = (targetStatus) => {
    setEditingId(targetStatus.id);
    setEditForm({
      name: targetStatus.name,
      category: targetStatus.category,
      color: targetStatus.color,
      wipLimit: targetStatus.wipLimit ? String(targetStatus.wipLimit) : ''
    });
  };

  const saveEdit = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/issueboard/statuses/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(toStatusPayload(editForm))
    });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message || 'Could not save the status.');
      return;
    }
    setStatuses((current) => current.map((entry) => (entry.id === payload.status.id ? payload.status : entry)));
    setEditingId(null);
  };

  const deleteStatus = async (statusId) => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/issueboard/statuses/${statusId}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message || 'Could not delete the status.');
      return;
    }
    setStatuses((current) => current.filter((entry) => entry.id !== statusId));
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= statuses.length) return;
    const reordered = [...statuses];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setStatuses(reordered);
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/statuses/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ statusIds: reordered.map((entry) => entry.id) })
    });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message || 'Could not reorder statuses.');
      setStatuses(statuses);
      return;
    }
    setStatuses(payload.statuses);
  };

  return (
    <>
      <PanelHeading
        title='Workflow statuses'
        description='Control the order and work-in-progress limits used by sprint lanes.'
        action='Add status'
        onAction={() => setAdding((open) => !open)}
      />
      {status === 'loading' && <p className='text-sm text-slate-500'>Loading…</p>}
      {status === 'error' && <p className='text-sm font-semibold text-rose-600 dark:text-rose-300'>{error}</p>}
      {status === 'ready' && (
        <div className='overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
          {statuses.map((entry, index) =>
            editingId === entry.id ? (
              <StatusEditRow
                key={entry.id}
                form={editForm}
                onChange={setEditForm}
                onSave={saveEdit}
                onCancel={() => setEditingId(null)}
                busy={busy}
              />
            ) : (
              <div
                key={entry.id}
                className='grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0 dark:border-slate-800 sm:grid-cols-[auto_auto_1fr_8rem_5rem_auto]'
              >
                <div className='flex flex-col'>
                  <button
                    type='button'
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || busy}
                    aria-label={`Move ${entry.name} up`}
                    className='text-slate-400 hover:text-slate-700 disabled:opacity-30 dark:hover:text-slate-200'
                  >
                    <FiArrowUp className='size-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => move(index, 1)}
                    disabled={index === statuses.length - 1 || busy}
                    aria-label={`Move ${entry.name} down`}
                    className='text-slate-400 hover:text-slate-700 disabled:opacity-30 dark:hover:text-slate-200'
                  >
                    <FiArrowDown className='size-3.5' />
                  </button>
                </div>
                <span className='size-2.5 rounded-full' style={{ backgroundColor: entry.color }} />
                <strong className='truncate text-sm'>{entry.name}</strong>
                <span className='hidden text-xs text-slate-500 sm:block'>{categoryLabel(entry.category)}</span>
                <span className='text-right text-xs text-slate-500'>
                  {entry.wipLimit ? `WIP ${entry.wipLimit}` : '—'}
                </span>
                <div className='flex justify-end gap-1'>
                  <button
                    type='button'
                    onClick={() => beginEdit(entry)}
                    className='rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  >
                    Edit
                  </button>
                  <button
                    type='button'
                    onClick={() => deleteStatus(entry.id)}
                    disabled={busy}
                    aria-label={`Delete ${entry.name}`}
                    className='rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950'
                  >
                    <FiTrash2 className='size-3.5' />
                  </button>
                </div>
              </div>
            )
          )}
          {adding && (
            <StatusEditRow
              form={newForm}
              onChange={setNewForm}
              onSave={createStatus}
              onCancel={() => setAdding(false)}
              busy={busy}
            />
          )}
        </div>
      )}
      {status === 'ready' && error && (
        <p className='mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{error}</p>
      )}
    </>
  );
};

const SimpleRows = ({ rows, action }) => (
  <div className='space-y-2'>
    {rows.map(({ name, detail, color }) => (
      <div
        key={name}
        className='flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800'
      >
        <span className={`size-3 rounded-full ${color}`} />
        <div className='min-w-0 flex-1'>
          <strong className='block text-sm'>{name}</strong>
          <span className='text-xs text-slate-500'>{detail}</span>
        </div>
        <button
          type='button'
          className='rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          {action}
        </button>
      </div>
    ))}
  </div>
);

const PanelHeading = ({ title, description, action, onAction }) => (
  <div className='mb-5 flex items-start justify-between gap-3'>
    <div>
      <h3 className='font-bold'>{title}</h3>
      <p className='mt-1 text-sm text-slate-500'>{description}</p>
    </div>
    {action && (
      <button
        type='button'
        onClick={onAction}
        className='inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950'
      >
        <FiPlus /> {action}
      </button>
    )}
  </div>
);

const SettingsPanel = ({
  section,
  project,
  form,
  onFieldChange,
  saveError,
  archiveState,
  onArchive,
  onCancelArchive
}) => {
  if (section === 'Details')
    return <DetailsPanel project={project} form={form} onFieldChange={onFieldChange} saveError={saveError} />;
  if (section === 'Workflow') return <WorkflowPanel project={project} />;
  if (section === 'Issue types')
    return (
      <>
        <PanelHeading
          title='Issue types'
          description='Choose the work types available when creating an issue.'
          action='Add type'
        />
        <SimpleRows
          action='Edit'
          rows={[
            { name: 'Task', detail: 'General work item', color: 'bg-blue-500' },
            { name: 'Story', detail: 'User-facing outcome', color: 'bg-emerald-500' },
            { name: 'Bug', detail: 'Unexpected behavior', color: 'bg-rose-500' },
            { name: 'Epic', detail: 'Large body of related work', color: 'bg-violet-500' }
          ]}
        />
      </>
    );
  if (section === 'Priorities')
    return (
      <>
        <PanelHeading
          title='Priorities'
          description='Order and color-code the urgency levels used by this project.'
          action='Add priority'
        />
        <SimpleRows
          action='Edit'
          rows={[
            { name: 'Highest', detail: 'Immediate attention', color: 'bg-rose-600' },
            { name: 'High', detail: 'Resolve soon', color: 'bg-orange-500' },
            { name: 'Medium', detail: 'Standard priority', color: 'bg-amber-500' },
            { name: 'Low', detail: 'Can wait', color: 'bg-sky-500' }
          ]}
        />
      </>
    );
  if (section === 'Labels')
    return (
      <>
        <PanelHeading
          title='Labels'
          description='Reusable categories. API-supplied unknown labels are created automatically.'
          action='Create label'
        />
        <SimpleRows
          action='Edit'
          rows={[
            { name: 'bug', detail: 'Defect or regression', color: 'bg-rose-500' },
            { name: 'enhancement', detail: 'Product improvement', color: 'bg-indigo-500' },
            { name: 'security', detail: 'Security-related work', color: 'bg-amber-500' },
            { name: 'documentation', detail: 'Content and guides', color: 'bg-teal-500' }
          ]}
        />
      </>
    );
  if (section === 'Access')
    return (
      <>
        <PanelHeading
          title='Project access'
          description='Access is enforced server-side and limited to approved identities.'
        />
        <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40'>
          <div className='flex gap-3'>
            <FiShield className='mt-0.5 shrink-0 text-emerald-700' />
            <div>
              <strong className='text-sm'>Administrator-only</strong>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
                Google-authenticated administrators currently have full project access. Future roles remain
                project-scoped.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  return (
    <>
      <PanelHeading
        title='Danger zone'
        description='Archiving hides the project from the workspace and prevents new work while preserving issues and audit history.'
      />
      <div className='rounded-xl border border-rose-200 p-4 dark:border-rose-900'>
        <strong className='text-sm text-rose-700 dark:text-rose-300'>Archive this project</strong>
        <p className='mt-1 text-sm text-slate-500'>
          Hide {project.name} and prevent new work while preserving issues and audit history.
        </p>
        {archiveState.error && (
          <p className='mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{archiveState.error}</p>
        )}
        {archiveState.confirming ? (
          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <span className='text-xs font-semibold text-rose-700 dark:text-rose-300'>Archive {project.name}?</span>
            <button
              type='button'
              onClick={onArchive}
              disabled={archiveState.busy}
              className='rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60'
            >
              {archiveState.busy ? 'Archiving…' : 'Yes, archive it'}
            </button>
            <button
              type='button'
              onClick={onCancelArchive}
              disabled={archiveState.busy}
              className='rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type='button'
            onClick={onArchive}
            className='mt-4 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950'
          >
            Archive project
          </button>
        )}
      </div>
    </>
  );
};

export const ProjectSettingsView = ({ project, onProjectUpdated, onProjectArchived }) => {
  const [section, setSection] = useState('Details');
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || '',
    defaultIssueType: project.defaultIssueType,
    defaultPriority: project.defaultPriority
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [archiveState, setArchiveState] = useState({ confirming: false, busy: false, error: null });

  const onFieldChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveDetails = async () => {
    setSaving(true);
    setSaveError(null);
    const response = await fetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form)
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok || !payload?.ok) {
      setSaveError(payload?.error?.message || 'Could not save project settings.');
      return;
    }
    onProjectUpdated?.(payload.project);
  };

  const onArchive = async () => {
    if (!archiveState.confirming) {
      setArchiveState({ confirming: true, busy: false, error: null });
      return;
    }
    setArchiveState((current) => ({ ...current, busy: true, error: null }));
    const response = await fetch(`/api/issueboard/projects/${encodeURIComponent(project.key)}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ archived: true })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      setArchiveState({
        confirming: true,
        busy: false,
        error: payload?.error?.message || 'Could not archive the project.'
      });
      return;
    }
    setArchiveState({ confirming: false, busy: false, error: null });
    onProjectArchived?.();
  };
  const onCancelArchive = () => setArchiveState({ confirming: false, busy: false, error: null });

  return (
    <section>
      <PageIntro
        title='Project settings'
        description={`Configure ${project.name} without weakening shared security rules.`}
        action={section === 'Details' ? (saving ? 'Saving…' : 'Save settings') : undefined}
        onAction={saveDetails}
        actionDisabled={saving}
        icon={FiSave}
      />
      <div className='grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]'>
        <nav
          className={`${surface} flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1`}
          aria-label='Project settings sections'
        >
          {settingsSections.map((item) => (
            <button
              key={item}
              type='button'
              onClick={() => setSection(item)}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition lg:w-full ${section === item ? (item === 'Danger zone' ? 'bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950' : 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200') : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {item}
            </button>
          ))}
        </nav>
        <article className={`${surface} min-w-0 p-5 md:p-6`}>
          <SettingsPanel
            section={section}
            project={project}
            form={form}
            onFieldChange={onFieldChange}
            saveError={saveError}
            archiveState={archiveState}
            onArchive={onArchive}
            onCancelArchive={onCancelArchive}
          />
        </article>
      </div>
    </section>
  );
};

const HealthRow = ({ label, value, healthy = false }) => (
  <div className='flex items-center justify-between gap-4 border-t border-slate-100 py-2.5 text-sm first:border-0 dark:border-slate-800'>
    <span className='text-slate-500'>{label}</span>
    <strong
      className={`text-right text-xs ${healthy ? 'inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300' : ''}`}
    >
      {healthy && <FiCheck aria-hidden='true' />}
      {value}
    </strong>
  </div>
);

const IntegrationCard = ({ icon: Icon, name, description, status, statusTone = 'green', action, children }) => (
  <article className={`${surface} min-w-0 p-5`}>
    <div className='flex items-start justify-between gap-3'>
      <div className='flex min-w-0 gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
          <Icon />
        </span>
        <div>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone === 'green' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : statusTone === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {status}
          </span>
          <h3 className='mt-2 font-bold'>{name}</h3>
          <p className='mt-0.5 text-xs leading-5 text-slate-500'>{description}</p>
        </div>
      </div>
      <button
        type='button'
        disabled={status === 'Deferred'}
        className='shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800'
      >
        {action}
      </button>
    </div>
    <div className='mt-5'>{children}</div>
  </article>
);

export const IntegrationsHealthView = () => {
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/issueboard/health', { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      setHealth(payload);
    } catch {
      setHealth({
        ok: false,
        status: 'unavailable',
        error: { message: 'The health check could not be reached.' },
        components: {}
      });
    } finally {
      setChecking(false);
    }
  };

  const databaseStatus = health?.components?.database?.status;
  const storageStatus = health?.components?.storage?.status;
  const schemaStatus = health?.components?.schema?.status;
  const supabaseStatus = health
    ? health.ok
      ? 'Connected'
      : health.status === 'unconfigured'
        ? 'Not configured'
        : 'Unavailable'
    : 'Not checked';

  return (
    <section>
      <PageIntro
        title='Integrations and health'
        description='Private configuration state, capacity, and recovery guidance.'
        action={checking ? 'Checking…' : 'Run health check'}
        icon={FiRefreshCw}
        onAction={runHealthCheck}
        actionDisabled={checking}
      />
      {health && (
        <div
          className={`mb-5 flex gap-3 rounded-2xl border p-4 ${health.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100'}`}
          role='status'
        >
          {health.ok ? (
            <FiCheck className='mt-0.5 shrink-0 text-xl' />
          ) : (
            <FiAlertTriangle className='mt-0.5 shrink-0 text-xl' />
          )}
          <div>
            <strong className='text-sm'>
              {health.ok ? 'All issueboard services are ready' : 'Issueboard services need attention'}
            </strong>
            <p className='mt-1 text-xs opacity-75'>
              {health.error?.message || `Checked ${new Date(health.checkedAt).toLocaleString()}`}
            </p>
            {health.requestId && <p className='mt-1 text-[10px] opacity-60'>Request ID: {health.requestId}</p>}
          </div>
        </div>
      )}
      <div className='mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'>
        <FiAlertTriangle className='mt-0.5 shrink-0 text-xl' aria-hidden='true' />
        <div>
          <strong className='text-sm'>Free Plan availability</strong>
          <p className='mt-1 text-sm leading-5 text-amber-900/75 dark:text-amber-100/70'>
            Supabase can pause low-activity projects. Provider unavailability is shown as maintenance—not as an empty
            board. Upgrade for availability-sensitive use.
          </p>
        </div>
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <IntegrationCard
          icon={FiDatabase}
          name='Supabase'
          description='PostgreSQL and private issue attachments'
          status={supabaseStatus}
          statusTone={health?.ok ? 'green' : health ? 'gray' : 'blue'}
          action='Configure'
        >
          <div className='mb-4'>
            <div className='mb-2 flex justify-between text-xs'>
              <span className='text-slate-500'>Private storage</span>
              <strong>184 MB / 1 GB</strong>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
              <span className='block h-full w-[18.4%] rounded-full bg-emerald-500' />
            </div>
          </div>
          <HealthRow label='Database' value={databaseStatus || 'Not checked'} healthy={databaseStatus === 'ready'} />
          <HealthRow
            label='Private bucket'
            value={storageStatus || 'Not checked'}
            healthy={storageStatus === 'ready'}
          />
          <HealthRow label='Schema' value={schemaStatus || 'Not checked'} healthy={schemaStatus === 'current'} />
          <HealthRow
            label='Last checked'
            value={health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : 'Not checked'}
          />
        </IntegrationCard>
        <IntegrationCard
          icon={FiSlack}
          name='Slack'
          description='Structured issue creation from mobile and desktop'
          status='Connected'
          action='Configure'
        >
          <HealthRow label='Request signatures' value='Enforced' healthy />
          <HealthRow label='Allowed workspace' value='1 configured' />
          <HealthRow label='Allowed users' value='1 configured' />
          <HealthRow label='Last issue' value='PORT-74 · 2h ago' />
        </IntegrationCard>
        <IntegrationCard
          icon={FiImage}
          name='Image pipeline'
          description='Browser compression and signed direct uploads'
          status='Website'
          statusTone='blue'
          action='Test upload'
        >
          <HealthRow label='Compression target' value='1 MB / 1920 px' />
          <HealthRow label='Upload route' value='Direct' healthy />
          <HealthRow label='Pending cleanup' value='0 objects' />
        </IntegrationCard>
        <IntegrationCard
          icon={FiCloud}
          name='Discord'
          description='Optional adapter after Slack acceptance'
          status='Deferred'
          statusTone='gray'
          action='Not configured'
        >
          <HealthRow label='Runtime access' value='Disabled' />
          <HealthRow label='Priority' value='Future' />
        </IntegrationCard>
        <div className='xl:col-span-2'>
          <IntegrationCard
            icon={FiCode}
            name='Issue API'
            description='Create issues directly from approved services and automation'
            status='Planned'
            statusTone='blue'
            action='View specification'
          >
            <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.85fr)]'>
              <div>
                <div className='flex flex-wrap items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-100'>
                  <span className='rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-300'>POST</span>
                  <span>/api/issues</span>
                </div>
                <p className='mt-3 text-xs leading-5 text-slate-500'>
                  Server-to-server requests will require a scoped credential, idempotency key, JSON content type, and
                  project authorization. Credentials will never be exposed in browser code.
                </p>
                <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                  <HealthRow label='Authentication' value='Bearer API key' />
                  <HealthRow label='Idempotency' value='Required header' />
                  <HealthRow label='Request format' value='application/json' />
                  <HealthRow label='Attachment bytes' value='Not accepted' />
                </div>
              </div>
              <div>
                <h4 className='text-xs font-bold uppercase tracking-wide text-slate-500'>Request parameters</h4>
                <div className='mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
                  {[
                    ['projectKey', 'string', 'Required', 'Target project key'],
                    ['title', 'string', 'Required', 'Issue title'],
                    ['issueType', 'string', 'Required', 'Task, story, bug, or epic'],
                    ['description', 'markdown', 'Optional', 'Description and checklist'],
                    ['priority', 'string', 'Optional', 'Defaults to project setting'],
                    ['labels', 'string[]', 'Optional', 'Unknown labels are created'],
                    ['sprintId', 'uuid', 'Optional', 'Target sprint'],
                    ['parentIssueKey', 'string', 'Optional', 'Parent for a subtask'],
                    ['relationships', 'object[]', 'Optional', 'Links, blocks, or blocked by']
                  ].map(([name, type, requirement, detail]) => (
                    <div
                      key={name}
                      className='grid grid-cols-[minmax(7rem,1fr)_auto] gap-x-3 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800'
                    >
                      <code className='min-w-0 break-all text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
                        {name}
                      </code>
                      <span
                        className={`text-[10px] font-bold ${requirement === 'Required' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-400'}`}
                      >
                        {requirement}
                      </span>
                      <span className='text-[10px] text-slate-400'>{type}</span>
                      <span className='text-right text-[10px] text-slate-500'>{detail}</span>
                    </div>
                  ))}
                </div>
                <p className='mt-3 flex gap-2 text-xs leading-5 text-slate-500'>
                  <FiLock className='mt-0.5 shrink-0' />
                  Images will use the existing signed direct-upload authorization and finalize flow; image bodies will
                  not pass through this API or Vercel functions.
                </p>
              </div>
            </div>
          </IntegrationCard>
        </div>
      </div>
      <div className={`${surface} mt-4 grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center`}>
        <div className='flex gap-3'>
          <FiShield className='mt-0.5 shrink-0 text-emerald-700' />
          <div>
            <strong className='text-sm'>Recovery checklist</strong>
            <p className='mt-1 text-sm text-slate-500'>
              Resume Supabase, verify schema and bucket access, then test one signed upload before reopening mutations.
            </p>
          </div>
        </div>
        <button
          type='button'
          className='inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950'
        >
          Open operations guide <FiExternalLink />
        </button>
      </div>
    </section>
  );
};
