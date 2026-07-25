import React from 'react';
import Link from 'next/link';
import PostsLayout from '../components/PostsLayout';

const Error404 = () => {
  const metaInfo = {
    title: 'Page not found | ArchitectAtWork',
    metaDesc: 'The requested ArchitectAtWork portfolio page could not be found.',
    metaKeywords: ''
  };

  return (
    <PostsLayout metaInfo={metaInfo}>
      <section className='mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center'>
        <p className='mb-2 font-Monda text-sm font-bold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-400'>
          Error 404
        </p>
        <h1 className='mb-4 font-Neuton text-5xl font-semibold leading-tight md:text-7xl'>This page has moved on.</h1>
        <p className='mb-8 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-200 md:text-lg'>
          The address may be outdated, or the page may no longer exist. The portfolio and articles are still available
          from the homepage.
        </p>
        <Link
          href='/'
          className='inline-flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 py-3 font-Monda font-bold text-white transition hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 dark:bg-green-600 dark:hover:bg-green-500 dark:focus-visible:ring-offset-gray-600'
        >
          Return home
        </Link>
      </section>
    </PostsLayout>
  );
};

export default Error404;
