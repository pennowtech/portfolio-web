import React from 'react';

import { serialize } from 'next-mdx-remote/serialize';
import readingTime from 'reading-time';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import dynamic from 'next/dynamic';
import BlogTitleBar from '../../components/BlogTitleBar';
import Article from '../../components/Article';
import FullLayout from '../../components/FullLayout';
// import ToC from "../../components/ToC";

export const getStaticPaths = async () => {
  const files = fs.readdirSync(path.join('posts'));
  const paths = files.map((filename) => ({
    params: {
      blog: filename.replace('.mdx', ''),
    },
  }));
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async ({ params: { blog } }) => {
  const markdownWithMeta = fs.readFileSync(
    path.join('posts', `${blog}.mdx`),
    'utf-8',
  );

  const { data: frontMatter, content } = matter(markdownWithMeta);

  const options = {
    mdxOptions: {
      // remarkPlugins: [remarkToc],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'before' }],
        // [
        //   rehypeAutolinkHeadings,
        //   {
        //     properties: {
        //       className: ["pr-4"],
        //     },
        //   },
        // ],
      ],
    },
  };

  const mdxSource = await serialize(content, options);
  // console.log(mdxSource)
  //   const source = `---
  // title: Test
  // --------

  // Some **mdx** text, with a component <Button text={year}/>
  //   `;

  //   const { content } = matter(source);
  //   const mdxSource = await serialize(content, { scope: data });

  return {
    props: {
      frontMatter: {
        readingTime: readingTime(content),
        ...frontMatter,
      },
      mdxSource,
      content,
    },
  };
};
// import for this particular component should be done in foolowing way. otherwise
// you'll get: Must use import to load ES Module: ...\mdast-util-from-markdown\index.js require() of ES modules is not supported
const ToC = dynamic(() => import('../../components/ToC'), {
  ssr: false,
});
const PostPage = ({ frontMatter, mdxSource, content }) => {
  const metaInfo = {
    title: frontMatter.title,
    metaKeywords: frontMatter.tags.join(','),
    metaDesc: frontMatter.description,
  };
  return (
    <FullLayout metaInfo={metaInfo}>
      <BlogTitleBar frontMatter={frontMatter} />

      <div className="w-full lg:max-w-[1167px] lg:mx-auto flex flex-col wide:flex-row flex-grow overflow-hidden  ">
        <div className="w-full h-full flex-grow p-3 overflow-auto">
          <Article frontMatter={frontMatter} mdxSource={mdxSource} />
        </div>
        <div className="sidebar font-Roboto wide:min-w-[30%] max-w-[400px] flex-shrink flex-grow-0 mx-auto p-4">
          <ToC content={content} className="" />
        </div>
      </div>
    </FullLayout>
  );
};
export default PostPage;
