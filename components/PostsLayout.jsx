import React from 'react';

import Head from 'next/head';
import Image from 'next/image';
import FullLayout from '@components/FullLayout';
import Sidebar from './Sidebar';
import HeaderMain from './HeaderMain';

const PostsLayout = ({ pageTitle, metaInfo, tags, recentPosts, ...props }) => {
  const { title, metaKeywords, metaDesc } = metaInfo;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name='description' content={metaDesc} />
        <meta name='keywords' content={metaKeywords} />
      </Head>
      <FullLayout>
        <HeaderMain />
        {pageTitle && (
          <header className='relative isolate min-h-52 w-full overflow-hidden md:min-h-64'>
            <Image
              src='https://images.unsplash.com/photo-1681243303374-72d01f749dfa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=487&q=80'
              alt=''
              role='presentation'
              fill
              sizes='100vw'
              className='object-cover object-center dark:grayscale'
            />
            <div className='absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/55 to-slate-950/90' />
            <div className='relative mx-auto flex min-h-52 w-full max-w-[1180px] items-end px-4 pb-9 text-white md:min-h-64 md:px-6 md:pb-12 lg:px-8'>
              <div>
                <p className='mb-2 font-Monda text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 md:text-sm'>
                  Notes from the field
                </p>
                <h1 className='m-0 font-Neuton text-4xl font-semibold leading-tight text-white md:text-6xl'>
                  {pageTitle}
                </h1>
              </div>
            </div>
          </header>
        )}{' '}
        <div className='mx-auto w-full max-w-[1180px] px-4 py-10 md:px-6 md:py-14 lg:px-8'>
          <div className='grid min-w-0 grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-12'>
            <main className='min-w-0'>{props.children}</main>
            <Sidebar recentPosts={recentPosts} tags={tags} />
          </div>
        </div>
      </FullLayout>
    </>
  );
};

PostsLayout.defaultProps = {
  metaInfo: {
    title: 'Default Title',
    metaKeywords: 'Default metaKeywords',
    metaDesc: 'Default metaDesc'
  }
};

export default PostsLayout;
