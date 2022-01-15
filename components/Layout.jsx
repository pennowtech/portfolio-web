import React from 'react';

import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

const Layout = (props) => {
  const { title, metaKeywords, metaDesc } = props.metaInfo;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={metaKeywords} />
        <link href="/static/styles.css" rel="stylesheet" key="mainstyle" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div
          id="content"
          className="flex-grow mx-auto w-full"
        >
          {props.children}
        </div>

        <Footer />
      </div>
    </>
  );
};

Layout.defaultProps = {
  metaInfo: {
    title: 'Default Title',
    metaKeywords: 'Default metaKeywords',
    metaDesc: 'Default metaDesc',
  },
};

export default Layout;
