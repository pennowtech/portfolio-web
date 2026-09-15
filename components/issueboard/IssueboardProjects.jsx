import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { FiArrowRight, FiCheck, FiMoreHorizontal, FiPlus, FiSettings, FiX } from 'react-icons/fi';
import { workspaceHref } from '@utils/issueboardNavigation';

const jsonFetch = async (url, init) => {
  const response = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(init?.headers || {}) } });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, payload };
};

const ProjectMetric = ({ value, label }) => (
  <div>
    <strong className='block text-lg'>{value}</strong>
    <span className='text-[11px] text-slate-500'>{label}</span>
  </div>
);

const NewProjectDialog = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [description, setDescription] = useState('');
  const [defaultIssueType, setDefaultIssueType] = useState('task');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { ok, payload } = await jsonFetch('/api/issueboard/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectKey, name, description, defaultIssueType })
    });
    if (!ok || !payload?.ok) {
      setError(payload?.error?.message || 'Could not create the project.');
      setSubmitting(false);
      return;
    }
    onCreated(payload.project);
    onClose();
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='new-project-title'
    >
      <button
        type='button'
        className='absolute inset-0 size-full'
        aria-label='Close new project dialog'
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className='relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900'
      >
        <header className='flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800'>
          <div>
            <h3 id='new-project-title' className='font-bold'>
              Create project
            </h3>
            <p className='mt-1 text-xs text-slate-500'>
              Set the identity and starting workflow. You can refine everything later.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          >
            <FiX />
          </button>
        </header>
        <div className='grid gap-4 p-5 sm:grid-cols-2'>
          <label className='text-xs font-semibold'>
            Project name
            <input
              autoFocus
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal outline-none focus:border-emerald-600 dark:border-slate-700'
              placeholder='e.g. API Platform'
            />
          </label>
          <label className='text-xs font-semibold'>
            Project key
            <input
              required
              maxLength={10}
              value={projectKey}
              onChange={(event) => setProjectKey(event.target.value.toUpperCase())}
              className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal uppercase outline-none focus:border-emerald-600 dark:border-slate-700'
              placeholder='API'
            />
          </label>
          <label className='text-xs font-semibold sm:col-span-2'>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className='mt-1.5 min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal outline-none focus:border-emerald-600 dark:border-slate-700'
              placeholder='What work belongs in this project?'
            />
          </label>
          <label className='text-xs font-semibold sm:col-span-2'>
            Default issue type
            <select
              value={defaultIssueType}
              onChange={(event) => setDefaultIssueType(event.target.value)}
              className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal dark:border-slate-700'
            >
              <option value='task'>Task</option>
              <option value='story'>Story</option>
              <option value='bug'>Bug</option>
              <option value='epic'>Epic</option>
            </select>
          </label>
          <div className='flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-slate-600 sm:col-span-2 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-300'>
            <FiCheck className='mt-0.5 shrink-0 text-emerald-600' />
            <p>
              The project is private by default and inherits the workspace’s server-side administrator access policy.
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
            className='rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={submitting}
            className='button text-xs disabled:cursor-not-allowed disabled:opacity-60'
          >
            {submitting ? 'Creating…' : 'Create project'}
          </button>
        </footer>
      </form>
    </div>
  );
};

const ProjectCard = ({ project, openCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'>
            {project.key}
          </span>
          <h3 className='mt-3 font-bold'>{project.name}</h3>
          {project.description && <p className='mt-1 text-xs leading-5 text-slate-500'>{project.description}</p>}
        </div>
        <div className='relative'>
          <button
            type='button'
            onClick={() => setMenuOpen((open) => !open)}
            aria-label='Project actions'
            className='grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          >
            <FiMoreHorizontal />
          </button>
          {menuOpen && (
            <div className='absolute right-0 top-9 z-10 w-40 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900'>
              <Link
                href={workspaceHref('settings')}
                className='flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800'
              >
                <FiSettings /> Project settings
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className='mt-5 grid grid-cols-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
        <ProjectMetric value={typeof openCount === 'number' ? openCount : '—'} label='Open issues' />
        <ProjectMetric value='None' label='Active sprint' />
      </div>
      <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800'>
        <span className='text-[11px] text-slate-500'>Created {new Date(project.createdAt).toLocaleDateString()}</span>
        <Link
          href={workspaceHref('overview')}
          className='inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-300'
        >
          Open project <FiArrowRight />
        </Link>
      </div>
    </article>
  );
};

const ProjectsView = () => {
  const [status, setStatus] = useState('loading');
  const [projects, setProjects] = useState([]);
  const [openCounts, setOpenCounts] = useState({});
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    const { ok, payload } = await jsonFetch('/api/issueboard/projects');
    if (!ok || !payload?.ok) {
      setStatus('unavailable');
      setError(payload?.error?.message || 'Issue management is temporarily unavailable.');
      return;
    }
    setProjects(payload.projects);
    setStatus('ready');

    const counts = await Promise.all(
      payload.projects.map(async (project) => {
        const issuesResult = await jsonFetch(`/api/issueboard/issues?projectKey=${encodeURIComponent(project.key)}`);
        return [project.key, issuesResult.payload?.issues?.length];
      })
    );
    setOpenCounts(Object.fromEntries(counts));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className='mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold tracking-tight'>Projects</h2>
          <p className='mt-1 text-sm text-slate-500'>
            Separate workflows and planning while keeping one private workspace.
          </p>
        </div>
        <button
          type='button'
          onClick={() => setCreateOpen(true)}
          className='button inline-flex w-fit items-center gap-2 text-sm'
        >
          <FiPlus /> New project
        </button>
      </div>

      {status === 'unavailable' && (
        <div className='rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
          <strong className='block'>Issue management is temporarily unavailable</strong>
          <p className='mt-1 text-xs leading-5'>{error}</p>
        </div>
      )}

      {status === 'ready' && (
        <div className='grid gap-4 xl:grid-cols-2'>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} openCount={openCounts[project.key]} />
          ))}
          <button
            type='button'
            onClick={() => setCreateOpen(true)}
            className='group grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20'
          >
            <span>
              <span className='mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-xl text-emerald-700 transition group-hover:scale-105 dark:bg-emerald-950 dark:text-emerald-300'>
                <FiPlus />
              </span>
              <strong className='mt-4 block text-sm'>Create another project</strong>
              <span className='mt-1 block text-xs text-slate-500'>Choose a key and default issue type.</span>
            </span>
          </button>
        </div>
      )}

      {createOpen && (
        <NewProjectDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(project) => {
            setProjects((current) => [...current, project]);
            setOpenCounts((current) => ({ ...current, [project.key]: 0 }));
          }}
        />
      )}
    </section>
  );
};

export default ProjectsView;
