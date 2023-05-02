import React from 'react';

import Head from 'next/head';

const FullLayout = ({
  title, metaKeywords, metaDesc, ...props
}) => (
  <>
    <Head>
      <title>{title}</title>
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />
    </Head>
    <div className="flex flex-col">
      <div
        id="content"
        className="flex-grow mx-auto w-full"
      >
        {props.children}
      </div>

    </div>
  </>
);

FullLayout.defaultProps = {
  metaInfo: {
    title: 'Default Title',
    metaKeywords: 'Default metaKeywords',
    metaDesc: 'Default metaDesc',
  },
};

export default FullLayout;
