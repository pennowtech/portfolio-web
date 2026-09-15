import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { FiArrowLeft, FiCheck, FiLayers, FiMoreHorizontal, FiPaperclip, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import IssueboardShell from './IssueboardShell';
import MarkdownEditor, { MarkdownPreview } from './MarkdownEditor';
import { boardSubtasks, issueboardIssues } from '@utils/issueboardFixtures';
import { getSafeIssueboardReturnTo } from '@utils/issueboardNavigation';

const initialChecklist = [
  { id: 'mime', text: 'Validate MIME type and decoded dimensions', done: true },
  { id: 'worker', text: 'Compress in a Web Worker', done: true },
  { id: 'signed', text: 'Create signed direct-upload authorization', done: false },
  { id: 'verify', text: 'Verify stored object during finalization', done: false }
];

const initialDescription = `Portrait screenshots larger than **4 MB** must be resized and compressed in the browser before direct upload to private Supabase Storage.

- Keep the longest edge below 1920 pixels.
- Show original and compressed byte sizes.
- Never send image bytes through a Vercel Function.`;

const IssueDetail = ({ adminEmail, issueKey }) => {
  const router = useRouter();
  const issue = issueboardIssues.find((entry) => entry.key === issueKey) || issueboardIssues[0];
  const [checklist, setChecklist] = useState(initialChecklist);
  const [subtasks, setSubtasks] = useState(() => boardSubtasks.filter((subtask) => subtask.parentKey === issue.key));
  const [description, setDescription] = useState(initialDescription);
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [existingComment, setExistingComment] = useState(
    'Compression now preserves the original orientation and reports the **final file size**.'
  );
  const [existingCommentEditing, setExistingCommentEditing] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklistEditorOpen, setChecklistEditorOpen] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const returnTo = useMemo(() => getSafeIssueboardReturnTo(router.query.returnTo), [router.query.returnTo]);

  const closeIssue = () => router.push(returnTo);
  const setChecklistCompletion = (id, done) => {
    setChecklist((items) => items.map((item) => (item.id === id ? { ...item, done } : item)));
  };
  const deleteChecklistItem = (id) => {
    setChecklist((items) => items.filter((item) => item.id !== id));
    setMenuFor(null);
  };
  const createSubtask = (title) => {
    setSubtasks((items) => [
      ...items,
      {
        key: `PORT-${90 + items.length}`,
        parentKey: issue.key,
        title,
        status: 'To do',
        priority: 'Medium'
      }
    ]);
    setMenuFor(null);
  };
  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist((items) => [...items, { id: `checklist-${Date.now()}`, text: newChecklistItem.trim(), done: false }]);
    setNewChecklistItem('');
  };
  const beginIssueEdit = () => {
    const checklistMarkdown = checklist.map((item) => `- [${item.done ? 'x' : ' '}] ${item.text}`).join('\n');
    setDescription(`${description.trimEnd()}\n\n### Checklist\n\n${checklistMarkdown}`);
    setDescriptionEditing(true);
  };
  const finishIssueEdit = () => {
    const marker = /\n#{1,6}\s+Checklist\s*\n/i;
    const match = marker.exec(description);
    if (match) {
      const descriptionText = description.slice(0, match.index).trimEnd();
      const checklistText = description.slice(match.index + match[0].length);
      const parsedItems = [...checklistText.matchAll(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/gm)].map((item, index) => ({
        id: checklist[index]?.id || `checklist-${Date.now()}-${index}`,
        text: item[2].trim(),
        done: item[1].toLowerCase() === 'x'
      }));
      setDescription(descriptionText);
      setChecklist(parsedItems);
    }
    setDescriptionEditing(false);
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
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-sm font-semibold'>Description</h3>
            <button
              type='button'
              onClick={descriptionEditing ? finishIssueEdit : beginIssueEdit}
              className='rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950'
            >
              {descriptionEditing ? 'Done' : 'Edit'}
            </button>
          </div>
          {descriptionEditing ? (
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder='Describe the issue using Markdown…'
              ariaLabel='Issue description'
              minHeight='min-h-48'
            />
          ) : (
            <div className='py-2'>
              <MarkdownPreview>{description}</MarkdownPreview>
            </div>
          )}

          {!descriptionEditing && (
            <>
              <SectionHeading
                title='Checklist'
                count={`${checklist.filter((item) => item.done).length} of ${checklist.length}`}
                action='Add item'
                normalTitle
                onAction={() => setChecklistEditorOpen((open) => !open)}
              />
              <div className='mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                <div
                  className='h-full rounded-full bg-emerald-600'
                  style={{ width: `${(checklist.filter((item) => item.done).length / checklist.length) * 100}%` }}
                />
              </div>
              <div className='divide-y divide-slate-100 dark:divide-slate-800'>
                {checklist.map((item) => (
                  <div key={item.id} className='group relative flex min-h-8 items-center gap-2 py-1 text-sm leading-5'>
                    <input
                      type='checkbox'
                      checked={item.done}
                      onChange={(event) => setChecklistCompletion(item.id, event.target.checked)}
                      className='issueboard-checkbox'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className={item.done ? 'text-slate-400 line-through' : ''}>
                        <MarkdownPreview compact>{item.text}</MarkdownPreview>
                      </div>
                    </div>
                    <button
                      type='button'
                      aria-label={`Open actions for ${item.text}`}
                      onClick={() => setMenuFor(menuFor === item.id ? null : item.id)}
                      className='grid size-6 place-items-center rounded hover:bg-slate-100 dark:hover:bg-slate-800'
                    >
                      <FiMoreHorizontal />
                    </button>
                    {menuFor === item.id && (
                      <QuickMenu
                        onCreate={() => createSubtask(item.text)}
                        onDelete={() => deleteChecklistItem(item.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
              {checklistEditorOpen && (
                <div className='flex min-h-8 items-center gap-2 border-t border-slate-200 py-1 dark:border-slate-800'>
                  <input type='checkbox' disabled className='issueboard-checkbox' aria-hidden='true' />
                  <input
                    autoFocus
                    value={newChecklistItem}
                    onChange={(event) => setNewChecklistItem(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addChecklistItem();
                      }
                      if (event.key === 'Escape') setChecklistEditorOpen(false);
                    }}
                    placeholder='Type a checklist item and press Enter…'
                    aria-label='New checklist item'
                    className='h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-5 outline-none placeholder:text-slate-400 focus:ring-0'
                  />
                </div>
              )}
            </>
          )}

          <SectionHeading
            title='Subtasks'
            count={`${subtasks.filter((subtask) => subtask.status === 'Done').length} of ${subtasks.length}`}
            action='Add subtask'
          />
          <div className='overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
            {subtasks.map((subtask) => (
              <div
                key={subtask.key}
                className='grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-1.5 text-sm last:border-0 dark:border-slate-800'
              >
                <span className='grid size-5 place-items-center text-cyan-600' title='Subtask' aria-label='Subtask'>
                  <FiLayers className='size-3.5' />
                </span>
                <div className='min-w-0 truncate'>
                  <strong className='mr-2 text-xs'>{subtask.key}</strong>
                  <span>{subtask.title}</span>
                </div>
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold ${subtask.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : subtask.status === 'In progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}
                >
                  {subtask.status}
                </span>
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
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6'>
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
          <MarkdownEditor
            value={comment}
            onChange={setComment}
            placeholder='Write a comment using Markdown…'
            ariaLabel='Comment'
            minHeight='min-h-24'
          />
          <div className='mt-4 border-l-2 border-slate-200 pl-4 text-sm dark:border-slate-700'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <p className='mb-1'>
                  <strong>Sukhdeep</strong> commented
                </p>
                {existingCommentEditing ? (
                  <MarkdownEditor
                    value={existingComment}
                    onChange={setExistingComment}
                    ariaLabel='Edit comment'
                    minHeight='min-h-20'
                  />
                ) : (
                  <MarkdownPreview compact>{existingComment}</MarkdownPreview>
                )}
                <span className='text-xs text-slate-500'>Today at 13:42</span>
              </div>
              <button
                type='button'
                onClick={() => setExistingCommentEditing((editing) => !editing)}
                className='rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
              >
                {existingCommentEditing ? 'Done' : 'Edit'}
              </button>
            </div>
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
            ['Labels', issue.labels],
            ['Reporter', issue.creator?.name || 'Sukhdeep'],
            ['Source', 'Website'],
            ['Created', '7 Sep 2026']
          ].map(([label, value]) => (
            <div
              key={label}
              className='grid grid-cols-[6rem_1fr] gap-3 border-b border-slate-100 py-3 text-sm last:border-0 dark:border-slate-800'
            >
              <span className='text-xs text-slate-500'>{label}</span>
              {label === 'Labels' ? (
                <span className='flex flex-wrap gap-1'>
                  {value.map((item, index) => (
                    <span
                      key={item}
                      className={`inline-flex h-4 items-center rounded-full px-2 text-[10px] font-bold ${index % 2 === 0 ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200'}`}
                    >
                      {item}
                    </span>
                  ))}
                </span>
              ) : (
                <strong>{value}</strong>
              )}
            </div>
          ))}
        </aside>
      </div>
    </IssueboardShell>
  );
};

const SectionHeading = ({ title, count, action, normalTitle = false, onAction, editing = false }) => (
  <div className='mb-3 mt-8 flex items-center justify-between'>
    <h3 className={normalTitle ? 'text-base font-normal' : 'font-bold'}>
      {title}
      {count && (
        <span className='ml-2 inline-flex h-5 items-center rounded-full bg-slate-100 px-2 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
          {count}
        </span>
      )}
      {editing && (
        <span className='ml-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400'>
          Editing checklist
        </span>
      )}
    </h3>
    {action && (
      <button
        type='button'
        onClick={onAction}
        className='inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950'
      >
        <FiPlus /> {action}
      </button>
    )}
  </div>
);

const QuickMenu = ({ onCreate, onDelete }) => (
  <div className='absolute right-0 top-10 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900'>
    <button
      type='button'
      onClick={onCreate}
      className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800'
    >
      <FiCheck /> Create separate subtask
    </button>
    {onDelete && (
      <button
        type='button'
        onClick={onDelete}
        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950'
      >
        <FiTrash2 /> Delete checklist item
      </button>
    )}
  </div>
);

export default IssueDetail;
