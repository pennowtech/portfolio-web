import React from 'react';
import Link from 'next/link';
import ImageWithFallback from '../ImageWithFallback';
import PostTags from './PostTags';
import PostDate from './PostDate';
import PostCategories from './PostCategories';
import PostExcerpt from './PostExcerpt';

const VerticalCard = ({ post, showExcerpt = false, className = '' }) => (
  <article
    className={`group h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-500 dark:bg-gray-700 dark:hover:border-slate-400 ${className || 'flex'}`}
  >
    <Link
      href={`/blog/${post.slug}`}
      aria-label={`Read ${post.title}`}
      className='relative block aspect-[16/9] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600'
    >
      <ImageWithFallback
        fallbackSrc='/blank.jpg'
        src={post.thumbnailUrl}
        alt={post.title}
        className='object-cover transition duration-300 group-hover:scale-[1.03]'
        layout='fill'
        objectFit='cover'
        sizes='(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw'
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/75 to-transparent'
      />
      <PostCategories categories={post.categories} variant='card' />
    </Link>

    <div className='flex flex-1 flex-col p-5'>
      <Link
        href={`/blog/${post.slug}`}
        className='rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600'
      >
        <h3 className='mb-3 mt-0 line-clamp-2 font-Neuton text-2xl font-semibold leading-tight transition group-hover:text-green-800 dark:group-hover:text-green-400'>
          {post.title}
        </h3>
      </Link>

      {showExcerpt && (
        <PostExcerpt
          className='mb-5 line-clamp-3 text-base leading-relaxed text-slate-600 dark:text-slate-200'
          excerpt={post.description}
          blogUrl={post.slug}
          length={140}
          showReadNow={false}
        />
      )}

      <div className='mt-auto border-t border-slate-200 pt-4 dark:border-slate-500'>
        <PostDate date={post.date} readingTime={post.readingTime?.minutes ?? post.readingTime} variant='card' />
        <PostTags tags={post.tags} variant='card' />
      </div>
    </div>
  </article>
);
export default VerticalCard;
