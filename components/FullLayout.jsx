import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { absoluteUrl } from '@utils/site';
import CommandPalette from './CommandPalette';

const defaultMeta = {
  title: 'SinghBuildsTech | Sukhdeep Singh, Technical Architect',
  metaDesc:
    'Technical Architect sharing practical work and writing on software architecture, embedded systems, distributed platforms, and engineering.',
  metaKeywords: 'Technical Architect, Software Architecture, Embedded Systems, Rust, C++, Python',
  image: '/singhbuildstech-logo.png',
  type: 'website'
};

const FullLayout = ({ metaInfo = {}, title, metaKeywords, metaDesc, children }) => {
  const router = useRouter();
  const metadata = {
    ...defaultMeta,
    ...metaInfo,
    ...(title ? { title } : {}),
    ...(metaKeywords ? { metaKeywords } : {}),
    ...(metaDesc ? { metaDesc } : {})
  };
  const path = (metadata.canonicalPath || router.asPath || '/').split(/[?#]/)[0];
  const canonicalUrl = absoluteUrl(path);
  const socialImage = absoluteUrl(metadata.image);

  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name='description' content={metadata.metaDesc} />
        {metadata.metaKeywords && <meta name='keywords' content={metadata.metaKeywords} />}
        <link rel='canonical' href={canonicalUrl} />
        <link rel='alternate' hrefLang='en' href={absoluteUrl(`/en${path === '/' ? '' : path}`)} />
        <link rel='alternate' hrefLang='de' href={absoluteUrl(`/de${path === '/' ? '' : path}`)} />
        <link rel='alternate' hrefLang='x-default' href={canonicalUrl} />
        {metadata.noIndex && <meta name='robots' content='noindex, nofollow' />}
        <meta property='og:site_name' content='SinghBuildsTech' />
        <meta property='og:type' content={metadata.type} />
        <meta property='og:title' content={metadata.title} />
        <meta property='og:description' content={metadata.metaDesc} />
        <meta property='og:url' content={canonicalUrl} />
        <meta property='og:image' content={socialImage} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={metadata.title} />
        <meta name='twitter:description' content={metadata.metaDesc} />
        <meta name='twitter:image' content={socialImage} />
      </Head>
      <div id='content' className='mx-auto flex w-full flex-grow flex-col'>
        {children}
      </div>
      <CommandPalette />
    </>
  );
};

export default FullLayout;
