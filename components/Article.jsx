import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import YouTube from './YouTube';
import code from './Code';

const YTComponent = ({ children }) => <YouTube videoId={children} />;

const BlockquoteComponent = ({ children }) => (
  <blockquote className='my-8 rounded-r-lg border-l-4 border-green-700 bg-green-50 px-5 py-3 text-slate-700 dark:border-green-500 dark:bg-green-950/30 dark:text-slate-100'>
    {children}
  </blockquote>
);

const OrangeComponent = ({ children }) => (
  <span className='rounded-sm bg-orange-100 px-1 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'>
    {children}
  </span>
);

const NoteComponent = ({ heading, children }) => (
  <aside className='my-8 overflow-hidden rounded-lg border border-orange-300 dark:border-orange-700'>
    <strong className='block bg-orange-700 px-4 py-2 text-orange-50'>📣 {heading}</strong>
    <span className='block bg-orange-50 px-4 py-3 text-orange-900 dark:bg-orange-950/30 dark:text-orange-100'>
      {children}
    </span>
  </aside>
);

const TableComponent = ({ children }) => (
  <div className='my-8 max-w-full overflow-x-auto'>
    <table>{children}</table>
  </div>
);

const ImageComponent = ({ node, ...props }) => (
  // Markdown can contain external and content-managed images, so a native responsive image is intentional here.
  // eslint-disable-next-line @next/next/no-img-element
  <img {...props} className='h-auto max-w-full rounded-lg' alt={props.alt || ''} loading='lazy' />
);

const MDXComponents = {
  youtube: YTComponent,
  blockquote: BlockquoteComponent,
  highlight: OrangeComponent,
  note: NoteComponent,
  table: TableComponent,
  img: ImageComponent,
  code
};

const Article = ({ mdxSource }) => (
  <article
    id='post'
    className='prose prose-slate max-w-none text-base leading-8 dark:prose-invert md:text-lg
      prose-headings:scroll-mt-24 prose-headings:font-Neuton prose-headings:font-semibold prose-headings:leading-tight
      prose-h2:mb-4 prose-h2:mt-12 prose-h2:text-3xl md:prose-h2:text-4xl
      prose-h3:mb-3 prose-h3:mt-9 prose-h3:text-2xl
      prose-p:my-5 prose-p:leading-8
      prose-a:font-medium prose-a:text-green-700 prose-a:underline prose-a:decoration-green-700/30 prose-a:underline-offset-4
      hover:prose-a:decoration-green-700 dark:prose-a:text-green-400
      prose-li:my-1.5 prose-li:leading-8 prose-hr:my-10
      prose-pre:my-8 prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:p-0
      prose-code:break-words prose-code:text-[0.9em]
      prose-th:whitespace-nowrap prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3'
  >
    <ReactMarkdown
      rehypePlugins={[rehypeRaw, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
      components={MDXComponents}
    >
      {mdxSource}
    </ReactMarkdown>
  </article>
);

export default Article;
