import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import {
  SNAPSHOT_KINDS,
  createSnapshot,
  deleteSnapshots,
  listSnapshots,
  summarizeSnapshots
} from '@utils/articleSnapshots';
import { isIssueboardSupabaseConfigured } from '@utils/issueboard/supabaseAdmin';

const ARTICLE_KEY = /^[0-9a-f-]{32,40}$/i;
const STRING_FIELDS = ['title', 'slug', 'description', 'coverUrl', 'publicationDate', 'category', 'tags', 'markdown'];
const MAX_BULK_KEYS = 200;

const validForm = (form) =>
  form &&
  typeof form === 'object' &&
  STRING_FIELDS.every((field) => typeof form[field] === 'string') &&
  form.markdown.length <= 200000;

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET, POST, DELETE');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'DELETE'].includes(req.method))
    return res.status(405).json({ message: 'Only GET, POST, and DELETE are allowed.' });
  if (req.method !== 'GET' && !isSameOriginRequest(req))
    return res.status(403).json({ message: 'Request origin could not be verified.' });
  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ message: 'Your admin session has expired.' });
  if (!isIssueboardSupabaseConfigured())
    return res.status(503).json({ message: 'Version history storage is not configured.' });
  const owner = session.user.email;

  try {
    if (req.method === 'GET') {
      const { articleKey } = req.query;
      if (typeof articleKey !== 'string') return res.status(200).json({ counts: await summarizeSnapshots(owner) });
      if (!ARTICLE_KEY.test(articleKey)) return res.status(400).json({ message: 'Invalid article id.' });
      return res.status(200).json({ snapshots: await listSnapshots(owner, articleKey) });
    }

    if (req.method === 'POST') {
      const { articleKey, kind, form } = req.body || {};
      if (typeof articleKey !== 'string' || !ARTICLE_KEY.test(articleKey))
        return res.status(400).json({ message: 'Invalid article id.' });
      if (!SNAPSHOT_KINDS.includes(kind)) return res.status(400).json({ message: 'Invalid snapshot kind.' });
      if (!validForm(form)) return res.status(400).json({ message: 'Invalid article snapshot.' });
      return res.status(201).json({ snapshot: await createSnapshot(owner, articleKey, kind, form) });
    }

    const { articleKeys, all } = req.body || {};
    if (all === true) return res.status(200).json({ deleted: await deleteSnapshots(owner, null) });
    if (
      !Array.isArray(articleKeys) ||
      articleKeys.length === 0 ||
      articleKeys.length > MAX_BULK_KEYS ||
      !articleKeys.every((key) => typeof key === 'string' && ARTICLE_KEY.test(key))
    )
      return res.status(400).json({ message: 'Provide up to 200 valid article ids, or { "all": true }.' });
    return res.status(200).json({ deleted: await deleteSnapshots(owner, articleKeys) });
  } catch (error) {
    console.error('Article snapshot request failed:', error.message);
    return res.status(502).json({ message: 'Version history could not be reached. Nothing was changed.' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
