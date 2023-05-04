/* eslint-disable react/no-multi-comp */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import YouTube from './YouTube';
import code from './Code';

const YTComponent = ({ children }) => <YouTube videoId={children} />;
// const YTComponent = ({ videoId }) => <ReactPlayer url={`https://www.youtube.com/embed/${videoId}`} />;

const BlockquoteComponent = ({ children }) => (
  <blockquote className='px-2 border-emerald-700 bg-emerald-50 text-emerald-700 rounded-r-md dark:bg-emerald-700 dark:text-emerald-50'>
    {children}
  </blockquote>
);

const OrangeComponent = ({ children }) => (
  <span className='px-1 bg-orange-100 rounded-sm dark:bg-orange-600 text-orange-700 dark:text-orange-50 '>
    {children}
  </span>
);

const NoteComponent = ({ heading, children }) => (
  <span className='overflow-hidden leading-normal rounded-lg bg-orange-50 dark:bg-orange-500 text-orange-700 dark:text-orange-50 '>
    <span className='m-0 px-4 py-2 block rounded-t-lg font-bold text-orange-50 bg-orange-700'>📣 {heading}</span>
    <span className='m-0 px-4 py-2 block rounded-b-lg  text-orange-700 bg-orange-50 '>{children}</span>
  </span>
);

const MDXComponents = {
  youtube: YTComponent,
  blockquote: BlockquoteComponent,
  highlight: OrangeComponent,
  note: NoteComponent,
  code
};
const Article = ({ mdxSource }) => (
  <article id='post' className='prose-a:text-[#0366d6] dark:prose-a:text-blue-300 text-base leading-7 prose-hr:my-2'>
    <ReactMarkdown
      rehypePlugins={[
        rehypeRaw,
        rehypeSlug,
        rehypeAutolinkHeadings,
        [remarkRehype, { allowDangerousHtml: true }],
        [rehypeStringify, { allowDangerousHtml: true }]
      ]}
      components={MDXComponents}
    >
      {mdxSource}
    </ReactMarkdown>
  </article>
);

export default Article;
