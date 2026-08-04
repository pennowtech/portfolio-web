import React from 'react';

import Image from 'next/image';
import FullLayout from '@components/FullLayout';
import Sidebar from './Sidebar';
import HeaderMain from './HeaderMain';

const PostsLayout = ({ pageTitle, metaInfo, tags, recentPosts, ...props }) => {
  const hasSidebar = Boolean(recentPosts?.length || (tags && Object.keys(tags).length));

  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      {pageTitle && (
        <header className='relative isolate min-h-[18rem] w-full overflow-hidden bg-slate-900 text-white md:min-h-[22rem] border-b border-slate-800 shadow-xl'>
          {/* Ambient glow */}
          <div className='absolute -top-32 left-1/3 -z-10 h-96 w-96 rounded-full bg-orange-500/15 blur-[120px]' />
          <div className='absolute -bottom-32 right-1/4 -z-10 h-96 w-96 rounded-full bg-green-500/15 blur-[120px]' />

          <div className='relative mx-auto flex min-h-[18rem] w-full max-w-7xl flex-col justify-end px-4 pb-10 text-white md:min-h-[22rem] md:px-6 md:pb-12 lg:px-8'>
            <div>
              <p className='mb-2 font-Monda text-xs font-bold uppercase tracking-[0.2em] text-orange-400'>
                Notes & Field Engineering
              </p>
              <h1 className='m-0 font-Neuton text-4xl font-semibold leading-tight text-white md:text-6xl'>
                {pageTitle}
              </h1>
              <p className='mt-3 max-w-2xl text-base text-slate-300 md:text-lg'>
                Explorations in system design, embedded hardware, distributed platforms, and real-world engineering
                decisions.
              </p>
            </div>
          </div>
        </header>
      )}
      <div className='mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8'>
        <div
          className={`grid min-w-0 grid-cols-1 gap-10 ${
            hasSidebar ? 'lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12' : ''
          }`}
        >
          <main className='min-w-0'>{props.children}</main>
          {hasSidebar && <Sidebar recentPosts={recentPosts} tags={tags} />}
        </div>
      </div>
    </FullLayout>
  );
};

export default PostsLayout;
