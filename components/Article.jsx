import React from 'react';
import ReactMarkdown from 'react-markdown';
import code from './Code';
import YouTube from './YouTube';
import ReactPlayer from 'react-player';
import rehypeRaw from 'rehype-raw';
import remarkAttr from 'remark-attr';
import rehypeStringify from 'rehype-stringify';

const YTComponent = ({ children }) => <YouTube videoId={children} />;
// const YTComponent = ({ videoId }) => <ReactPlayer url={`https://www.youtube.com/embed/${videoId}`} />;


const MDXComponents = {
  youtube: YTComponent,
  code
};
const Article = ({ mdxSource }) => {
  return (
    <article id='post' className='prose-a:text-[#0366d6] dark:prose-a:text-blue-300 text-base leading-7 prose-hr:my-2'>
      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeStringify]}  components={MDXComponents}>
        {mdxSource}
      </ReactMarkdown>
    </article>
  );
}

export default Article;
