import React from 'react';
import Link from 'next/link';
import ImageWithFallback from '../ImageWithFallback';
import PostTags from './PostTags';
import PostDate from './PostDate';
import PostCategories from './PostCategories';
import PostExcerpt from './PostExcerpt';

const VerticalCard = ({ post, showExcerpt = false, className = '' }) => (
  <article
    className={`not-prose group h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-500/40 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-orange-500/30 ${className || 'flex'}`}
  >
    <Link
      href={`/blog/${post.slug}`}
      aria-label={`Read ${post.title}`}
      className='relative block aspect-[16/10] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600'
    >
      <ImageWithFallback
        fallbackSrc='/blank.jpg'
        src={post.thumbnailUrl}
        alt={post.title}
        className='m-0 object-cover object-top transition-transform duration-500 group-hover:scale-105'
        layout='fill'
        objectFit='cover'
        sizes='(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw'
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent'
      />
      <PostCategories categories={post.categories} variant='card' />
    </Link>

    <div className='flex flex-1 flex-col p-6'>
      <Link
        href={`/blog/${post.slug}`}
        className='rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600'
      >
        <h3 className='mb-3 mt-0 line-clamp-2 font-Neuton text-2xl font-semibold leading-tight text-slate-900 transition duration-200 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400'>
          {post.title}
        </h3>
      </Link>

      {showExcerpt && (
        <PostExcerpt
          className='mb-5 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300'
          excerpt={post.description}
          blogUrl={post.slug}
          length={140}
          showReadNow={false}
        />
      )}

      <div className='mt-auto border-t border-slate-100 pt-4 dark:border-slate-800/80'>
        <PostDate date={post.date} readingTime={post.readingTime?.minutes ?? post.readingTime} variant='card' />
        <PostTags tags={post.tags} variant='card' />
      </div>
    </div>
  </article>
);
export default VerticalCard;
