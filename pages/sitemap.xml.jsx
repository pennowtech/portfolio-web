import { getPublishedBlogPosts } from '@utils/notion';
import { DUMMY_ARTICLE_SLUG } from '@utils/dummyArticle';
import { absoluteUrl } from '@utils/site';

const escapeXml = (value) =>
  value.replace(/[<>&'\"]/g, (character) => {
    const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
    return entities[character];
  });

const renderSitemap = (paths) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`).join('\n')}
</urlset>`;

export const getServerSideProps = async ({ res }) => {
  const posts = await getPublishedBlogPosts();
  const tags = posts
    .flatMap((post) => post.tags || [])
    .map((tag) => tag.name)
    .filter(Boolean);
  const paths = new Set([
    '/',
    '/about-me',
    '/page',
    '/contact',
    '/privacy',
    '/imprint',
    `/blog/${DUMMY_ARTICLE_SLUG}`,
    ...posts.filter((post) => post.slug).map((post) => `/blog/${post.slug}`),
    ...tags.map((tag) => `/tag/${encodeURIComponent(tag)}`)
  ]);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(renderSitemap([...paths]));
  res.end();

  return { props: {} };
};

const Sitemap = () => null;

export default Sitemap;
