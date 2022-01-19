import React from 'react';

import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

const FullLayout = (props) => {
  const { title, metaKeywords, metaDesc } = props.metaInfo;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={metaKeywords} />
      </Head>
      <div className="flex flex-col">
        <Header />
        <div
          id="content"
          className="flex-grow mx-auto w-full"
        >
          {props.children}
        </div>

      </div>
    </>
  );
};

FullLayout.defaultProps = {
  metaInfo: {
    title: 'Default Title',
    metaKeywords: 'Default metaKeywords',
    metaDesc: 'Default metaDesc',
  },
};

export default FullLayout;
