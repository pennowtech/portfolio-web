import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel='icon' href='/favicon.png' type='image/png' />
          <link rel='apple-touch-icon' href='/singhbuildstech-logo.png' />
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
          <link
            href='https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap'
            rel='stylesheet'
          />
          <meta name='theme-color' content='#1e293b' />
          <Script strategy='beforeInteractive' src='/persist-theme.js' />
        </Head>
        <body className='body max-w-full bg-white font-RobotoSlab text-lg font-normal leading-7 text-slate-900 shadow-sm selection:bg-slate-800 selection:text-slate-50 dark:bg-gray-600 dark:text-slate-50 dark:selection:bg-slate-300 dark:selection:text-slate-600 xl:leading-8 2xl:text-xl 2xl:leading-9'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
