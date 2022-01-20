import React from 'react';

import Head from 'next/head';
import Sidebar from './Sidebar';
import HeaderMain from './HeaderMain';

const PostsLayout = ({ pageTitle = 'Title', metaInfo, ...props }) => {
  const { title, metaKeywords, metaDesc } = metaInfo;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={metaKeywords} />
      </Head>
      <div className="flex flex-col">
        <HeaderMain />
        <div id="content" className="flex-grow mx-auto w-full">
          <div className="w-full lg:max-w-[1167px] lg:mx-auto p-4 lg:py-12 ">
            <h1 className="mt-8">{pageTitle}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-8 overflow-hidden ">
              <div className="col-span-2 mb-8">
                {props.children}
              </div>
              <Sidebar />
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

PostsLayout.defaultProps = {
  metaInfo: {
    title: 'Default Title',
    metaKeywords: 'Default metaKeywords',
    metaDesc: 'Default metaDesc',
  },
};

export default PostsLayout;
