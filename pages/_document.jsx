/* eslint-disable max-len */
import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import Footer from '../components/Footer';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel='icon' href='/Logo.png' />
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='true' />
          <link
            href='https://fonts.googleapis.com/css2??family=Barlow:wght@500;700&family=Comic+Neue:wght@400;700&family=Inter:wght@500;700&family=Noto+Sans+JP:wght@500&family=Roboto+Slab:wght@400;700&family=Merriweather&family=Fira+Code:wght@500&family=Roboto+Condensed&family=Monda&family=Neuton:wght@700&family=Offside&family=Rajdhani:wght@300;500&family=Yantramanav:wght@400;500&family=Barlow+Condensed&display=swap'
            rel='stylesheet'
          />
          <link
            rel='stylesheet'
            href='https://use.fontawesome.com/releases/v5.15.4/css/all.css'
            integrity='sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm'
            crossOrigin='anonymous'
          />
          <Script strategy='beforeInteractive' src='/utils/persistTheme.jsx' />
        </Head>
        <body className='body max-w-[100%] shadow-sm font-RobotoSlab font-weight-500 text-lg leading-7 2xl:text-xl xl:leading-8 2xl:leading-9  dark:bg-gray-600 bg-white-100 dark:text-slate-50 dark:selection:bg-slate-300 dark:selection:text-slate-600  selection:bg-slate-800 selection:text-slate-50 prose dark:prose-invert prose-base  prose-a:no-underline prose-pre:p-0  md:prose-pre:p-0 lg:prose-pre:p-0 prose-pre:border  prose-pre:bg-inherit dark:prose-ul:marker:bg-white '>
          <Main />
          <NextScript />
          <Footer />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
