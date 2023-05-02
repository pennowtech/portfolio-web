import React from 'react';
import emoji from 'remark-emoji';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import { getPublishedBlogPosts, getSingleBlogPost } from '@utils/notion';
import dynamic from 'next/dynamic';
import HeaderMain from '@components/HeaderMain';
import PrevNextPosts from '@components/Post/PrevNextPosts';
import BlogTitleBar from '@components/BlogTitleBar';
import Article from '@components/Article';
import FullLayout from '@components/FullLayout';

/* import for this particular component should be done in following
 way. otherwise you'll get:
 Must use import to load ES Module: ...\mdast-util-from-markdown\index.js require()
 of ES modules is not supported
*/
const ToC = dynamic(() => import('@components/ToC'), {
  ssr: false
});

const PostPage = ({ postMeta, markdown, compiledMDSource }) => {
  // TODO: ToC content to fix.
  const content = '';

  const metaInfo = {
    title: postMeta.title,
    metaKeywords: postMeta.tags.map((tag) => tag.name),
    metaDesc: postMeta.description
  };

  // TODO: prev next post fix.
  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      <BlogTitleBar postMeta={postMeta} />

      <div className='w-full lg:max-w-[1048px] lg:mx-auto flex flex-col wide:flex-row flex-grow overflow-hidden  '>
        <div className='w-full h-full flex-grow p-3 overflow-auto'>
          <Article mdxSource={compiledMDSource} />
          <PrevNextPosts postsNextPrevInfo={postMeta.infoPrevNextPost} />
        </div>
        <div className='sidebar font-Yantramanav  text-sm leading-6 wide:min-w-[30%] max-w-[400px] flex-shrink flex-grow-0 mx-auto p-4'>
          <ToC content={markdown} />
        </div>
      </div>
    </FullLayout>
  );
};

export const getStaticProps = async (context) => {
  const { blog } = context.params;

  const post = await getSingleBlogPost(blog);

  const options = {
    mdxOptions: {
      // remarkPlugins: [remarkToc],
      remarkPlugins: [emoji],
      rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'before' }]]
    }
  };
  //const compiledMDSource = await serialize(post.markdown, options);
  const compiledMDSource = post.markdown;

  return {
    props: {
      markdown: post.markdown,
      postMeta: post.postMeta,
      compiledMDSource
    }
  };
};

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();

  // Because we are generating static paths, you will have to redeploy your site whenever
  // you make a change in Notion.
  const paths = posts.map((post) => ({
    params: {
      blog: post.slug
    }
  }));
  return {
    paths,
    fallback: false
  };
}

export default PostPage;
