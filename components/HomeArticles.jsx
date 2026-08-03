import React from 'react';
import Link from 'next/link';

import HorizontalCard from './Post/HorizontalCard';
import VerticalCard from './Post/VerticalCard';
import { useLanguage } from '../utils/LanguageContext';

/**
 * The main component.
 *
 * @visibleName The Best layout Ever 🐙
 */
export default function HomeArticles({ posts, showAsHorizontal = true }) {
  const { t } = useLanguage();
  const homepagePosts = showAsHorizontal ? posts : posts.slice(0, 6);

  return (
    <section aria-labelledby='articles-title' className='relative py-14 md:py-20'>
      <div className='mx-auto w-full max-w-[1048px] px-4 lg:px-8'>
        <header className='mx-auto mb-10 max-w-2xl text-center md:mb-12'>
          <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300'>
            {t('homeArticles.subtitle', 'Notes from the field')}
          </p>
          <h2 id='articles-title' className='mb-3 font-Neuton text-4xl font-semibold leading-tight md:text-5xl'>
            {t('homeArticles.title', 'Articles')}
          </h2>
          <p className='mb-0 text-slate-600 dark:text-slate-200'>
            {t(
              'homeArticles.desc',
              'Practical writing on software architecture, engineering decisions, and lessons gathered while building real systems.'
            )}
          </p>
        </header>

        <div
          className={showAsHorizontal ? 'grid gap-8' : 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8'}
        >
          {homepagePosts.map((post, index) =>
            showAsHorizontal ? (
              <HorizontalCard post={post} key={post.id} />
            ) : (
              <VerticalCard
                post={post}
                showExcerpt
                key={post.id}
                className={index >= 4 ? 'hidden xl:flex' : index >= 3 ? 'hidden md:flex' : ''}
              />
            )
          )}
        </div>

        <div className='mt-10 flex justify-center md:mt-12'>
          <Link
            href='/page'
            className='flex min-h-11 items-center justify-center rounded-lg bg-green-700 px-6 py-3 font-Monda font-bold text-white shadow-sm transition hover:bg-green-600 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 dark:bg-green-600 dark:hover:bg-green-500 dark:focus-visible:ring-offset-gray-600'
          >
            {t('homeArticles.viewAll', 'View all articles')}
          </Link>
        </div>
      </div>
    </section>
  );
}
