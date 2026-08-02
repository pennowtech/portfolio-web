import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isSameOriginRequest } from '@utils/requestSecurity';
import {
  createNotionArticle,
  getArticleTaxonomy,
  getNotionArticleForEditing,
  updateNotionArticle
} from '@utils/notionPublisher';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_URL_PATTERN = /^https:\/\/[^\s]+$/i;

const validateArticle = (body) => {
  const article = {
    title: typeof body?.title === 'string' ? body.title.trim() : '',
    slug: typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '',
    description: typeof body?.description === 'string' ? body.description.trim() : '',
    coverUrl: typeof body?.coverUrl === 'string' ? body.coverUrl.trim() : '',
    coverUpload:
      body?.coverUpload && typeof body.coverUpload.dataUrl === 'string' && typeof body.coverUpload.name === 'string'
        ? { dataUrl: body.coverUpload.dataUrl, name: body.coverUpload.name.slice(0, 200) }
        : null,
    coverCredit:
      body?.coverCredit &&
      typeof body.coverCredit.photographer === 'string' &&
      typeof body.coverCredit.profileUrl === 'string' &&
      typeof body.coverCredit.provider === 'string' &&
      typeof body.coverCredit.providerUrl === 'string'
        ? {
            photographer: body.coverCredit.photographer.slice(0, 120),
            profileUrl: body.coverCredit.profileUrl,
            provider: body.coverCredit.provider.slice(0, 40),
            providerUrl: body.coverCredit.providerUrl
          }
        : null,
    publicationDate: typeof body?.publicationDate === 'string' ? body.publicationDate : '',
    category: typeof body?.category === 'string' ? body.category.trim() : '',
    tags: Array.isArray(body?.tags) ? body.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    markdown: typeof body?.markdown === 'string' ? body.markdown : '',
    published: body?.published === true
  };
  const errors = {};

  if (article.title.length < 5 || article.title.length > 180)
    errors.title = 'Use a title between 5 and 180 characters.';
  if (!SLUG_PATTERN.test(article.slug) || article.slug.length > 180)
    errors.slug = 'Use lowercase words separated by hyphens.';
  if (article.description.length < 20 || article.description.length > 500) {
    errors.description = 'Use a description between 20 and 500 characters.';
  }
  if (article.coverUrl && !HTTPS_URL_PATTERN.test(article.coverUrl))
    errors.coverUrl = 'Use a complete HTTPS image URL.';
  if (article.coverUpload && article.coverUpload.dataUrl.length > 8_000_000)
    errors.coverUrl = 'Keep uploaded cover images under 5 MB.';
  if (
    article.coverCredit &&
    (!HTTPS_URL_PATTERN.test(article.coverCredit.profileUrl) ||
      !HTTPS_URL_PATTERN.test(article.coverCredit.providerUrl))
  )
    errors.coverUrl = 'The selected image attribution is invalid.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(article.publicationDate)) errors.publicationDate = 'Choose a publication date.';
  if (!article.category || article.category.length > 80) errors.category = 'Choose a category under 80 characters.';
  if (article.tags.length > 12 || article.tags.some((tag) => tag.length > 80))
    errors.tags = 'Use up to 12 concise tags.';
  if (article.markdown.trim().length < 100) errors.markdown = 'The article needs at least 100 characters of Markdown.';
  if (article.markdown.length > 150000) errors.markdown = 'Keep Markdown under 150,000 characters.';

  return { article, errors };
};

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
