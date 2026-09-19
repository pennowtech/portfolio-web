import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiLayers,
  FiPlus,
  FiSearch,
  FiX
} from 'react-icons/fi';

const ArticleLibrary = ({ articles = [], loading, message, activeArticleId = '' }) => {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const publishedCount = useMemo(() => articles.filter((article) => article.published).length, [articles]);
  const draftCount = articles.length - publishedCount;

  const filtered = useMemo(
    () =>
      articles.filter((article) => {
        const matchesStatus =
          status === 'all' ||
          (status === 'published' && article.published) ||
          (status === 'draft' && !article.published);
        const tagsString = Array.isArray(article.tags) ? article.tags.join(' ') : '';
        const matchesQuery =
          !query ||
          `${article.title || ''} ${article.category || ''} ${tagsString}`
            .toLowerCase()
            .includes(query.toLowerCase().trim());
        return matchesStatus && matchesQuery;
      }),
    [articles, query, status]
  );

  return (
    <aside
      className='overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/95'
      aria-label='Article Drafts Deck'
    >
      {/* Deck Header */}
      <div className='flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800'>
        <div className='flex items-center gap-2'>
          <div className='grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
            <FiLayers className='size-3.5' />
          </div>
          <div>
            <div className='flex items-center gap-1.5'>
              <h2 className='font-Neuton text-base font-bold text-slate-900 dark:text-white leading-none'>
                Drafts Deck
              </h2>
              <span className='rounded-full bg-slate-100 px-1.5 py-0 text-[10px] font-bold leading-tight text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                {articles.length}
              </span>
            </div>
            <p className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none'>
              {publishedCount} published · {draftCount} drafts
            </p>
          </div>
        </div>

        <div className='flex items-center gap-1'>
          <Link
            href='/admin/articles/new#article-form'
            title='Create new article'
            className='inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300'
          >
            <FiPlus className='size-3.5' />
          </Link>
          <button
            type='button'
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand drafts deck' : 'Collapse drafts deck'}
            className='inline-flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 xl:hidden'
          >
            {collapsed ? <FiChevronDown className='size-3.5' /> : <FiChevronUp className='size-3.5' />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className='p-2.5 space-y-2'>
          {/* Search Bar */}
          <div className='relative'>
            <FiSearch className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400' />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search drafts, categories…'
              className='h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-7.5 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-900'
            />
            {query && (
              <button
                type='button'
                onClick={() => setQuery('')}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              >
                <FiX className='size-3' />
              </button>
            )}
          </div>

          {/* Filter Status Pills */}
          <div className='flex gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5 dark:border-slate-800 dark:bg-slate-950/60'>
            {[
              { id: 'all', label: 'All', count: articles.length },
              { id: 'draft', label: 'Drafts', count: draftCount },
              { id: 'published', label: 'Published', count: publishedCount }
            ].map(({ id, label, count }) => (
              <button
                key={id}
                type='button'
                onClick={() => setStatus(id)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md py-0.5 text-[10px] font-semibold transition ${
                  status === id
                    ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-800 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[9px] ${status === id ? 'opacity-85' : 'opacity-60'}`}>({count})</span>
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className='max-h-[calc(100vh-300px)] space-y-2 overflow-y-auto pr-0.5'>
            {loading && (
              <div className='space-y-2 p-1'>
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className='h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
                  />
                ))}
              </div>
            )}

            {!loading && message && (
              <p className='p-3 text-center text-xs text-amber-600 dark:text-amber-400'>{message}</p>
            )}

            {!loading && !message && filtered.length === 0 && (
              <div className='py-6 text-center'>
                <FiFileText className='mx-auto size-5 text-slate-300 dark:text-slate-600' />
                <p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400'>No articles found</p>
                {query && (
                  <button
                    type='button'
                    onClick={() => setQuery('')}
                    className='mt-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400'
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            )}

            {!loading &&
              filtered.map((article) => {
                const isActive = activeArticleId === article.id;
                return (
                  <article
                    key={article.id}
                    className={`group relative rounded-xl border p-2.5 transition-all duration-150 ${
                      isActive
                        ? 'border-emerald-500/80 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20 dark:border-emerald-500/50 dark:bg-emerald-950/30'
                        : 'border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-850'
                    }`}
                  >
                    {/* Top Meta Line: Status & Category */}
                    <div className='flex items-center justify-between gap-2 pb-1'>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[9px] font-bold leading-tight ${
                          article.published
                            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            article.published ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        {article.published ? 'Published' : 'Draft'}
                      </span>

                      {article.category && (
                        <span className='max-w-[140px] truncate text-[10px] font-medium text-slate-500 dark:text-slate-400'>
                          {article.category}
                        </span>
                      )}
                    </div>

                    {/* Article Title (Tags removed as requested) */}
                    <h3 className='font-Neuton text-sm font-semibold leading-snug text-slate-900 line-clamp-2 dark:text-white'>
                      <Link
                        href={`/admin/articles/new?id=${encodeURIComponent(article.id)}#article-form`}
                        className='hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors'
                      >
                        {article.title}
                      </Link>
                    </h3>

                    {/* Action Bar Footer */}
                    <div className='mt-2 flex items-center justify-between border-t border-slate-100/80 pt-1.5 dark:border-slate-800/80'>
                      <div className='flex items-center gap-1 text-[10px] text-slate-400'>
                        {article.publicationDate || article.updatedDate || 'No date'}
                      </div>

                      <div className='flex items-center gap-1'>
                        {article.notionUrl && (
                          <a
                            href={article.notionUrl}
                            target='_blank'
                            rel='noreferrer'
                            title='Open in Notion'
                            className='inline-flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition'
                          >
                            <FiFileText className='size-3' />
                          </a>
                        )}

                        {article.published && article.slug && (
                          <Link
                            href={`/blog/${article.slug}`}
                            target='_blank'
                            title='View live article'
                            className='inline-flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition'
                          >
                            <FiExternalLink className='size-3' />
                          </Link>
                        )}

                        <Link
                          href={`/admin/articles/new?id=${encodeURIComponent(article.id)}#article-form`}
                          title='Edit in workspace'
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border border-slate-200 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
                          }`}
                        >
                          <FiEdit3 className='size-2.5' />
                          <span>{isActive ? 'Active' : 'Edit'}</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ArticleLibrary;
