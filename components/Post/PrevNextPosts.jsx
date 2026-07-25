import Link from 'next/link';
import React from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const PrevNextPosts = ({ postsNextPrevInfo }) => {
  const previous = postsNextPrevInfo?.prevPostLink
    ? {
        href: `/blog/${postsNextPrevInfo.prevPostLink}`,
        title: postsNextPrevInfo.prevPostTitle,
        label: 'Previous article',
        icon: FaArrowLeft
      }
    : null;
  const next = postsNextPrevInfo?.nextPostLink
    ? {
        href: `/blog/${postsNextPrevInfo.nextPostLink}`,
        title: postsNextPrevInfo.nextPostTitle,
        label: 'Next article',
        icon: FaArrowRight
      }
    : null;

  if (!previous && !next) return null;

  return (
    <nav
      aria-label='Article pagination'
      className='mt-12 grid gap-4 border-t border-slate-200 pt-8 dark:border-slate-500 sm:grid-cols-2'
    >
      {previous ? (
        <Link
          href={previous.href}
          className='group flex min-h-24 items-center gap-4 rounded-lg border border-slate-200 p-4 transition hover:border-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:border-slate-500 dark:hover:border-green-500'
        >
          <previous.icon aria-hidden='true' className='shrink-0 transition group-hover:-translate-x-1' />
          <span>
            <span className='block font-Monda text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300'>
              {previous.label}
            </span>
            <span className='mt-1 block font-Neuton text-lg font-semibold leading-snug'>{previous.title}</span>
          </span>
        </Link>
      ) : (
        <span aria-hidden='true' />
      )}

      {next && (
        <Link
          href={next.href}
          className='group flex min-h-24 items-center justify-end gap-4 rounded-lg border border-slate-200 p-4 text-right transition hover:border-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:border-slate-500 dark:hover:border-green-500'
        >
          <span>
            <span className='block font-Monda text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300'>
              {next.label}
            </span>
            <span className='mt-1 block font-Neuton text-lg font-semibold leading-snug'>{next.title}</span>
          </span>
          <next.icon aria-hidden='true' className='shrink-0 transition group-hover:translate-x-1' />
        </Link>
      )}
    </nav>
  );
};

export default PrevNextPosts;
