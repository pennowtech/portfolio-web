import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel='icon' href='/architect-at-work-mark.svg' type='image/svg+xml' />
          <meta name='theme-color' content='#1e293b' />
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='true' />
          <link
            href='https://fonts.googleapis.com/css2?family=Barlow:wght@500;700&family=Comic+Neue:wght@400;700&family=Inter:wght@500;700&family=Noto+Sans+JP:wght@500&family=Gentium+Plus:wght@400;700&family=Roboto+Slab:wght@400;700&family=Merriweather&family=Fira+Code:wght@500&family=Roboto+Condensed&family=Monda&family=Neuton:wght@700&family=Offside&family=Rajdhani:wght@300;500&family=Yantramanav:wght@400;500&family=Barlow+Condensed&display=swap'
            rel='stylesheet'
          />
          <link
            rel='stylesheet'
            href='https://use.fontawesome.com/releases/v5.15.4/css/all.css'
            integrity='sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm'
            crossOrigin='anonymous'
          />
          <Script strategy='beforeInteractive' src='/persist-theme.js' />
        </Head>
        <body className='body max-w-full bg-white font-RobotoSlab text-lg font-medium leading-7 text-slate-900 shadow-sm selection:bg-slate-800 selection:text-slate-50 dark:bg-gray-600 dark:text-slate-50 dark:selection:bg-slate-300 dark:selection:text-slate-600 xl:leading-8 2xl:text-xl 2xl:leading-9'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
