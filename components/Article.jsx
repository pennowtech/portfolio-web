import React from 'react';

import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote';

import Button from './Button';
import code from './Code';

const data = { btn_text: 'Click Me' };

const Article = ({ frontMatter, mdxSource }) => (
  <>
    {/* <p>{frontMatter.description}</p> */}
    <article id="post" refs="articleRef">
      <MDXRemote
        {...mdxSource}
        components={{
          // <h2 className="text-5xl" {...props} />,
          Button,
          code,
          Image,
        }}
        scope={data}
      />
    </article>
  </>
);

export default Article;
