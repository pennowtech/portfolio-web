import React from 'react';

import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote';
import code from './Code';
import YouTube from './YouTube';

const data = { btn_text: 'Click Me' };
const MDXComponents = {
  YouTube,
  code,
  Image,
};
const Article = ({ frontMatter, mdxSource }) => (
  <>
    {/* <p>{frontMatter.description}</p> */}
    <article
      id="post"
      refs="articleRef"
      className="prose-a:text-[#0366d6] dark:prose-a:text-blue-300 text-lg leading-8 prose-hr:my-2"
    >
      <MDXRemote {...mdxSource} components={MDXComponents} scope={data} />
    </article>
  </>
);

export default Article;
