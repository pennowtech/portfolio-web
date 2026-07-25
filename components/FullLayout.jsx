import React from 'react';
import Head from 'next/head';

const defaultMeta = {
  title: 'ArchitectAtWork | Sukhdeep Singh, Technical Architect',
  metaDesc:
    'Technical Architect sharing practical work and writing on software architecture, embedded systems, distributed platforms, and engineering.',
  metaKeywords: 'Technical Architect, Software Architecture, Embedded Systems, Rust, C++, Python'
};

const FullLayout = ({ metaInfo = {}, title, metaKeywords, metaDesc, children }) => {
  const metadata = {
    ...defaultMeta,
    ...metaInfo,
    ...(title ? { title } : {}),
    ...(metaKeywords ? { metaKeywords } : {}),
    ...(metaDesc ? { metaDesc } : {})
  };

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name='description' content={metadata.metaDesc} />
        {metadata.metaKeywords && <meta name='keywords' content={metadata.metaKeywords} />}
      </Head>
      <div id='content' className='mx-auto flex w-full flex-grow flex-col'>
        {children}
      </div>
    </>
  );
};

export default FullLayout;
