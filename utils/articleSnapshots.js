import { getIssueboardSupabaseAdmin } from '@utils/issueboard/supabaseAdmin';

export const MAX_SNAPSHOTS_PER_ARTICLE = 30;
export const SNAPSHOT_KINDS = ['notion_saved', 'published', 'restored'];

const COLUMNS = 'id,article_key,kind,title,form,created_at';

// Pending cover uploads are base64 data URLs -- far too large to keep per snapshot.
export const snapshotForm = (form) => {
  const { coverUpload: _coverUpload, ...rest } = form || {};
  return rest;
};

const toSnapshot = (row) => ({
  id: row.id,
  articleKey: row.article_key,
  kind: row.kind,
  title: row.title,
  form: row.form,
  createdAt: row.created_at
});

export const listSnapshots = async (owner, articleKey) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('article_snapshots')
    .select(COLUMNS)
    .eq('owner', owner)
    .eq('article_key', articleKey)
    .order('created_at', { ascending: false })
    .limit(MAX_SNAPSHOTS_PER_ARTICLE);
  if (error) throw error;
  return data.map(toSnapshot);
};

// Article keys that have stored history, with a count -- used by the library's bulk cleanup.
export const summarizeSnapshots = async (owner) => {
  const { data, error } = await getIssueboardSupabaseAdmin()
    .from('article_snapshots')
    .select('article_key')
    .eq('owner', owner)
    .limit(5000);
  if (error) throw error;
  const counts = {};
  data.forEach((row) => {
    counts[row.article_key] = (counts[row.article_key] || 0) + 1;
  });
  return counts;
};

export const createSnapshot = async (owner, articleKey, kind, form) => {
  const admin = getIssueboardSupabaseAdmin();
  const { data, error } = await admin
    .from('article_snapshots')
    .insert({ owner, article_key: articleKey, kind, title: String(form.title || ''), form: snapshotForm(form) })
    .select(COLUMNS)
    .single();
  if (error) throw error;

  // Keep the newest MAX_SNAPSHOTS_PER_ARTICLE per article; older ones are trimmed.
  const { data: stale, error: staleError } = await admin
    .from('article_snapshots')
    .select('id')
    .eq('owner', owner)
    .eq('article_key', articleKey)
    .order('created_at', { ascending: false })
    .range(MAX_SNAPSHOTS_PER_ARTICLE, MAX_SNAPSHOTS_PER_ARTICLE + 200);
  if (!staleError && stale?.length) {
    await admin
      .from('article_snapshots')
      .delete()
      .in(
        'id',
        stale.map((row) => row.id)
      );
  }
  return toSnapshot(data);
};

// Deletes history for the given articles (or every article the author has, when `articleKeys` is null).
// Returns how many snapshot rows were removed.
export const deleteSnapshots = async (owner, articleKeys) => {
  let query = getIssueboardSupabaseAdmin().from('article_snapshots').delete({ count: 'exact' }).eq('owner', owner);
  if (Array.isArray(articleKeys)) query = query.in('article_key', articleKeys);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};
