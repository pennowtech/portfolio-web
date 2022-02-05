import React from 'react';

import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote';

import code from './Code';

const data = { btn_text: 'Click Me' };

const Article = ({ frontMatter, mdxSource }) => (
  <>
    {/* <p>{frontMatter.description}</p> */}
    <article id="post" refs="articleRef" className="prose-a:text-[#0366d6] dark:prose-a:text-blue-300">
      <MDXRemote
        {...mdxSource}
        components={{
          // <h2 className="text-5xl" {...props} />,
          code,
          Image,
        }}
        scope={data}
      />
    </article>
  </>
);

export default Article;
