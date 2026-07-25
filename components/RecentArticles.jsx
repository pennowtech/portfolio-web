import React from 'react';
import Link from 'next/link';
import { BiNews } from 'react-icons/bi';
import PostDate from './Post/PostDate';

const RecentArticles = ({ recentPosts }) => (
  <section aria-labelledby='recent-articles-title'>
    <h2 id='recent-articles-title' className='mb-4 font-Neuton text-2xl font-semibold'>
      Recent articles
    </h2>
    <div className='grid gap-0 sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-1 xl:gap-0'>
      {recentPosts?.map((post) => (
        <article key={post.id} className='border-b border-slate-200 py-4 first:pt-0 dark:border-slate-500'>
          <Link
            className='font-medium leading-snug transition hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:hover:text-green-400'
            href={`/blog/${post.slug}`}
          >
            {post.title}
          </Link>
          <PostDate date={post.date} readingTime={post.readingTime?.minutes ?? post.readingTime} variant='card' />
        </article>
      ))}
    </div>
  </section>
);

export default RecentArticles;
