import { authOptions, isAdminSession } from '@utils/authOptions';
import { getServerSession } from 'next-auth/next';
import { isSameOriginRequest } from '@utils/requestSecurity';
import {
  createNotionArticle,
  getArticleTaxonomy,
  getNotionArticleForEditing,
  updateNotionArticle
} from '@utils/notionPublisher';

import { validateArticle } from '@utils/articleValidation';

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET, POST, PATCH');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PATCH'].includes(req.method))
    return res.status(405).json({ message: 'Only GET, POST, and PATCH are allowed.' });
  if (['POST', 'PATCH'].includes(req.method) && !isSameOriginRequest(req))
    return res.status(403).json({ message: 'Request origin could not be verified.' });
  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ message: 'Your admin session has expired.' });

  if (req.method === 'GET') {
    try {
      if (typeof req.query.id === 'string') return res.status(200).json(await getNotionArticleForEditing(req.query.id));
      return res.status(200).json(await getArticleTaxonomy());
    } catch (error) {
      console.error('Notion taxonomy loading failed:', error.message);
      return res.status(502).json({ message: 'Notion categories and tags could not be loaded.' });
    }
  }

  const { article, errors } = validateArticle(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Check the highlighted article fields.', errors });
  }

  try {
    const saved =
      req.method === 'PATCH' && typeof req.query.id === 'string'
        ? await updateNotionArticle(req.query.id, article)
        : await createNotionArticle(article);
    return res.status(req.method === 'PATCH' ? 200 : 201).json({
      message:
        req.method === 'PATCH'
          ? article.published
            ? 'Published article updated in Notion.'
            : 'Draft updated in Notion.'
          : article.published
            ? 'Article published in Notion.'
            : 'Draft saved in Notion.',
      article: saved
    });
  } catch (error) {
    console.error('Notion article creation failed:', error.message);
    if (error.code === 'DUPLICATE_SLUG')
      return res.status(409).json({ message: error.message, errors: { slug: error.message } });
    return res
      .status(502)
      .json({ message: 'Notion could not create the article. Check the database schema and access.' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };
