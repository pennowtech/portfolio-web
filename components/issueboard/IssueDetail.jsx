import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiDownload,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiLayers,
  FiMoreHorizontal,
  FiPaperclip,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import imageCompression from 'browser-image-compression';
import IssueboardShell from './IssueboardShell';
import MarkdownEditor, { MarkdownPreview } from './MarkdownEditor';
import { getSafeIssueboardReturnTo, issueHref } from '@utils/issueboardNavigation';

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Colors here must stay in sync with `typePresentation` in IssueboardWorkspace.jsx --
// same issue type, same color, on every screen. Tailwind needs literal class strings
// (no dynamic `text-${color}-600`), so this can't share code with that map directly,
// but the color-per-type choice below is intentionally identical to it.
const getIssueTypeCapsule = (type) => {
  const normalized = (type || 'task').toLowerCase();
  if (normalized === 'bug') {
    return {
      classes:
        'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/60 dark:text-rose-400',
      label: 'Bug'
    };
  }
  if (normalized === 'story') {
    return {
      classes:
        'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-400',
      label: 'Story'
    };
  }
  if (normalized === 'epic') {
    return {
      classes:
        'border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/60 dark:text-violet-400',
      label: 'Epic'
    };
  }
  if (normalized === 'subtask') {
    return {
      classes:
        'border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-950/60 dark:text-cyan-400',
      label: 'Subtask'
    };
  }
  return {
    classes:
      'border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/60 dark:text-blue-400',
    label: capitalize(normalized)
  };
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const getSubtaskStatusCapsule = (status) => {
  const category = (status?.category || '').toLowerCase();
  const name = (status?.name || '').toLowerCase();

  // Done: Green capsule with solid emerald dot
  if (category === 'done' || name.includes('done') || name.includes('complete') || name.includes('resolved')) {
    return {
      classes:
        'border border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      label: status?.name || 'Done'
    };
  }

  // In Progress: Vibrant Blue / Amber with pulsing dot
  if (category === 'in_progress' || name.includes('progress') || name.includes('doing') || name.includes('active')) {
    return {
      classes:
        'border border-blue-500/40 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/60 dark:text-blue-300',
      dot: 'bg-blue-500 animate-pulse ring-2 ring-blue-300 dark:ring-blue-900',
      label: status?.name || 'In Progress'
    };
  }

  // Review / QA / Testing: Purple capsule with purple dot
  if (name.includes('review') || name.includes('test') || name.includes('qa')) {
    return {
      classes:
        'border border-purple-500/40 bg-purple-50 text-purple-800 dark:border-purple-500/30 dark:bg-purple-950/60 dark:text-purple-300',
      dot: 'bg-purple-500',
      label: status?.name || 'Review'
    };
  }

  // To Do: Sky Blue capsule with sky dot
  if (category === 'todo' || name.includes('todo') || name.includes('to do') || name.includes('ready')) {
    return {
      classes:
        'border border-sky-500/40 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/60 dark:text-sky-300',
      dot: 'bg-sky-500',
      label: status?.name || 'To Do'
    };
  }

  // Backlog: Cool Violet / Slate capsule with violet dot
  if (category === 'backlog' || name.includes('backlog') || name.includes('triage')) {
    return {
      classes:
        'border border-violet-400/40 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300',
      dot: 'bg-violet-400',
      label: status?.name || 'Backlog'
    };
  }

  // Fallback
  return {
    classes:
      'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    label: status?.name || 'Unknown'
  };
};

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
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);

  useEffect(() => {
    if (!previewAttachment) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewAttachment(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewAttachment]);
  const [projects, setProjects] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [projectLabels, setProjectLabels] = useState([]);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const fileInputRef = useRef(null);
  const subtaskInputRef = useRef(null);
  const checklistInputRef = useRef(null);
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

    const projectKey = (issueKey || '').split('-')[0].toUpperCase();
    const [
      commentsResult,
      subtasksResult,
      checklistsResult,
      relationshipsResult,
      attachmentsResult,
      projectsResult,
      usersResult,
      labelsResult
    ] = await Promise.all([
      jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/comments`),
      jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/subtasks`),
      jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/checklists`),
      jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/relationships`),
      jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments`),
      jsonFetch('/api/issueboard/projects'),
      jsonFetch(`/api/issueboard/projects/${encodeURIComponent(projectKey)}/users`),
      jsonFetch(`/api/issueboard/projects/${encodeURIComponent(projectKey)}/labels`)
    ]);

    if (commentsResult.ok && commentsResult.payload?.ok) setComments(commentsResult.payload.comments);

    if (subtasksResult.ok && subtasksResult.payload?.ok) setSubtasks(subtasksResult.payload.subtasks);

    if (checklistsResult.ok && checklistsResult.payload?.ok) {
      const firstChecklist = checklistsResult.payload.checklists[0];
      setChecklistId(firstChecklist?.id || null);
      setChecklist(firstChecklist?.items || []);
    }

    if (relationshipsResult.ok && relationshipsResult.payload?.ok)
      setRelationships(relationshipsResult.payload.relationships);

    if (attachmentsResult.ok && attachmentsResult.payload?.ok) setAttachments(attachmentsResult.payload.attachments);

    if (projectsResult.ok && projectsResult.payload?.ok) setProjects(projectsResult.payload.projects);

    if (usersResult.ok && usersResult.payload?.ok) setProjectUsers(usersResult.payload.users || []);

    if (labelsResult.ok && labelsResult.payload?.ok) setProjectLabels(labelsResult.payload.labels || []);
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

  const selectedAssignees = useMemo(() => {
    if (!assignee) return [];
    return assignee
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [assignee]);

  const toggleAssignee = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    let next;
    if (selectedAssignees.includes(trimmed)) {
      next = selectedAssignees.filter((a) => a !== trimmed);
    } else {
      next = [...selectedAssignees, trimmed];
    }
    setAssignee(next.join(', '));
  };

  const removeAssignee = (name) => {
    const next = selectedAssignees.filter((a) => a !== name.trim());
    setAssignee(next.join(', '));
  };

  const availableUsers = useMemo(() => {
    const list = [...projectUsers];
    selectedAssignees.forEach((name) => {
      if (!list.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
        list.push({ name, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com` });
      }
    });
    return list;
  }, [projectUsers, selectedAssignees]);

  const [newLabelName, setNewLabelName] = useState('');
  const [labelBusy, setLabelBusy] = useState(false);
  const [labelError, setLabelError] = useState(null);

  const addLabelWithName = async (nameInput) => {
    const name = (nameInput || newLabelName).trim();
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
    setProjectLabels((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { id: name, name, backgroundColor: '#0284c7', textColor: '#ffffff' }];
    });
    setNewLabelName('');
    setLabelSearch('');
    setLabelBusy(false);
  };

  const addLabel = (event) => {
    event.preventDefault();
    addLabelWithName(newLabelName);
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

  const toggleLabel = async (projectLabel) => {
    const existing = issue.labels?.find(
      (l) => l.id === projectLabel.id || l.name.toLowerCase() === projectLabel.name.toLowerCase()
    );
    if (existing) {
      await removeLabel(existing.id);
    } else {
      await addLabelWithName(projectLabel.name);
    }
  };

  useEffect(() => {
    if (!assigneePickerOpen && !labelPickerOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.picker-container')) {
        setAssigneePickerOpen(false);
        setLabelPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [assigneePickerOpen, labelPickerOpen]);

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

  const uploadAttachment = async (file) => {
    if (uploading) return;
    setUploadError(null);
    setUploadStats(null);

    const isImg = Boolean(file.type?.startsWith('image/'));
    const maxBytes = isImg ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(isImg ? 'Images must be 5 MB or smaller.' : 'Documents and files must be 10 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      let uploadBlob = file;
      const canCompress =
        isImg && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size > 1.5 * 1024 * 1024;

      if (canCompress) {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 4.5,
            maxWidthOrHeight: 2560,
            useWebWorker: true,
            fileType: file.type
          });
          if (compressed && compressed.size < file.size) {
            uploadBlob = compressed;
            setUploadStats({ originalSize: file.size, compressedSize: compressed.size });
          }
        } catch {
          // Compression fallback to original
        }
      }

      const mime = uploadBlob.type || file.type || 'application/octet-stream';
      const authResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: mime,
          byteSize: uploadBlob.size
        })
      });
      if (!authResult.ok || !authResult.payload?.ok) {
        setUploadError(authResult.payload?.error?.message || 'Could not authorize the upload.');
        return;
      }
      const { attachmentId, signedUrl } = authResult.payload;

      const putResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mime },
        body: uploadBlob
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
        setUploadError(finalizeResult.payload?.error?.message || 'The attachment could not be verified after upload.');
        return;
      }

      const listResult = await jsonFetch(`/api/issueboard/issues/${encodeURIComponent(issueKey)}/attachments`);
      if (listResult.ok && listResult.payload?.ok) setAttachments(listResult.payload.attachments);
    } catch {
      setUploadError('Could not upload that attachment.');
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
    const todoStatus = data.statuses.find(
      (s) => s.category === 'todo' || s.name?.toLowerCase() === 'to do' || s.name?.toLowerCase() === 'todo'
    );
    const { ok, payload } = await jsonFetch('/api/issueboard/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectKey: issueKey.split('-')[0],
        issueType: 'task',
        title,
        description: '',
        priority: 'medium',
        parentIssueId: issue.id,
        statusId: todoStatus?.id
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
    setTimeout(() => {
      subtaskInputRef.current?.focus();
    }, 0);
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
    setTimeout(() => {
      checklistInputRef.current?.focus();
    }, 0);
  };
  const beginIssueEdit = () => setDescriptionEditing(true);
  const finishIssueEdit = () => setDescriptionEditing(false);
  const currentProject = projects.find((project) => project.key === issueKey.split('-')[0]) || null;

  if (data.status === 'loading') {
    return (
      <IssueboardShell
        adminEmail={adminEmail}
        currentView=''
        currentProject={currentProject}
        projects={projects}
        title={issueKey}
      />
    );
  }

  if (data.status === 'not-found') {
    return (
      <IssueboardShell
        adminEmail={adminEmail}
        currentView=''
        currentProject={currentProject}
        projects={projects}
        title={issueKey}
      >
        <div className='rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center dark:border-slate-700 dark:bg-slate-900'>
          <h2 className='font-bold'>Issue not found</h2>
          <p className='mt-1 text-sm text-slate-500'>{issueKey} does not exist or was deleted.</p>
        </div>
      </IssueboardShell>
    );
  }

  if (data.status === 'unavailable') {
    return (
      <IssueboardShell
        adminEmail={adminEmail}
        currentView=''
        currentProject={currentProject}
        projects={projects}
        title={issueKey}
      >
        <div className='rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>
          <strong className='block'>Issue management is temporarily unavailable</strong>
          <p className='mt-1 text-xs leading-5'>{data.error}</p>
        </div>
      </IssueboardShell>
    );
  }

  return (
    <IssueboardShell
      adminEmail={adminEmail}
      currentView=''
      currentProject={currentProject}
      projects={projects}
      title={issue.key}
    >
      {/* Top Header & Command Bar */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800/80'>
        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='button'
            onClick={closeIssue}
            className='inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          >
            <FiArrowLeft className='size-3.5' /> Back to Board
          </button>
          <span className='inline-flex h-5 items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400'>
            {capitalize(issue.type)}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          {saveError && <span className='text-xs font-semibold text-rose-600 dark:text-rose-400'>{saveError}</span>}
          {/* Status Pill Badge */}
          <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'>
            <span className='size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse' />
            {data.statuses.find((s) => s.id === statusId)?.name || 'In Progress'}
          </span>
          {/* Priority Pill Badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              priority === 'highest'
                ? 'border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                : priority === 'high'
                  ? 'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                  : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {priority === 'highest' ? '🔥 Highest' : capitalize(priority)}
          </span>
          {issue.archivedAt && (
            <span className='rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
              Archived
            </span>
          )}
          <button
            type='button'
            onClick={toggleArchived}
            disabled={archiving}
            className='rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          >
            {archiving ? '…' : issue.archivedAt ? 'Restore' : 'Archive'}
          </button>
          <button
            type='button'
            onClick={saveChanges}
            disabled={saving}
            className='button text-xs disabled:cursor-not-allowed disabled:opacity-60'
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_20rem]'>
        {/* Left Primary Column */}
        <div className='space-y-6'>
          <div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label='Issue title'
              className='w-full rounded-lg border border-transparent bg-transparent text-2xl font-extrabold tracking-tight text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white md:text-3xl dark:text-white dark:focus:border-slate-700 dark:focus:bg-slate-950'
            />
            <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
              Created by{' '}
              <span className='font-medium text-slate-700 dark:text-slate-300'>
                {issue.reporter || 'Local development'}
              </span>{' '}
              · Updated{' '}
              {new Date(issue.updatedAt || issue.createdAt).toLocaleDateString(undefined, {
                dateStyle: 'medium'
              })}
            </p>
          </div>

          {/* Description Card */}
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60 dark:backdrop-blur-sm'>
            <div className='mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800'>
              <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                Description
              </span>
              <button
                type='button'
                onClick={descriptionEditing ? finishIssueEdit : beginIssueEdit}
                className='rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60'
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
              <div className='text-sm text-slate-700 dark:text-slate-300'>
                <MarkdownPreview>{description}</MarkdownPreview>
              </div>
            )}
          </section>

          {/* Checklist Card */}
          {!descriptionEditing && (
            <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60'>
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    Checklist
                  </span>
                  <span className='font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                    {checklist.filter((item) => item.isComplete).length} of {checklist.length} done (
                    {checklist.length
                      ? Math.round((checklist.filter((item) => item.isComplete).length / checklist.length) * 100)
                      : 0}
                    %)
                  </span>
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
                <div className='mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all duration-300'
                    style={{
                      width: `${(checklist.filter((item) => item.isComplete).length / checklist.length) * 100}%`
                    }}
                  />
                </div>
              )}
              <div className='space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60'>
                {checklist.map((item) => {
                  const linkedElsewhere = new Set(
                    checklist.filter((other) => other.id !== item.id).map((other) => other.linkedSubtaskId)
                  );
                  const eligibleSubtasks = subtasks.filter(
                    (subtask) => !linkedElsewhere.has(subtask.id) && subtask.id !== item.linkedSubtaskId
                  );
                  return (
                    <div key={item.id} className='group relative py-1 text-sm leading-5'>
                      <div className='flex min-h-8 items-center gap-2 rounded-lg px-1 transition hover:bg-slate-50 dark:hover:bg-slate-800/30'>
                        <input
                          type='checkbox'
                          checked={item.isComplete}
                          onChange={(event) => setChecklistCompletion(item.id, event.target.checked)}
                          className='issueboard-checkbox'
                        />
                        <div className='min-w-0 flex-1'>
                          <div
                            className={
                              item.isComplete
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }
                          >
                            <MarkdownPreview compact>{item.body}</MarkdownPreview>
                          </div>
                          {item.linkedSubtask && (
                            <Link
                              href={issueHref(item.linkedSubtask.key, `/admin/issues/${issueKey}`)}
                              className='inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-700 hover:underline dark:bg-slate-800 dark:text-cyan-400'
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
                          className='grid size-6 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
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
                        <div className='ml-6 mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-950'>
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
                              className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900'
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
                            className='rounded-lg px-2 py-1 font-bold hover:bg-slate-200 dark:hover:bg-slate-800'
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
              {/* Always visible Checklist Item Input Form */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addChecklistItem();
                }}
                className='mt-3 flex gap-2'
              >
                <input
                  ref={checklistInputRef}
                  value={newChecklistItem}
                  onChange={(event) => setNewChecklistItem(event.target.value)}
                  placeholder='New checklist item (e.g. Write integration test)…'
                  aria-label='New checklist item'
                  className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                />
                <button
                  type='submit'
                  disabled={checklistBusy || !newChecklistItem.trim()}
                  className='button text-xs disabled:opacity-60'
                >
                  {checklistBusy ? 'Adding…' : 'Add'}
                </button>
              </form>
              {checklistError && (
                <p className='mt-1 text-xs font-semibold text-rose-600 dark:text-rose-300'>{checklistError}</p>
              )}
            </section>
          )}

          {/* Subtasks Card */}
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                  Subtasks
                </span>
                <span className='font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                  {subtasks.filter((subtask) => subtask.status?.category === 'done').length} of {subtasks.length}{' '}
                  completed
                </span>
              </div>
              <button
                type='button'
                onClick={() => subtaskInputRef.current?.focus()}
                className='rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60'
              >
                + Add subtask
              </button>
            </div>
            {subtasks.length > 0 && (
              <div className='divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 dark:divide-slate-800/80 dark:border-slate-800 dark:bg-slate-950/60'>
                {subtasks.map((subtask) => (
                  <Link
                    key={subtask.key}
                    href={issueHref(subtask.key, `/admin/issues/${issueKey}`)}
                    className='grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 text-sm transition last:border-0 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  >
                    <span
                      className='grid size-5 place-items-center text-cyan-600 dark:text-cyan-400'
                      title='Subtask'
                      aria-label='Subtask'
                    >
                      <FiLayers className='size-3.5' />
                    </span>
                    <div className='min-w-0 truncate'>
                      <strong className='mr-2 font-mono text-xs text-slate-800 dark:text-slate-200'>
                        {subtask.key}
                      </strong>
                      <span className='text-xs text-slate-700 dark:text-slate-300'>{subtask.title}</span>
                    </div>
                    {(() => {
                      const capsule = getSubtaskStatusCapsule(subtask.status);
                      return (
                        <span
                          className={`inline-flex h-5 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold transition ${capsule.classes}`}
                        >
                          <span className={`size-1.5 rounded-full shrink-0 ${capsule.dot}`} />
                          {capsule.label}
                        </span>
                      );
                    })()}
                  </Link>
                ))}
              </div>
            )}
            {/* Always visible Add Subtask Input Form */}
            <form onSubmit={submitNewSubtask} className='mt-3 flex gap-2'>
              <input
                ref={subtaskInputRef}
                value={newSubtaskTitle}
                onChange={(event) => setNewSubtaskTitle(event.target.value)}
                placeholder='New subtask title (e.g. Wire automated rollback error handling)…'
                className='min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
              />
              <button
                type='submit'
                disabled={subtaskBusy || !newSubtaskTitle.trim()}
                className='button text-xs disabled:opacity-60'
              >
                {subtaskBusy ? 'Creating…' : 'Create'}
              </button>
            </form>
            {subtaskError && (
              <p className='mt-1 text-xs font-semibold text-rose-600 dark:text-rose-300'>{subtaskError}</p>
            )}
          </section>

          {/* Images & Attachments Card */}
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60'>
            <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    Images & Attachments
                  </span>
                  {uploadStats && !uploadError && (
                    <span className='rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'>
                      Compressed {formatBytes(uploadStats.originalSize)} → {formatBytes(uploadStats.compressedSize)} (
                      {Math.round((1 - uploadStats.compressedSize / uploadStats.originalSize) * 100)}% smaller)
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
                className='rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60'
              >
                + Upload file
              </button>
            </div>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) uploadAttachment(file);
              }}
            />
            {uploadError && (
              <p className='mb-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{uploadError}</p>
            )}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
              {attachments.map((attachment) => {
                const isImg = attachment.mimeType?.startsWith('image/');
                return (
                  <div
                    key={attachment.id}
                    className='group relative flex aspect-[4/3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950'
                  >
                    {isImg ? (
                      <button
                        type='button'
                        onClick={() => setPreviewAttachment(attachment)}
                        className='size-full cursor-pointer text-left focus:outline-none'
                        title={`Click to open preview: ${attachment.displayName}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.url}
                          alt={attachment.displayName}
                          className='size-full object-cover transition duration-200 group-hover:scale-105'
                        />
                      </button>
                    ) : (
                      <button
                        type='button'
                        onClick={() => setPreviewAttachment(attachment)}
                        className='flex size-full cursor-pointer flex-col items-center justify-center p-3 text-center transition focus:outline-none group-hover:bg-slate-200/50 dark:group-hover:bg-slate-900/50'
                        title={`Click to open: ${attachment.displayName}`}
                      >
                        <div className='mb-2 grid size-10 place-items-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                          <FiFileText className='size-5' />
                        </div>
                        <span className='w-full truncate px-1 text-xs font-semibold text-slate-800 dark:text-slate-200'>
                          {attachment.displayName}
                        </span>
                        <span className='mt-0.5 text-[10px] text-slate-400'>{formatBytes(attachment.byteSize)}</span>
                      </button>
                    )}

                    {/* Quick action buttons on hover */}
                    <div className='pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-1.5 opacity-0 transition group-hover:opacity-100'>
                      <button
                        type='button'
                        onClick={() => setPreviewAttachment(attachment)}
                        aria-label={`Preview ${attachment.displayName}`}
                        className='pointer-events-auto rounded bg-slate-950/80 p-1 text-white shadow hover:bg-slate-800'
                        title='Preview / Open'
                      >
                        <FiEye className='size-3.5' />
                      </button>
                      <div className='pointer-events-auto flex items-center gap-1'>
                        <a
                          href={attachment.url}
                          target='_blank'
                          rel='noreferrer'
                          download={attachment.displayName}
                          aria-label={`Download ${attachment.displayName}`}
                          className='rounded bg-slate-950/80 p-1 text-white shadow hover:bg-emerald-600'
                          title='Download / Open tab'
                        >
                          <FiDownload className='size-3.5' />
                        </a>
                        <button
                          type='button'
                          onClick={() => removeAttachment(attachment.id)}
                          aria-label={`Delete ${attachment.displayName}`}
                          className='rounded bg-slate-950/80 p-1 text-white shadow hover:bg-rose-600'
                          title='Delete'
                        >
                          <FiTrash2 className='size-3.5' />
                        </button>
                      </div>
                    </div>

                    {/* Bottom filename badge on hover */}
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent p-1.5 pt-4 text-[10px] text-white opacity-0 transition group-hover:opacity-100'>
                      <p className='truncate font-medium'>{attachment.displayName}</p>
                      <p className='text-[9px] text-slate-300'>{formatBytes(attachment.byteSize)}</p>
                    </div>
                  </div>
                );
              })}
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className='grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 p-3 text-center text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/5 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
              >
                <span>
                  <FiPaperclip className='mx-auto mb-1.5 size-4' />
                  {uploading ? 'Uploading…' : '+ Attach file'}
                </span>
              </button>
            </div>
          </section>

          {/* Activity and Comments Card */}
          <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60'>
            <div className='mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800'>
              <span className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                Activity & Comments
              </span>
              <span className='text-xs text-slate-500 dark:text-slate-400'>
                {comments.length} comment{comments.length === 1 ? '' : 's'}
              </span>
            </div>
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
            <div className='mt-4 space-y-3'>
              {comments.map((entry) => (
                <div
                  key={entry.id}
                  className='rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-start gap-3 min-w-0 flex-1'>
                      <div className='size-8 rounded-full bg-emerald-600 text-white font-bold grid place-items-center text-xs shrink-0'>
                        {entry.author ? entry.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <strong className='text-xs text-slate-900 dark:text-slate-200 font-semibold'>
                            {entry.author}
                          </strong>
                          <span className='text-[10px] text-slate-500'>
                            {new Date(entry.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                            {entry.editedAt && ' · edited'}
                          </span>
                        </div>
                        {editingCommentId === entry.id ? (
                          <MarkdownEditor
                            value={editingCommentBody}
                            onChange={setEditingCommentBody}
                            ariaLabel='Edit comment'
                            minHeight='min-h-20'
                          />
                        ) : (
                          <div className='text-xs text-slate-700 dark:text-slate-300'>
                            <MarkdownPreview compact>{entry.body}</MarkdownPreview>
                          </div>
                        )}
                      </div>
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
            </div>
          </section>
        </div>

        {/* Right Inspector & Relationships Panel */}
        <aside className='space-y-5'>
          {/* Properties Card */}
          <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 dark:border-slate-800/90 dark:bg-slate-900/60'>
            <span className='block border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400'>
              Properties
            </span>
            <label className='grid grid-cols-[5.5rem_1fr] items-center gap-2 text-sm'>
              <span className='text-xs text-slate-500'>Status</span>
              <select
                value={statusId}
                onChange={(event) => setStatusId(event.target.value)}
                className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-xs font-semibold text-emerald-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:text-emerald-400 dark:bg-slate-950'
              >
                {data.statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid grid-cols-[5.5rem_1fr] items-center gap-2 text-sm'>
              <span className='text-xs text-slate-500'>Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className='rounded-lg border border-slate-300 bg-transparent p-1.5 text-xs font-semibold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950'
              >
                {['highest', 'high', 'medium', 'low', 'lowest'].map((level) => (
                  <option key={level} value={level}>
                    {capitalize(level)}
                  </option>
                ))}
              </select>
            </label>
            {/* Assignee multi-select picker */}
            {/* Assignee multi-select picker */}
            <div className='grid grid-cols-[5.5rem_1fr] items-start gap-2 text-sm'>
              <span className='pt-1 text-xs text-slate-500'>Assignee</span>
              <div className='relative picker-container'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex flex-wrap items-center gap-1.5 min-w-0'>
                    {selectedAssignees.length === 0 ? (
                      <span className='text-xs italic text-slate-400 dark:text-slate-500'>Unassigned</span>
                    ) : (
                      selectedAssignees.map((user) => {
                        const initial = user.charAt(0).toUpperCase();
                        return (
                          <span
                            key={user}
                            className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 py-0.5 pl-1 pr-1.5 text-[11px] font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          >
                            <span className='grid size-4 place-items-center rounded-full bg-emerald-700 text-[9px] font-bold text-white'>
                              {initial}
                            </span>
                            <span className='max-w-[90px] truncate'>{user}</span>
                            <button
                              type='button'
                              onClick={() => removeAssignee(user)}
                              aria-label={`Remove assignee ${user}`}
                              className='text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                            >
                              <FiX className='size-2.5' />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      setAssigneePickerOpen((open) => !open);
                      setLabelPickerOpen(false);
                    }}
                    className='shrink-0 ml-auto inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                  >
                    <FiPlus className='size-2.5' /> Assign
                  </button>
                </div>

                {assigneePickerOpen && (
                  <div className='absolute right-0 top-full z-20 mt-1.5 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900'>
                    <div className='mb-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700'>
                      <FiSearch className='size-3 text-slate-400' />
                      <input
                        autoFocus
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder='Filter project users…'
                        className='w-full bg-transparent text-xs outline-none'
                      />
                    </div>
                    <div className='max-h-48 overflow-y-auto space-y-1'>
                      {availableUsers
                        .filter((u) => !assigneeSearch || u.name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                        .map((u) => {
                          const isSelected = selectedAssignees.includes(u.name);
                          const initial = u.name.charAt(0).toUpperCase();
                          return (
                            <button
                              key={u.email || u.name}
                              type='button'
                              onClick={() => toggleAssignee(u.name)}
                              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${
                                isSelected
                                  ? 'bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div className='flex items-center gap-2 min-w-0'>
                                <span className='grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-[10px] font-bold text-white'>
                                  {initial}
                                </span>
                                <span className='truncate'>{u.name}</span>
                              </div>
                              {isSelected && <FiCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />}
                            </button>
                          );
                        })}
                      {assigneeSearch &&
                        !availableUsers.some((u) => u.name.toLowerCase() === assigneeSearch.toLowerCase()) && (
                          <button
                            type='button'
                            onClick={() => {
                              toggleAssignee(assigneeSearch);
                              setAssigneeSearch('');
                            }}
                            className='flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                          >
                            <FiPlus className='size-3' /> Assign custom &quot;{assigneeSearch}&quot;
                          </button>
                        )}
                    </div>
                    {selectedAssignees.length > 0 && (
                      <div className='mt-2 border-t border-slate-100 pt-1.5 dark:border-slate-800'>
                        <button
                          type='button'
                          onClick={() => setAssignee('')}
                          className='w-full rounded-md py-1 text-center text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        >
                          Clear all assignees
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Labels multi-select picker */}
            <div className='grid grid-cols-[5.5rem_1fr] items-start gap-2 text-sm'>
              <span className='pt-1 text-xs text-slate-500'>Labels</span>
              <div className='relative picker-container'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex flex-wrap items-center gap-1 min-w-0'>
                    {(!issue.labels || issue.labels.length === 0) && (
                      <span className='text-xs italic text-slate-400 dark:text-slate-500'>None</span>
                    )}
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
                  <button
                    type='button'
                    onClick={() => {
                      setLabelPickerOpen((open) => !open);
                      setAssigneePickerOpen(false);
                    }}
                    className='shrink-0 ml-auto inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                  >
                    <FiPlus className='size-2.5' /> Label
                  </button>
                </div>

                {labelPickerOpen && (
                  <div className='absolute right-0 top-full z-20 mt-1.5 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900'>
                    <div className='mb-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700'>
                      <FiSearch className='size-3 text-slate-400' />
                      <input
                        autoFocus
                        value={labelSearch}
                        onChange={(e) => setLabelSearch(e.target.value)}
                        placeholder='Filter project labels…'
                        className='w-full bg-transparent text-xs outline-none'
                      />
                    </div>
                    <div className='max-h-48 overflow-y-auto space-y-1'>
                      {projectLabels
                        .filter((l) => !labelSearch || l.name.toLowerCase().includes(labelSearch.toLowerCase()))
                        .map((l) => {
                          const isAttached = issue.labels?.some(
                            (il) => il.id === l.id || il.name.toLowerCase() === l.name.toLowerCase()
                          );
                          return (
                            <button
                              key={l.id || l.name}
                              type='button'
                              onClick={() => toggleLabel(l)}
                              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${
                                isAttached
                                  ? 'bg-slate-100 font-bold dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className='inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold'
                                style={{ backgroundColor: l.backgroundColor, color: l.textColor }}
                              >
                                {l.name}
                              </span>
                              {isAttached && <FiCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />}
                            </button>
                          );
                        })}
                      {labelSearch &&
                        !projectLabels.some((l) => l.name.toLowerCase() === labelSearch.toLowerCase()) && (
                          <button
                            type='button'
                            onClick={() => addLabelWithName(labelSearch)}
                            className='flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                          >
                            <FiPlus className='size-3' /> Create and add &quot;{labelSearch}&quot;
                          </button>
                        )}
                    </div>
                  </div>
                )}
                {labelError && <p className='mt-1 text-xs text-rose-600 dark:text-rose-300'>{labelError}</p>}
              </div>
            </div>
            <div className='space-y-2 border-t border-slate-100 pt-2 text-xs dark:border-slate-800'>
              <div className='flex justify-between py-1'>
                <span className='text-slate-500'>Estimate</span>
                <span className='font-semibold text-slate-800 dark:text-slate-200'>
                  {typeof issue.storyPoints === 'number' ? `${issue.storyPoints} points` : 'Not estimated'}
                </span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-500'>Due date</span>
                <span className='font-semibold text-slate-800 dark:text-slate-200'>
                  {issue.dueAt ? new Date(issue.dueAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'None'}
                </span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-500'>Reporter</span>
                <span className='font-semibold text-slate-800 dark:text-slate-200'>{issue.reporter}</span>
              </div>
              <div className='flex justify-between py-1'>
                <span className='text-slate-500'>Created</span>
                <span className='font-semibold text-slate-800 dark:text-slate-200'>
                  {new Date(issue.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            </div>
          </div>

          {/* Relationships Card */}
          <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60'>
            <div className='flex items-center justify-between mb-3 border-b border-slate-100 pb-2 dark:border-slate-800'>
              <span className='text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                Relationships
              </span>
              <button
                type='button'
                onClick={() => setRelationshipOpen((open) => !open)}
                className='inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60'
              >
                <FiPlus /> Link issue
              </button>
            </div>
            {relationships.length > 0 ? (
              <div className='divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800'>
                {relationships.map((rel) => {
                  const typeCapsule = getIssueTypeCapsule(rel.issue?.issueType);
                  return (
                    <div key={rel.id} className='flex items-center justify-between gap-2 p-2.5 text-xs'>
                      <span className='flex min-w-0 items-center gap-1.5 truncate'>
                        <span className='shrink-0 text-slate-500'>{rel.label}</span>
                        <span
                          className={`shrink-0 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold uppercase tracking-wider ${typeCapsule.classes}`}
                        >
                          {typeCapsule.label}
                        </span>
                        <Link
                          href={issueHref(rel.issue.key, `/admin/issues/${issueKey}`)}
                          className='shrink-0 font-mono font-semibold text-emerald-700 hover:underline dark:text-emerald-400'
                        >
                          {rel.issue.key}
                        </Link>
                        <span title={rel.issue.title} className='truncate text-slate-700 dark:text-slate-300'>
                          {rel.issue.title}
                        </span>
                      </span>
                      <button
                        type='button'
                        onClick={() => removeRelationship(rel.id)}
                        aria-label={`Remove relationship with ${rel.issue.key}`}
                        className='shrink-0 rounded px-1.5 py-0.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/60'
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className='text-xs text-slate-400'>No linked relationships yet.</p>
            )}
            {relationshipOpen && (
              <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950'>
                <div className='flex items-center justify-between gap-2'>
                  <label className='text-xs font-bold text-slate-700 dark:text-slate-300'>
                    Type:
                    <select
                      value={relationshipType}
                      onChange={(event) => setRelationshipType(event.target.value)}
                      className='ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900'
                    >
                      <option value='relates_to'>relates to</option>
                      <option value='blocks'>blocks</option>
                      <option value='predecessor'>has predecessor</option>
                      <option value='successor'>has successor</option>
                      <option value='parent'>has parent</option>
                      <option value='child'>has child</option>
                      <option value='duplicates'>duplicates</option>
                    </select>
                  </label>
                  <button
                    type='button'
                    onClick={() => {
                      setRelationshipOpen(false);
                      setRelationshipSearch('');
                      setRelationshipResults([]);
                      setRelationshipError(null);
                    }}
                    className='rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  >
                    Cancel
                  </button>
                </div>
                <input
                  autoFocus
                  value={relationshipSearch}
                  onChange={(event) => setRelationshipSearch(event.target.value)}
                  className='mt-2.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900'
                  placeholder='Search by issue key (e.g. PORT-1, 1) or title…'
                />
                {relationshipResults.map((result) => {
                  const typeCapsule = getIssueTypeCapsule(result.issueType);
                  return (
                    <button
                      key={result.id}
                      type='button'
                      disabled={relationshipBusy}
                      onClick={() => addRelationship(result.key)}
                      title={result.title}
                      className='mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg bg-white p-2 text-left text-xs hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-900 dark:hover:bg-slate-800'
                    >
                      <span className='min-w-0 truncate'>
                        <strong className='font-mono'>{result.key}</strong>{' '}
                        <span className='text-slate-700 dark:text-slate-300'>{result.title}</span>
                      </span>
                      <span
                        className={`shrink-0 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold uppercase tracking-wider ${typeCapsule.classes}`}
                      >
                        {typeCapsule.label}
                      </span>
                    </button>
                  );
                })}
                {relationshipError && (
                  <p className='mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300'>{relationshipError}</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Attachment Lightbox / Modal */}
      {previewAttachment && (
        <div
          role='dialog'
          aria-modal='true'
          className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm'
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className='relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800'>
              <div className='flex min-w-0 items-center gap-2.5 truncate'>
                <span className='truncate text-sm font-bold text-slate-800 dark:text-slate-100'>
                  {previewAttachment.displayName}
                </span>
                <span className='shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                  {formatBytes(previewAttachment.byteSize)}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <a
                  href={previewAttachment.url}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  <FiExternalLink className='size-3.5' /> Open tab
                </a>
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.displayName}
                  className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500'
                >
                  <FiDownload className='size-3.5' /> Download
                </a>
                <button
                  type='button'
                  onClick={() => setPreviewAttachment(null)}
                  aria-label='Close preview'
                  className='rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                >
                  <FiX className='size-5' />
                </button>
              </div>
            </div>

            <div className='grid max-h-[calc(92vh-4.5rem)] place-items-center overflow-auto bg-slate-950/5 p-4 dark:bg-slate-950/50'>
              {previewAttachment.mimeType?.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.displayName}
                  className='max-h-[76vh] w-auto max-w-full rounded-lg object-contain shadow-md'
                />
              ) : (
                <div className='flex flex-col items-center gap-3 py-12 text-center'>
                  <div className='grid size-20 place-items-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                    <FiFileText className='size-10' />
                  </div>
                  <div>
                    <p className='text-base font-bold text-slate-800 dark:text-slate-100'>
                      {previewAttachment.displayName}
                    </p>
                    <p className='mt-0.5 text-xs text-slate-500'>
                      {previewAttachment.mimeType || 'Document'} • {formatBytes(previewAttachment.byteSize)}
                    </p>
                  </div>
                  <a
                    href={previewAttachment.url}
                    target='_blank'
                    rel='noreferrer'
                    download={previewAttachment.displayName}
                    className='mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500'
                  >
                    <FiDownload className='size-4' /> Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
