import { formFingerprint } from '@utils/articleDraft';

// Snapshots of the local working draft, kept on this device only. Server-side history (Supabase)
// is separate and follows the author across machines; the recovery page merges both.
export const MAX_LOCAL_SNAPSHOTS = 15;
const PREFIX = 'sbt:article-history:v1:';

export const historyKey = (owner, articleId) => `${PREFIX}${encodeURIComponent(owner)}:${articleId || 'new'}`;

export const stripCover = (form) => {
  const { coverUpload: _coverUpload, ...rest } = form || {};
  return rest;
};

export const readLocalHistory = (storage, key) => {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry) => entry && typeof entry.savedAt === 'string' && entry.form && typeof entry.form === 'object'
        )
      : [];
  } catch {
    return [];
  }
};

// Adds a snapshot unless it duplicates the newest one, or (with minIntervalMs) the newest is too recent.
export const addLocalSnapshot = (storage, key, form, { kind = 'local', minIntervalMs = 0 } = {}) => {
  const entries = readLocalHistory(storage, key);
  const cleaned = stripCover(form);
  const newest = entries[0];
  if (newest && formFingerprint(stripCover(newest.form)) === formFingerprint(cleaned)) return entries;
  if (newest && minIntervalMs && Date.now() - new Date(newest.savedAt).getTime() < minIntervalMs) return entries;
  const next = [{ id: `${Date.now()}`, savedAt: new Date().toISOString(), kind, form: cleaned }, ...entries].slice(
    0,
    MAX_LOCAL_SNAPSHOTS
  );
  try {
    storage.setItem(key, JSON.stringify(next));
  } catch {
    // Quota exceeded: history is a convenience, never block writing over it.
  }
  return next;
};

export const clearLocalHistory = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
};

// Clears history for every article of this author on this device; returns how many entries were removed.
export const clearAllLocalHistory = (storage, owner) => {
  const prefix = `${PREFIX}${encodeURIComponent(owner)}:`;
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && key.startsWith(prefix)) keys.push(key);
  }
  let removed = 0;
  keys.forEach((key) => {
    removed += readLocalHistory(storage, key).length;
    clearLocalHistory(storage, key);
  });
  return removed;
};
