import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype';
import toc from '@jsdevtools/rehype-toc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import YouTube from './YouTube';
import code from './Code';

const YTComponent = ({ children }) => <YouTube videoId={children} />;
// const YTComponent = ({ videoId }) => <ReactPlayer url={`https://www.youtube.com/embed/${videoId}`} />;

const MDXComponents = {
  youtube: YTComponent,
  code
};
const Article = ({ mdxSource }) => (
  <article id='post' className='prose-a:text-[#0366d6] dark:prose-a:text-blue-300 text-base leading-7 prose-hr:my-2'>
    <ReactMarkdown
      rehypePlugins={[
        rehypeRaw,
        rehypeSlug,
        rehypeAutolinkHeadings,
        toc,
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
