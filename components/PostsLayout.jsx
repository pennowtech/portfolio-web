import React from 'react';

import Head from 'next/head';
import Image from 'next/legacy/image';
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
          <div className='relative w-full h-[120px] md:h-[180px] overflow-hidden mb-8 left-0'>
            <Image
              src='https://images.unsplash.com/photo-1681243303374-72d01f749dfa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=487&q=80'
              layout='fill'
              className='object-cover w-full bg-center opacity-93  dark:grayscale'
            />
            <div className='absolute bg-gradient-to-b from-[#32323200] to-[#100f0fed] h-full w-full' />
            <div className='absolute inset-x-0 bottom-0 text-white flex justify-center items-center '>
              <div className='container '>
                <div className='leading-4'>
                  <h1 className='mb-2 font-Neuton text-3xl md:text-5xl pl-8 text-slate-50'>{pageTitle}</h1>
                </div>
              </div>
            </div>
          </div>
        )}{' '}
        <div className='container lg:mx-auto p-4 lg:py-12 '>
          <div className='grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-8 overflow-hidden '>
            <div className='col-span-2 mb-8'>{props.children}</div>
            <Sidebar recentPosts={recentPosts} tags={tags} className='lg:ml-8 lg:-mt-8' />
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
