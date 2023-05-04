import React from 'react';
import Link from 'next/link';

import { FlatMDXData } from '../utils/FlatData';
import HorizontalCard from './Post/HorizontalCard';
import VerticalCard from './Post/VerticalCard';

/**
 * The main component.
 *
 * @visibleName The Best layout Ever 🐙
 */
export default function HomeArticles({ posts, showAsHorizontal = true }) {
  return (
    <div className='relative px-2 bg-slate-200 dark:bg-slate-400 mt-8 pb-8'>
      <div
        className='bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20 '
        style={{ transform: 'translateZ(0)' }}
      >
        <svg
          className='absolute bottom-0 overflow-hidden'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='none'
          version='1.1'
          viewBox='0 0 2560 100'
          x='0'
          y='0'
        >
          <polygon className='text-slate-200 dark:text-slate-400  fill-current' points='2560 0 2560 100 0 100' />
        </svg>
      </div>
      <h2 className='mt-4 mb-0 underline underline-offset-2 mx-auto justify-center text-center'>Articles</h2>
      <div className='container lg:mx-auto pt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8'>
        {posts.map(
          (post) =>
            (showAsHorizontal && <HorizontalCard post={post} key={post.id} />) || (
              <VerticalCard post={post} showExcerpt key={post.id} />
            )
        )}
      </div>
      <div className='grid font-Monda justify-center'>
        <div className='button focus:shadow-outline cursor-pointer'>
          <Link href='/blog' className='text-white'>
            View all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
