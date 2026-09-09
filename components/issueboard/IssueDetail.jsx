import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { FiArrowLeft, FiCheck, FiLink2, FiMoreHorizontal, FiPaperclip, FiPlus, FiX } from 'react-icons/fi';
import IssueboardShell from './IssueboardShell';
import { issueboardIssues } from '@utils/issueboardFixtures';
import { getSafeIssueboardReturnTo } from '@utils/issueboardNavigation';

const initialChecklist = [
  { id: 'mime', text: 'Validate MIME type and decoded dimensions', done: true, subtask: null },
  { id: 'worker', text: 'Compress in a Web Worker', done: true, subtask: { key: 'PORT-82', status: 'Done' } },
  {
    id: 'signed',
    text: 'Create signed direct-upload authorization',
    done: false,
    subtask: { key: 'PORT-83', status: 'In progress' }
  },
  { id: 'verify', text: 'Verify stored object during finalization', done: false, subtask: null }
];

const IssueDetail = ({ adminEmail, issueKey }) => {
  const router = useRouter();
  const issue = issueboardIssues.find((entry) => entry.key === issueKey) || issueboardIssues[0];
  const [checklist, setChecklist] = useState(initialChecklist);
  const [menuFor, setMenuFor] = useState(null);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const returnTo = useMemo(() => getSafeIssueboardReturnTo(router.query.returnTo), [router.query.returnTo]);

  const closeIssue = () => router.push(returnTo);
  const setLinkedCompletion = (id, done) => {
    setChecklist((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, done, subtask: item.subtask ? { ...item.subtask, status: done ? 'Done' : 'To do' } : null }
          : item
      )
    );
  };
  const setSubtaskCompletion = (id, done) => setLinkedCompletion(id, done);
  const linkSubtask = (id) => {
    setChecklist((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, subtask: item.subtask || { key: 'PORT-NEW', status: item.done ? 'Done' : 'To do' } }
          : item
      )
    );
    setMenuFor(null);
  };
  const unlinkSubtask = (id) => {
    setChecklist((items) => items.map((item) => (item.id === id ? { ...item, subtask: null } : item)));
    setMenuFor(null);
  };
  const createSubtaskFromBullet = () => {
    setChecklist((items) => [
      ...items,
      {
        id: `bullet-${Date.now()}`,
        text: 'Keep the longest edge below 1920 pixels.',
        done: false,
        subtask: { key: 'PORT-NEW', status: 'To do' }
      }
    ]);
    setMenuFor(null);
  };

  return (
    <IssueboardShell adminEmail={adminEmail} currentView='' title={issue.key}>
      <div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
        <button
          type='button'
          onClick={closeIssue}
          className='inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
        >
          <FiArrowLeft /> Close issue
        </button>
        <div className='flex gap-2'>
          <button
            type='button'
            className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-900'
          >
            Archive
          </button>
          <button type='button' className='button'>
            Save changes
          </button>
        </div>
      </div>
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_21rem]'>
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7 dark:border-slate-800 dark:bg-slate-900'>
          <span className='text-xs font-bold uppercase tracking-wider text-slate-500'>
            {issue.key} · {issue.type}
          </span>
          <h2 className='my-3 text-2xl font-bold tracking-tight md:text-3xl'>{issue.title}</h2>
          <div className='space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
            <p>
              Portrait screenshots larger than 4 MB must be resized and compressed in the browser before direct upload
              to private Supabase Storage.
            </p>
            <ul className='space-y-2 pl-5'>
              <li className='group relative list-disc pr-10'>
                Keep the longest edge below 1920 pixels.
                <button
                  type='button'
                  onClick={() => setMenuFor('bullet')}
                  aria-label='Open bullet quick menu'
                  className='absolute right-0 top-0 grid size-7 place-items-center rounded-md opacity-100 hover:bg-slate-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-slate-800'
                >
                  <FiMoreHorizontal />
                </button>
                {menuFor === 'bullet' && (
                  <QuickMenu onCreate={createSubtaskFromBullet} onLink={createSubtaskFromBullet} />
                )}
              </li>
              <li className='list-disc'>Show original and compressed byte sizes.</li>
              <li className='list-disc'>Never send image bytes through a Vercel Function.</li>
            </ul>
          </div>

          <SectionHeading title='Checklist' action='Add item' />
          <div className='mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
            <div
              className='h-full rounded-full bg-emerald-600'
              style={{ width: `${(checklist.filter((item) => item.done).length / checklist.length) * 100}%` }}
            />
          </div>
          <div className='divide-y divide-slate-100 dark:divide-slate-800'>
            {checklist.map((item) => (
              <div key={item.id} className='group relative flex items-start gap-3 py-3'>
                <input
                  type='checkbox'
                  checked={item.done}
                  onChange={(event) => setLinkedCompletion(item.id, event.target.checked)}
                  className='mt-1 size-4 accent-emerald-700'
                />
                <div className='min-w-0 flex-1'>
                  <span className={item.done ? 'text-slate-400 line-through' : ''}>{item.text}</span>
                  {item.subtask && (
                    <div className='mt-1 flex flex-wrap items-center gap-2 text-xs'>
                      <span className='inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400'>
                        <FiLink2 /> {item.subtask.key}
                      </span>
                      <button
                        type='button'
                        onClick={() => setSubtaskCompletion(item.id, item.subtask.status !== 'Done')}
                        className={`rounded-full px-2 py-0.5 font-bold ${item.subtask.status === 'Done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                      >
                        {item.subtask.status}
                      </button>
                      <span className='text-slate-400'>Two-way synchronized</span>
                    </div>
                  )}
                </div>
                <button
                  type='button'
                  aria-label={`Open actions for ${item.text}`}
                  onClick={() => setMenuFor(menuFor === item.id ? null : item.id)}
                  className='grid size-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800'
                >
                  <FiMoreHorizontal />
                </button>
                {menuFor === item.id && (
                  <QuickMenu
                    linked={Boolean(item.subtask)}
                    onCreate={() => linkSubtask(item.id)}
                    onLink={() => linkSubtask(item.id)}
                    onUnlink={() => unlinkSubtask(item.id)}
                  />
                )}
              </div>
            ))}
          </div>

          <SectionHeading title='Subtasks' action='Add subtask' />
          <div className='space-y-2'>
            {checklist
              .filter((item) => item.subtask)
              .map((item) => (
                <div
                  key={item.id}
                  className='flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950'
                >
                  <span className='grid size-7 place-items-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700'>
                    T
                  </span>
                  <div className='min-w-[12rem] flex-1'>
                    <strong className='text-sm'>{item.subtask.key}</strong>
                    <p className='truncate text-xs text-slate-500'>{item.text}</p>
                  </div>
                  <label className='inline-flex items-center gap-2 text-xs'>
                    <input
                      type='checkbox'
                      checked={item.subtask.status === 'Done'}
                      onChange={(event) => setSubtaskCompletion(item.id, event.target.checked)}
                      className='accent-emerald-700'
                    />{' '}
                    Close subtask
                  </label>
                </div>
              ))}
          </div>

          <div className='mt-8 flex items-center justify-between'>
            <h3 className='font-bold'>Relationships</h3>
            <button
              type='button'
              onClick={() => setRelationshipOpen((open) => !open)}
              className='inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950'
            >
              <FiPlus /> Link issue
            </button>
          </div>
          {relationshipOpen && (
            <div className='mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800'>
              <label className='text-xs font-bold'>
                Relationship
                <select className='ml-2 rounded-lg border border-slate-300 bg-transparent px-2 py-1.5 dark:border-slate-700'>
                  <option>is blocked by</option>
                  <option>blocks</option>
                  <option>relates to</option>
                  <option>duplicates</option>
                  <option>parent of</option>
                </select>
              </label>
              <input
                className='mt-3 w-full rounded-lg border border-slate-300 bg-transparent p-2.5 text-sm dark:border-slate-700'
                placeholder='Search key or title…'
              />
              <div className='mt-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950'>
                <strong>PORT-72</strong> Configure database row-level security policies
              </div>
            </div>
          )}

          <SectionHeading title='Images and attachments' action='Add images' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <div className='aspect-[4/3] rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-500 p-3 text-xs font-bold text-emerald-950'>
              Private image preview
            </div>
            <button
              type='button'
              className='grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-emerald-400 text-center text-xs font-bold text-emerald-700'
            >
              <span>
                <FiPaperclip className='mx-auto mb-2' />
                Compress and upload
              </span>
            </button>
          </div>
          <SectionHeading title='Activity and comments' />
          <textarea
            className='min-h-24 w-full rounded-xl border border-slate-300 bg-transparent p-3 text-sm dark:border-slate-700'
            placeholder='Write a comment…'
          />
          <div className='mt-4 border-l-2 border-slate-200 pl-4 text-sm dark:border-slate-700'>
            <p>
              <strong>Sukhdeep</strong> completed “Compress in a Web Worker”
            </p>
            <span className='text-xs text-slate-500'>Today at 13:42</span>
          </div>
        </article>
        <aside className='h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          {[
            ['Status', issue.status],
            ['Priority', issue.priority],
            ['Assignee', 'Sukhdeep'],
            ['Sprint', 'Sprint 04'],
            ['Estimate', `${issue.estimate} points`],
            ['Due date', issue.due || '20 Sep 2026'],
            ['Source', 'Website']
          ].map(([label, value]) => (
            <div
              key={label}
              className='grid grid-cols-[6rem_1fr] gap-3 border-b border-slate-100 py-3 text-sm last:border-0 dark:border-slate-800'
            >
              <span className='text-xs text-slate-500'>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </aside>
      </div>
    </IssueboardShell>
  );
};

const SectionHeading = ({ title, action }) => (
  <div className='mb-3 mt-8 flex items-center justify-between'>
    <h3 className='font-bold'>{title}</h3>
    {action && (
      <button
        type='button'
        className='inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950'
      >
        <FiPlus /> {action}
      </button>
    )}
  </div>
);

const QuickMenu = ({ linked = false, onCreate, onLink, onUnlink }) => (
  <div className='absolute right-0 top-10 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900'>
    {!linked && (
      <>
        <button
          type='button'
          onClick={onCreate}
          className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          <FiCheck /> Create linked subtask
        </button>
        <button
          type='button'
          onClick={onLink}
          className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          <FiLink2 /> Link existing subtask
        </button>
      </>
    )}
    {linked && (
      <button
        type='button'
        onClick={onUnlink}
        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
      >
        <FiX /> Unlink subtask
      </button>
    )}
  </div>
);

export default IssueDetail;
