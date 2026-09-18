import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiCheck, FiLayers, FiMoreHorizontal, FiPaperclip, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import imageCompression from 'browser-image-compression';
import IssueboardShell from './IssueboardShell';
import MarkdownEditor, { MarkdownPreview } from './MarkdownEditor';
import { getSafeIssueboardReturnTo, issueHref } from '@utils/issueboardNavigation';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COMPRESSED_BYTES = 1_048_576;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const jsonFetch = async (url, init) => {
  const response = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(init?.headers || {}) } });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
};

const initialDescription = `Portrait screenshots larger than **4 MB** must be resized and compressed in the browser before direct upload to private Supabase Storage.

- Keep the longest edge below 1920 pixels.
- Show original and compressed byte sizes.
- Never send image bytes through a Vercel Function.`;

const IssueDetail = ({ adminEmail, issueKey }) => {
  const router = useRouter();
  const [data, setData] = useState({ status: 'loading', issue: null, statuses: [], error: null });
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [statusId, setStatusId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [checklistId, setChecklistId] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [checklistBusy, setChecklistBusy] = useState(false);
  const [checklistError, setChecklistError] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskBusy, setSubtaskBusy] = useState(false);
  const [subtaskError, setSubtaskError] = useState(null);
  const [description, setDescription] = useState(initialDescription);
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklistEditorOpen, setChecklistEditorOpen] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [linkPickerFor, setLinkPickerFor] = useState(null);
  const [resolutionPromptFor, setResolutionPromptFor] = useState(null);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const [relationships, setRelationships] = useState([]);
  const [relationshipType, setRelationshipType] = useState('relates_to');
  const [relationshipSearch, setRelationshipSearch] = useState('');
  const [relationshipResults, setRelationshipResults] = useState([]);
  const [relationshipBusy, setRelationshipBusy] = useState(false);
  const [relationshipError, setRelationshipError] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);
  const returnTo = useMemo(() => getSafeIssueboardReturnTo(router.query.returnTo), [router.query.returnTo]);

  const load = useCallback(async () => {
    setData((current) => ({ ...current, status: 'loading', error: null }));
    const { ok, status, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}`);
    if (!ok || !payload?.ok) {
      setData({
        status: status === 404 ? 'not-found' : 'unavailable',
        issue: null,
        statuses: [],
        error: payload?.error?.message || 'Issue management is temporarily unavailable.'
      });
      return;
    }
    setData({ status: 'ready', issue: payload.issue, statuses: payload.statuses, error: null });
    setTitle(payload.issue.title);
    setPriority(payload.issue.priority);
    setStatusId(payload.issue.status?.id || '');
    setAssignee(payload.issue.assignee || '');
    setDescription(payload.issue.description || '');

    const commentsResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/comments`);
    if (commentsResult.ok && commentsResult.payload?.ok) setComments(commentsResult.payload.comments);

    const subtasksResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/subtasks`);
    if (subtasksResult.ok && subtasksResult.payload?.ok) setSubtasks(subtasksResult.payload.subtasks);

    const checklistsResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/checklists`);
    if (checklistsResult.ok && checklistsResult.payload?.ok) {
      const firstChecklist = checklistsResult.payload.checklists[0];
      setChecklistId(firstChecklist?.id || null);
      setChecklist(firstChecklist?.items || []);
    }

    const relationshipsResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/relationships`);
    if (relationshipsResult.ok && relationshipsResult.payload?.ok)
      setRelationships(relationshipsResult.payload.relationships);

    const attachmentsResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments`);
    if (attachmentsResult.ok && attachmentsResult.payload?.ok) setAttachments(attachmentsResult.payload.attachments);
  }, [issueKey]);

  useEffect(() => {
    load();
  }, [load]);

  const postComment = async (event) => {
    event.preventDefault();
    const body = newComment.trim();
    if (!body || postingComment) return;
    setPostingComment(true);
    setCommentError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    if (!ok || !payload?.ok) {
      setCommentError(payload?.error?.message || 'Could not post the comment.');
      setPostingComment(false);
      return;
    }
    setComments((current) => [...current, payload.comment]);
    setNewComment('');
    setPostingComment(false);
  };

  const beginEditComment = (targetComment) => {
    setEditingCommentId(targetComment.id);
    setEditingCommentBody(targetComment.body);
  };

  const saveCommentEdit = async () => {
    const body = editingCommentBody.trim();
    if (!body || savingCommentEdit) return;
    setSavingCommentEdit(true);
    setCommentError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/comments/${editingCommentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    if (!ok || !payload?.ok) {
      setCommentError(payload?.error?.message || 'Could not save the comment.');
      setSavingCommentEdit(false);
      return;
    }
    setComments((current) => current.map((entry) => (entry.id === payload.comment.id ? payload.comment : entry)));
    setEditingCommentId(null);
    setSavingCommentEdit(false);
  };

  const removeComment = async (commentId) => {
    setCommentError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/comments/${commentId}`, { method: 'DELETE' });
    if (!ok || !payload?.ok) {
      setCommentError(payload?.error?.message || 'Could not delete the comment.');
      return;
    }
    setComments((current) => current.filter((entry) => entry.id !== commentId));
  };

  const saveChanges = async () => {
    if (!data.issue || saving) return;
    setSaving(true);
    setSaveError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priority,
        assignee: assignee || undefined,
        statusId,
        expectedUpdatedAt: data.issue.updatedAt
      })
    });
    if (!ok || !payload?.ok) {
      setSaveError(payload?.error?.message || 'Could not save changes.');
      setSaving(false);
      return;
    }
    setData((current) => ({ ...current, issue: payload.issue }));
    setSaving(false);
  };

  const [newLabelName, setNewLabelName] = useState('');
  const [labelBusy, setLabelBusy] = useState(false);
  const [labelError, setLabelError] = useState(null);

  const addLabel = async (event) => {
    event.preventDefault();
    const name = newLabelName.trim();
    if (!name || labelBusy) return;
    setLabelBusy(true);
    setLabelError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!ok || !payload?.ok) {
      setLabelError(payload?.error?.message || 'Could not add the label.');
      setLabelBusy(false);
      return;
    }
    setData((current) => ({ ...current, issue: { ...current.issue, labels: payload.labels } }));
    setNewLabelName('');
    setLabelBusy(false);
  };

  const removeLabel = async (labelId) => {
    setLabelError(null);
    const { ok, payload } = await jsonFetch(
      `/api/issueboard/issues/${encodeURIComponent(issueKey)}/labels/${labelId}`,
      { method: 'DELETE' }
    );
    if (!ok || !payload?.ok) {
      setLabelError(payload?.error?.message || 'Could not remove the label.');
      return;
    }
    setData((current) => ({ ...current, issue: { ...current.issue, labels: payload.labels } }));
  };

  useEffect(() => {
    if (!relationshipOpen) return undefined;
    const timeout = setTimeout(async () => {
      const { ok, payload } = await jsonFetch(
        `/api/issueboard/issues/${encodeURIComponent(issueKey)}/search-related?q=${encodeURIComponent(relationshipSearch)}`
      );
      if (ok && payload?.ok) setRelationshipResults(payload.results);
    }, 250);
    return () => clearTimeout(timeout);
  }, [relationshipSearch, relationshipOpen, issueKey]);

  const addRelationship = async (targetIssueKey) => {
    setRelationshipBusy(true);
    setRelationshipError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetIssueKey, relationshipType })
    });
    setRelationshipBusy(false);
    if (!ok || !payload?.ok) {
      setRelationshipError(payload?.error?.message || 'Could not create the relationship.');
      return;
    }
    setRelationships(payload.relationships);
    setRelationshipSearch('');
    setRelationshipResults([]);
    setRelationshipOpen(false);
  };

  const removeRelationship = async (relationshipId) => {
    setRelationshipError(null);
    const previous = relationships;
    setRelationships((current) => current.filter((entry) => entry.id !== relationshipId));
    const { ok, payload } = await jsonFetch(`/api/issueboard/relationships/${relationshipId}`, { method: 'DELETE' });
    if (!ok || !payload?.ok) {
      setRelationships(previous);
      setRelationshipError(payload?.error?.message || 'Could not remove the relationship.');
    }
  };

  const uploadImage = async (file) => {
    if (uploading) return;
    setUploadError(null);
    setUploadStats(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WebP images are accepted.');
      return;
    }

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
        exifOrientation: 1 // normalize orientation; strips EXIF by re-encoding via canvas
      });

      // Client-side trust boundary is an optimization only -- re-check what we
      // actually got before requesting an upload authorization (§3.4).
      if (!ACCEPTED_TYPES.includes(compressed.type) || compressed.size > MAX_COMPRESSED_BYTES) {
        setUploadError('The compressed image is still too large. Try a smaller source image.');
        return;
      }

      // Confirm the compressed result actually decodes as an image before upload.
      await new Promise((resolve, reject) => {
        const probe = new Image();
        const objectUrl = URL.createObjectURL(compressed);
        probe.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        probe.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Compressed image failed to decode.'));
        };
        probe.src = objectUrl;
      });

      setUploadStats({ originalSize: file.size, compressedSize: compressed.size });

      const authResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalFilename: file.name, mimeType: compressed.type, byteSize: compressed.size })
      });
      if (!authResult.ok || !authResult.payload?.ok) {
        setUploadError(authResult.payload?.error?.message || 'Could not authorize the upload.');
        return;
      }
      const { attachmentId, signedUrl } = authResult.payload;

      const putResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': compressed.type },
        body: compressed
      });
      if (!putResponse.ok) {
        setUploadError('The upload did not complete. Try again.');
        return;
      }

      const finalizeResult = await jsonFetch(
        `/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments/${attachmentId}/finalize`,
        { method: 'POST' }
      );
      if (!finalizeResult.ok || !finalizeResult.payload?.ok) {
        setUploadError(finalizeResult.payload?.error?.message || 'The image could not be verified after upload.');
        return;
      }

      const listResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments`);
      if (listResult.ok && listResult.payload?.ok) setAttachments(listResult.payload.attachments);
    } catch {
      setUploadError('Could not compress or upload that image.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId) => {
    setUploadError(null);
    const previous = attachments;
    setAttachments((current) => current.filter((entry) => entry.id !== attachmentId));
    const { ok, payload } = await jsonFetch(
      `/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments/${attachmentId}`,
      { method: 'DELETE' }
    );
    if (!ok || !payload?.ok) {
      setAttachments(previous);
      setUploadError(payload?.error?.message || 'Could not delete the image.');
    }
  };

  const [archiving, setArchiving] = useState(false);
  const toggleArchived = async () => {
    if (!data.issue || archiving) return;
    setArchiving(true);
    setSaveError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !data.issue.archivedAt })
    });
    if (!ok || !payload?.ok) {
      setSaveError(payload?.error?.message || 'Could not update the archived state.');
      setArchiving(false);
      return;
    }
    setData((current) => ({ ...current, issue: payload.issue }));
    setArchiving(false);
  };

  const issue = data.issue;
  const closeIssue = () => router.push(returnTo);
  const reloadSubtasks = async () => {
    const { ok, payload } = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/subtasks`);
    if (ok && payload?.ok) setSubtasks(payload.subtasks);
  };
  const setChecklistCompletion = async (id, isComplete) => {
    const target = checklist.find((item) => item.id === id);
    setChecklist((items) => items.map((item) => (item.id === id ? { ...item, isComplete } : item)));
    setChecklistError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/checklist-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isComplete })
    });
    if (!ok || !payload?.ok) {
      setChecklist((items) => items.map((item) => (item.id === id ? { ...item, isComplete: !isComplete } : item)));
      setChecklistError(payload?.error?.message || 'Could not update the checklist item.');
      return;
    }
    if (target?.linkedSubtaskId) reloadSubtasks();
  };
  const deleteChecklistItem = async (id) => {
    setMenuFor(null);
    const previous = checklist;
    setChecklist((items) => items.filter((item) => item.id !== id));
    setChecklistError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/checklist-items/${id}`, { method: 'DELETE' });
    if (!ok || !payload?.ok) {
      setChecklist(previous);
      setChecklistError(payload?.error?.message || 'Could not delete the checklist item.');
    }
  };
  const createSubtask = async (title) => {
    setSubtaskError(null);
    setSubtaskBusy(true);
    const { ok, payload } = await jsonFetch('/api/issueboard/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectKey: issueKey.split('-')[0],
        issueType: 'task',
        title,
        description: '',
        priority: 'medium',
        parentIssueId: issue.id
      })
    });
    setSubtaskBusy(false);
    if (!ok || !payload?.ok) {
      setSubtaskError(payload?.error?.message || 'Could not create the subtask.');
      return;
    }
    setSubtasks((items) => [...items, payload.issue]);
    setMenuFor(null);
    setAddingSubtask(false);
    setNewSubtaskTitle('');
  };

  const submitNewSubtask = (event) => {
    event.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title || subtaskBusy) return;
    createSubtask(title);
  };

  const createLinkedSubtaskFromItem = async (itemId) => {
    setMenuFor(null);
    setChecklistError(null);
    setChecklistBusy(true);
    const { ok, payload } = await jsonFetch(`/api/issueboard/checklist-items/${itemId}/subtask`, { method: 'POST' });
    setChecklistBusy(false);
    if (!ok || !payload?.ok) {
      setChecklistError(payload?.error?.message || 'Could not create a linked subtask.');
      return;
    }
    setChecklist((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              linkedSubtaskId: payload.issue.id,
              linkedSubtask: {
                key: payload.issue.key,
                title: payload.issue.title,
                statusCategory: payload.issue.status?.category ?? null
              }
            }
          : item
      )
    );
    setSubtasks((items) => [...items, payload.issue]);
  };

  const linkExistingSubtaskToItem = async (itemId, subtaskKey, resolution) => {
    setChecklistError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/checklist-items/${itemId}/subtask`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolution ? { subtaskKey, resolution } : { subtaskKey })
    });
    if (!ok || !payload?.ok) {
      if (payload?.error?.code === 'RESOLUTION_REQUIRED') {
        setResolutionPromptFor({ itemId, subtaskKey });
        return;
      }
      setChecklistError(payload?.error?.message || 'Could not link the subtask.');
      return;
    }
    setChecklist((items) => items.map((item) => (item.id === itemId ? payload.item : item)));
    setResolutionPromptFor(null);
    setLinkPickerFor(null);
    if (resolution === 'checklist') reloadSubtasks();
  };

  const unlinkSubtaskFromItem = async (itemId) => {
    setMenuFor(null);
    setChecklistError(null);
    const { ok, payload } = await jsonFetch(`/api/issueboard/checklist-items/${itemId}/subtask`, {
      method: 'DELETE'
    });
    if (!ok || !payload?.ok) {
      setChecklistError(payload?.error?.message || 'Could not unlink the subtask.');
      return;
    }
    setChecklist((items) => items.map((item) => (item.id === itemId ? payload.item : item)));
  };
  const addChecklistItem = async () => {
    const body = newChecklistItem.trim();
    if (!body || checklistBusy) return;
    setChecklistBusy(true);
    setChecklistError(null);
    let targetChecklistId = checklistId;
    if (!targetChecklistId) {
      const created = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Checklist' })
      });
      if (!created.ok || !created.payload?.ok) {
        setChecklistError(created.payload?.error?.message || 'Could not create the checklist.');
        setChecklistBusy(false);
        return;
      }
      targetChecklistId = created.payload.checklist.id;
      setChecklistId(targetChecklistId);
    }
    const { ok, payload } = await jsonFetch(`/api/issueboard/checklists/${targetChecklistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    setChecklistBusy(false);
    if (!ok || !payload?.ok) {
      setChecklistError(payload?.error?.message || 'Could not add the checklist item.');
      return;
    }
    setChecklist((items) => [...items, payload.item]);
    setNewChecklistItem('');
  };
  const beginIssueEdit = () => setDescriptionEditing(true);
  const finishIssueEdit = () => setDescriptionEditing(false);

  if (data.status === 'loading') {
    return <IssueboardShell adminEmail={adminEmail} currentView='' title={issueKey} />;
  }

  if (data.status === 'not-found') {
    return (
      <IssueboardShell adminEmail={adminEmail} currentView='' title={issueKey}>
        <div className='rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900'>
          <h2 className='font-bold'>Issue not found</h2>
          <p className='mt-1 text-sm text-slate-500'>{issueKey} does not exist or was deleted.</p>
        </div>
      </IssueboardShell>
    );
  }

  if (data.status === 'unavailable') {
    return (
      <IssueboardShell adminEmail={adminEmail} currentView='' title={issueKey}>
        <div className='rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
          <strong className='block'>Issue management is temporarily unavailable</strong>
          <p className='mt-1 text-xs leading-5'>{data.error}</p>
        </div>
      </IssueboardShell>
    );
  }

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
        <div className='flex items-center gap-2'>
          {saveError && <span className='text-xs font-semibold text-rose-600 dark:text-rose-300'>{saveError}</span>}
          {issue.archivedAt && (
            <span className='rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
              Archived
            </span>
          )}
          <button
            type='button'
            onClick={toggleArchived}
            disabled={archiving}
            className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900'
          >
            {archiving ? '…' : issue.archivedAt ? 'Restore' : 'Archive'}
          </button>
          <button
            type='button'
            onClick={saveChanges}
            disabled={saving}
            className='button disabled:cursor-not-allowed disabled:opacity-60'
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_21rem]'>
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7 dark:border-slate-800 dark:bg-slate-900'>
          <span className='text-xs font-bold uppercase tracking-wider text-slate-500'>
            {issue.key} · {capitalize(issue.type)}
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label='Issue title'
            className='my-3 w-full rounded-lg border border-transparent bg-transparent text-2xl font-bold tracking-tight outline-none focus:border-slate-300 focus:bg-white md:text-3xl dark:focus:border-slate-700 dark:focus:bg-slate-950'
          />
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
                count={`${checklist.filter((item) => item.isComplete).length} of ${checklist.length}`}
                action='Add item'
                normalTitle
                onAction={() => setChecklistEditorOpen((open) => !open)}
              />
              {checklist.length > 0 && (
                <div className='mb-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                  <div
                    className='h-full rounded-full bg-emerald-600'
                    style={{
                      width: `${(checklist.filter((item) => item.isComplete).length / checklist.length) * 100}%`
                    }}
                  />
                </div>
              )}
              <div className='divide-y divide-slate-100 dark:divide-slate-800'>
                {checklist.map((item) => {
                  const linkedElsewhere = new Set(
                    checklist.filter((other) => other.id !== item.id).map((other) => other.linkedSubtaskId)
                  );
                  const eligibleSubtasks = subtasks.filter(
                    (subtask) => !linkedElsewhere.has(subtask.id) && subtask.id !== item.linkedSubtaskId
                  );
                  return (
                    <div key={item.id} className='group relative py-1 text-sm leading-5'>
                      <div className='flex min-h-8 items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={item.isComplete}
                          onChange={(event) => setChecklistCompletion(item.id, event.target.checked)}
                          className='issueboard-checkbox'
                        />
                        <div className='min-w-0 flex-1'>
                          <div className={item.isComplete ? 'text-slate-400 line-through' : ''}>
                            <MarkdownPreview compact>{item.body}</MarkdownPreview>
                          </div>
                          {item.linkedSubtask && (
                            <Link
                              href={issueHref(item.linkedSubtask.key, `/admin/issues/${issueKey}`)}
                              className='inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:underline dark:text-cyan-400'
                            >
                              <FiLayers className='size-3' /> {item.linkedSubtask.key}
                            </Link>
                          )}
                        </div>
                        <button
                          type='button'
                          aria-label={`Open actions for ${item.body}`}
                          onClick={() => {
                            setLinkPickerFor(null);
                            setMenuFor(menuFor === item.id ? null : item.id);
                          }}
                          className='grid size-6 place-items-center rounded hover:bg-slate-100 dark:hover:bg-slate-800'
                        >
                          <FiMoreHorizontal />
                        </button>
                        {menuFor === item.id && (
                          <QuickMenu
                            linked={Boolean(item.linkedSubtask)}
                            onCreateLinked={() => createLinkedSubtaskFromItem(item.id)}
                            onLinkExisting={() => {
                              setMenuFor(null);
                              setLinkPickerFor(item.id);
                            }}
                            onUnlink={() => unlinkSubtaskFromItem(item.id)}
                            onDelete={() => deleteChecklistItem(item.id)}
                          />
                        )}
                      </div>
                      {linkPickerFor === item.id && (
                        <div className='ml-6 mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700'>
                          {eligibleSubtasks.length === 0 ? (
                            <span className='text-slate-500'>No unlinked subtasks on this issue yet.</span>
                          ) : (
                            <select
                              autoFocus
                              defaultValue=''
                              aria-label='Choose a subtask to link'
                              onChange={(event) => {
                                if (event.target.value) linkExistingSubtaskToItem(item.id, event.target.value);
                              }}
                              className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent p-1.5 dark:border-slate-700'
                            >
                              <option value='' disabled>
                                Choose a subtask…
                              </option>
                              {eligibleSubtasks.map((subtask) => (
                                <option key={subtask.key} value={subtask.key}>
                                  {subtask.key} — {subtask.title}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type='button'
                            onClick={() => setLinkPickerFor(null)}
                            className='rounded-lg px-2 py-1 font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {resolutionPromptFor?.itemId === item.id && (
                        <div className='ml-6 mt-1 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
                          <p className='mb-2'>
                            The checklist item and {resolutionPromptFor.subtaskKey} have different completion states.
                            Which one should win?
                          </p>
                          <div className='flex gap-2'>
                            <button
                              type='button'
                              onClick={() =>
                                linkExistingSubtaskToItem(item.id, resolutionPromptFor.subtaskKey, 'checklist')
                              }
                              className='rounded-lg bg-amber-900/10 px-2 py-1 font-bold hover:bg-amber-900/20'
                            >
                              Use checklist item state
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                linkExistingSubtaskToItem(item.id, resolutionPromptFor.subtaskKey, 'subtask')
                              }
                              className='rounded-lg bg-amber-900/10 px-2 py-1 font-bold hover:bg-amber-900/20'
                            >
                              Use subtask state
                            </button>
                            <button
                              type='button'
                              onClick={() => setResolutionPromptFor(null)}
                              className='rounded-lg px-2 py-1 font-bold hover:bg-amber-900/10'
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
              {checklistError && (
                <p className='mt-1 text-xs font-semibold text-rose-600 dark:text-rose-300'>{checklistError}</p>
              )}
            </>
          )}

          <SectionHeading
            title='Subtasks'
            count={`${subtasks.filter((subtask) => subtask.status?.category === 'done').length} of ${subtasks.length}`}
            action='Add subtask'
            onAction={() => setAddingSubtask((open) => !open)}
          />
          {subtasks.length > 0 && (
            <div className='overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'>
              {subtasks.map((subtask) => (
                <Link
                  key={subtask.key}
                  href={issueHref(subtask.key, `/admin/issues/${issueKey}`)}
                  className='grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-1.5 text-sm last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                >
                  <span className='grid size-5 place-items-center text-cyan-600' title='Subtask' aria-label='Subtask'>
                    <FiLayers className='size-3.5' />
                  </span>
                  <div className='min-w-0 truncate'>
                    <strong className='mr-2 text-xs'>{subtask.key}</strong>
                    <span>{subtask.title}</span>
                  </div>
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold ${subtask.status?.category === 'done' ? 'bg-emerald-100 text-emerald-800' : subtask.status?.category === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {subtask.status?.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {addingSubtask && (
            <form onSubmit={submitNewSubtask} className='mt-2 flex gap-2'>
              <input
                autoFocus
                value={newSubtaskTitle}
                onChange={(event) => setNewSubtaskTitle(event.target.value)}
                placeholder='Subtask title'
                className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700'
              />
              <button type='submit' disabled={subtaskBusy} className='button text-xs disabled:opacity-60'>
                {subtaskBusy ? 'Creating…' : 'Create'}
              </button>
              <button
                type='button'
                onClick={() => setAddingSubtask(false)}
                className='rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
              >
                Cancel
              </button>
            </form>
          )}
          {subtaskError && (
            <p className='mt-1 text-xs font-semibold text-rose-600 dark:text-rose-300'>{subtaskError}</p>
          )}

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
          {relationships.length > 0 && (
            <div className='mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800'>
              {relationships.map((rel) => (
                <div key={rel.id} className='flex items-center justify-between gap-3 px-3 py-2 text-sm'>
                  <span>
                    <span className='text-xs text-slate-500'>{rel.label}</span>{' '}
                    <Link
                      href={issueHref(rel.issue.key, `/admin/issues/${issueKey}`)}
                      className='font-semibold text-emerald-700 hover:underline dark:text-emerald-400'
                    >
                      {rel.issue.key}
                    </Link>{' '}
                    {rel.issue.title}
                  </span>
                  <button
                    type='button'
                    onClick={() => removeRelationship(rel.id)}
                    aria-label={`Remove relationship with ${rel.issue.key}`}
                    className='shrink-0 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950'
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {relationshipOpen && (
            <div className='mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800'>
              <label className='text-xs font-bold'>
                Relationship
                <select
                  value={relationshipType}
                  onChange={(event) => setRelationshipType(event.target.value)}
                  className='ml-2 rounded-lg border border-slate-300 bg-transparent px-2 py-1.5 dark:border-slate-700'
                >
                  <option value='blocks'>blocks</option>
                  <option value='relates_to'>relates to</option>
                  <option value='duplicates'>duplicates</option>
                </select>
              </label>
              <input
                autoFocus
                value={relationshipSearch}
                onChange={(event) => setRelationshipSearch(event.target.value)}
                className='mt-3 w-full rounded-lg border border-slate-300 bg-transparent p-2.5 text-sm dark:border-slate-700'
                placeholder='Search issue title…'
              />
              {relationshipResults.map((result) => (
                <button
                  key={result.id}
                  type='button'
                  disabled={relationshipBusy}
                  onClick={() => addRelationship(result.key)}
                  className='mt-2 flex w-full items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-left text-xs hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-950 dark:hover:bg-slate-900'
                >
                  <span>
                    <strong>{result.key}</strong> {result.title}
                  </span>
                  {result.status && <span className='text-slate-500'>{result.status.name}</span>}
                </button>
              ))}
              {relationshipError && (
                <p className='mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{relationshipError}</p>
              )}
            </div>
          )}

          <SectionHeading
            title='Images and attachments'
            action='Add images'
            onAction={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp'
            className='hidden'
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) uploadImage(file);
            }}
          />
          {uploadStats && !uploadError && (
            <p className='mb-2 text-xs text-slate-500'>
              Compressed {formatBytes(uploadStats.originalSize)} → {formatBytes(uploadStats.compressedSize)} (
              {Math.round((1 - uploadStats.compressedSize / uploadStats.originalSize) * 100)}% smaller)
            </p>
          )}
          {uploadError && <p className='mb-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{uploadError}</p>}
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6'>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className='group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800'
              >
                <img src={attachment.url} alt={attachment.displayName} className='size-full object-cover' />
                <button
                  type='button'
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`Delete ${attachment.displayName}`}
                  className='absolute right-1 top-1 hidden rounded bg-slate-950/70 p-1 text-white group-hover:block'
                >
                  <FiTrash2 className='size-3.5' />
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className='grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-emerald-400 text-center text-xs font-bold text-emerald-700 disabled:opacity-60'
            >
              <span>
                <FiPaperclip className='mx-auto mb-2' />
                {uploading ? 'Uploading…' : 'Compress and upload'}
              </span>
            </button>
          </div>
          <SectionHeading title='Activity and comments' count={comments.length ? String(comments.length) : null} />
          <form onSubmit={postComment}>
            <MarkdownEditor
              value={newComment}
              onChange={setNewComment}
              placeholder='Write a comment using Markdown…'
              ariaLabel='Comment'
              minHeight='min-h-24'
            />
            <div className='mt-2 flex items-center justify-end gap-2'>
              {commentError && (
                <span className='text-xs font-semibold text-rose-600 dark:text-rose-300'>{commentError}</span>
              )}
              <button
                type='submit'
                disabled={postingComment || !newComment.trim()}
                className='button text-xs disabled:cursor-not-allowed disabled:opacity-60'
              >
                {postingComment ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </form>
          {comments.map((entry) => (
            <div key={entry.id} className='mt-4 border-l-2 border-slate-200 pl-4 text-sm dark:border-slate-700'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <p className='mb-1'>
                    <strong>{entry.author}</strong> commented
                  </p>
                  {editingCommentId === entry.id ? (
                    <MarkdownEditor
                      value={editingCommentBody}
                      onChange={setEditingCommentBody}
                      ariaLabel='Edit comment'
                      minHeight='min-h-20'
                    />
                  ) : (
                    <MarkdownPreview compact>{entry.body}</MarkdownPreview>
                  )}
                  <span className='text-xs text-slate-500'>
                    {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    {entry.editedAt && ' · edited'}
                  </span>
                </div>
                <div className='flex shrink-0 gap-1'>
                  {editingCommentId === entry.id ? (
                    <button
                      type='button'
                      onClick={saveCommentEdit}
                      disabled={savingCommentEdit}
                      className='rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-400'
                    >
                      {savingCommentEdit ? 'Saving…' : 'Done'}
                    </button>
                  ) : (
                    <button
                      type='button'
                      onClick={() => beginEditComment(entry)}
                      className='rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={() => removeComment(entry.id)}
                    className='rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </article>
        <aside className='h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <label className='grid grid-cols-[6rem_1fr] items-center gap-3 border-b border-slate-100 py-3 text-sm dark:border-slate-800'>
            <span className='text-xs text-slate-500'>Status</span>
            <select
              value={statusId}
              onChange={(event) => setStatusId(event.target.value)}
              className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm dark:border-slate-700'
            >
              {data.statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>
          <label className='grid grid-cols-[6rem_1fr] items-center gap-3 border-b border-slate-100 py-3 text-sm dark:border-slate-800'>
            <span className='text-xs text-slate-500'>Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm dark:border-slate-700'
            >
              {['highest', 'high', 'medium', 'low', 'lowest'].map((level) => (
                <option key={level} value={level}>
                  {capitalize(level)}
                </option>
              ))}
            </select>
          </label>
          <label className='grid grid-cols-[6rem_1fr] items-center gap-3 border-b border-slate-100 py-3 text-sm dark:border-slate-800'>
            <span className='text-xs text-slate-500'>Assignee</span>
            <input
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              placeholder='Unassigned'
              className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-sm dark:border-slate-700'
            />
          </label>
          <div className='grid grid-cols-[6rem_1fr] gap-3 border-b border-slate-100 py-3 text-sm dark:border-slate-800'>
            <span className='text-xs text-slate-500'>Labels</span>
            <div>
              <div className='flex flex-wrap gap-1'>
                {issue.labels?.map((label) => (
                  <span
                    key={label.id}
                    className='inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-bold'
                    style={{ backgroundColor: label.backgroundColor, color: label.textColor }}
                  >
                    {label.name}
                    <button
                      type='button'
                      onClick={() => removeLabel(label.id)}
                      aria-label={`Remove label ${label.name}`}
                      className='leading-none opacity-70 hover:opacity-100'
                    >
                      <FiX className='size-2.5' />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={addLabel} className='mt-1.5 flex gap-1'>
                <input
                  value={newLabelName}
                  onChange={(event) => setNewLabelName(event.target.value)}
                  placeholder='Add label…'
                  className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent p-1 text-xs dark:border-slate-700'
                />
                <button
                  type='submit'
                  disabled={labelBusy || !newLabelName.trim()}
                  className='rounded-lg border border-slate-300 px-2 text-xs font-bold disabled:opacity-60 dark:border-slate-700'
                >
                  Add
                </button>
              </form>
              {labelError && <p className='mt-1 text-xs text-rose-600 dark:text-rose-300'>{labelError}</p>}
            </div>
          </div>
          {[
            ['Estimate', typeof issue.storyPoints === 'number' ? `${issue.storyPoints} points` : 'Not estimated'],
            [
              'Due date',
              issue.dueAt ? new Date(issue.dueAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'None'
            ],
            ['Reporter', issue.reporter],
            ['Source', capitalize(issue.source)],
            ['Created', new Date(issue.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })]
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

const QuickMenu = ({ linked, onCreateLinked, onLinkExisting, onUnlink, onDelete }) => (
  <div className='absolute right-0 top-10 z-20 w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900'>
    {linked ? (
      <button
        type='button'
        onClick={onUnlink}
        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800'
      >
        <FiX /> Unlink subtask
      </button>
    ) : (
      <>
        <button
          type='button'
          onClick={onCreateLinked}
          className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          <FiCheck /> Create linked subtask
        </button>
        <button
          type='button'
          onClick={onLinkExisting}
          className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800'
        >
          <FiLayers /> Link existing subtask
        </button>
      </>
    )}
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
