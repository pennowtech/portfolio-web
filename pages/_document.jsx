import React from 'react';
import Document, {
  Html, Head, Main, NextScript,
} from 'next/document';
import Footer from '../components/Footer';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <body className="body max-w-[100%] shadow-sm font-Merriweather text-base leading-7 2xl:text-xl xl:leading-8 2xl:leading-9  dark:bg-gray-600 bg-slate-50  dark:selection:bg-slate-300 dark:selection:text-slate-600  selection:bg-slate-800 selection:text-slate-50 prose dark:prose-invert prose-base  prose-a:no-underline prose-pre:p-0 prose-code:text-base md:prose-pre:p-0 lg:prose-pre:p-0 prose-pre:border  prose-pre:bg-inherit dark:prose-ul:marker:bg-white">
          <Main />
          <NextScript />
          <Footer />

        </body>
      </Html>
    );
  }
}

export default MyDocument;
