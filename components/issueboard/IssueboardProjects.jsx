import Link from 'next/link';
import { useState } from 'react';
import { FiArchive, FiArrowRight, FiCheck, FiMoreHorizontal, FiPlus, FiSettings, FiX } from 'react-icons/fi';
import { workspaceHref } from '@utils/issueboardNavigation';

const ProjectMetric = ({ value, label }) => (
  <div>
    <strong className='block text-lg'>{value}</strong>
    <span className='text-[11px] text-slate-500'>{label}</span>
  </div>
);

const NewProjectDialog = ({ onClose }) => (
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
    <section className='relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900'>
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
            className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal outline-none focus:border-emerald-600 dark:border-slate-700'
            placeholder='e.g. API Platform'
          />
        </label>
        <label className='text-xs font-semibold'>
          Project key
          <input
            className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal uppercase outline-none focus:border-emerald-600 dark:border-slate-700'
            placeholder='API'
            maxLength={10}
          />
        </label>
        <label className='text-xs font-semibold sm:col-span-2'>
          Description
          <textarea
            className='mt-1.5 min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal outline-none focus:border-emerald-600 dark:border-slate-700'
            placeholder='What work belongs in this project?'
          />
        </label>
        <label className='text-xs font-semibold'>
          Workflow template
          <select className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal dark:border-slate-700'>
            <option>Software delivery</option>
            <option>Simple task tracking</option>
            <option>Blank workflow</option>
          </select>
        </label>
        <label className='text-xs font-semibold'>
          Default issue type
          <select className='mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 font-normal dark:border-slate-700'>
            <option>Task</option>
            <option>Story</option>
            <option>Bug</option>
          </select>
        </label>
        <div className='flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-slate-600 sm:col-span-2 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-300'>
          <FiCheck className='mt-0.5 shrink-0 text-emerald-600' />
          <p>The project is private by default and inherits the workspace’s server-side administrator access policy.</p>
        </div>
      </div>
      <footer className='flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800'>
        <button
          type='button'
          onClick={onClose}
          className='rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          Cancel
        </button>
        <button type='button' className='button text-xs'>
          Create project
        </button>
      </footer>
    </section>
  </div>
);

const ProjectsView = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      <div className='grid gap-4 xl:grid-cols-2'>
        <article className='rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-slate-900'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'>
                  PORT
                </span>
                <span className='rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200'>
                  Current
                </span>
              </div>
              <h3 className='mt-3 font-bold'>Portfolio Website</h3>
              <p className='mt-1 text-xs leading-5 text-slate-500'>
                Website, publishing, issueboard, and platform work.
              </p>
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
                  <button
                    type='button'
                    className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                  >
                    <FiArchive /> Archive project
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className='mt-5 grid grid-cols-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
            <ProjectMetric value='24' label='Open' />
            <ProjectMetric value='1' label='Active sprint' />
            <ProjectMetric value='62%' label='Progress' />
          </div>
          <div className='mt-5'>
            <div className='mb-2 flex justify-between text-[11px]'>
              <span className='text-slate-500'>Sprint 04 progress</span>
              <strong>18 / 29 points</strong>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
              <span className='block h-full w-[62%] rounded-full bg-emerald-500' />
            </div>
          </div>
          <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800'>
            <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300'>
              <span className='size-2 rounded-full bg-emerald-500' />
              Healthy · checked just now
            </span>
            <Link
              href={workspaceHref('overview')}
              className='inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-300'
            >
              Open project <FiArrowRight />
            </Link>
          </div>
        </article>
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
            <span className='mt-1 block text-xs text-slate-500'>
              Choose a key, workflow, and default issue settings.
            </span>
          </span>
        </button>
      </div>
      {createOpen && <NewProjectDialog onClose={() => setCreateOpen(false)} />}
    </section>
  );
};

export default ProjectsView;
