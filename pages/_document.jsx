import React from 'react';
import Document, {
  Html, Head, Main, NextScript,
} from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <body className="w-full dark:bg-gray-600 max-w-[100%] dark:selection:bg-slate-300  prose dark:prose-invert prose-base prose-a:text-[#f97316] dark:prose-a:text-[#ec4899] hover:prose-a:text-blue-600 prose-a:no-underline prose-pre:p-0 prose-code:text-base md:prose-pre:p-0 lg:prose-pre:p-0 prose-pre:border  prose-pre:bg-inherit dark:prose-ul:marker:bg-white">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
