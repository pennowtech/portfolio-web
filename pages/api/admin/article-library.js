import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import { renameNotionArticle, setNotionArticlePublished } from '@utils/notionPublisher';

const PAGE_ID = /^[0-9a-f-]{32,40}$/i;
const MAX_BULK = 25;

export default async function handler(req, res) {
  res.setHeader('Allow', 'PATCH');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Only PATCH is allowed.' });
  if (!isSameOriginRequest(req)) return res.status(403).json({ message: 'Request origin could not be verified.' });
  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ message: 'Your admin session has expired.' });

  const { action, id, title, ids } = req.body || {};

  if (action === 'rename') {
    const trimmed = typeof title === 'string' ? title.trim() : '';
    if (typeof id !== 'string' || !PAGE_ID.test(id)) return res.status(400).json({ message: 'Invalid article id.' });
    if (!trimmed || trimmed.length > 180)
      return res.status(400).json({ message: 'Titles must be between 1 and 180 characters.' });
    try {
      return res.status(200).json({ article: await renameNotionArticle(id, trimmed) });
    } catch (error) {
      console.error('Notion rename failed:', error.message);
      return res.status(502).json({ message: 'Notion could not rename the article. Nothing was changed.' });
    }
  }

  if (action === 'unpublish') {
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > MAX_BULK ||
      !ids.every((value) => typeof value === 'string' && PAGE_ID.test(value))
    )
      return res.status(400).json({ message: `Choose between 1 and ${MAX_BULK} articles.` });
    // Sequential on purpose: Notion rate-limits writes, and a partial failure must be reportable per article.
    const moved = [];
    const failed = [];
    for (const articleId of ids) {
      try {
        await setNotionArticlePublished(articleId, false);
        moved.push(articleId);
      } catch (error) {
        console.error('Notion unpublish failed:', error.message);
        failed.push(articleId);
      }
    }
    return res.status(failed.length && !moved.length ? 502 : 200).json({ moved, failed });
  }

  return res.status(400).json({ message: 'Unknown action.' });
}
