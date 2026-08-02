import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { FiChevronDown, FiEdit3, FiExternalLink, FiFileText, FiSearch } from 'react-icons/fi';

const ArticleLibrary = ({ articles = [], loading, message }) => {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(
    () =>
      articles.filter(
        (article) =>
          (status === 'all' || (status === 'published') === article.published) &&
          `${article.title} ${article.category} ${article.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
      ),
    [articles, query, status]
  );
  const published = articles.filter((article) => article.published).length;

  return (
    <section className='mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
      <button
        type='button'
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls='notion-article-library'
        className='flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700 dark:hover:bg-slate-800/60'
      >
        <div>
          <p className='font-Monda text-xs uppercase tracking-wider text-green-700 dark:text-green-400'>
            Notion article library
          </p>
          <h2 className='mt-1 font-Neuton text-2xl font-semibold text-slate-900 dark:text-white'>Existing articles</h2>
          <p className='mt-0.5 text-sm text-slate-500'>
            {articles.length} total · {published} published · {articles.length - published} drafts
          </p>
        </div>
        <FiChevronDown
          aria-hidden='true'
          className={`shrink-0 text-2xl text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div id='notion-article-library' className='border-t border-slate-200 dark:border-slate-700'>
          <div className='p-4 md:p-5'>
            <label className='relative block w-full'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
              <span className='sr-only'>Search articles</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search title, category, or tag'
                className='min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 font-normal dark:border-slate-600 dark:bg-slate-950'
              />
            </label>
          </div>
          <div className='flex gap-2 border-y border-slate-200 px-5 py-3 dark:border-slate-700'>
            {['all', 'published', 'draft'].map((item) => (
              <button
                key={item}
                type='button'
                onClick={() => setStatus(item)}
                className={`rounded-full px-3 py-1.5 text-sm capitalize ${status === item ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {item === 'draft' ? 'Drafts' : item}
              </button>
            ))}
          </div>
          <div className='max-h-[430px] overflow-y-auto'>
            {loading && <p className='p-6 text-sm text-slate-500'>Loading articles from Notion…</p>}
            {!loading && message && <p className='p-6 text-sm text-amber-700 dark:text-amber-300'>{message}</p>}
            {!loading && !message && filtered.length === 0 && (
              <p className='p-6 text-sm text-slate-500'>No articles match this view.</p>
            )}
            {filtered.map((article) => (
              <article
                key={article.id}
                className='grid gap-3 border-b border-slate-100 p-5 last:border-0 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <h3 className='min-w-0 flex-1 truncate font-Neuton text-xl font-semibold text-slate-900 dark:text-white'>
                    {article.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${article.published ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'}`}
                  >
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className='flex gap-2'>
                  <a
                    href={article.notionUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600'
                  >
                    <FiFileText /> Notion
                  </a>
                  {article.published && article.slug && (
                    <Link
                      href={`/blog/${article.slug}`}
                      target='_blank'
                      className='flex min-h-10 items-center gap-2 rounded-lg bg-green-700 px-3 text-sm text-white'
                    >
                      <FiExternalLink /> View
                    </Link>
                  )}
                  <Link
                    href={`/admin/articles/new?id=${encodeURIComponent(article.id)}#article-form`}
                    className='flex min-h-10 items-center gap-2 rounded-lg border border-green-700 px-3 text-sm text-green-800 dark:border-green-500 dark:text-green-300'
                  >
                    <FiEdit3 /> Edit
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ArticleLibrary;
