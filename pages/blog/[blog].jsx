import React from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';

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
import { DUMMY_ARTICLE, DUMMY_ARTICLE_SLUG } from '@utils/dummyArticle';

/* import for this particular component should be done in following
 way. otherwise you'll get:
 Must use import to load ES Module: ...\mdast-util-from-markdown\index.js require()
 of ES modules is not supported
*/
const ToC = dynamic(() => import('@components/ToC'), {
  ssr: false
});

const PostPage = ({ postMeta, markdown, compiledMDSource }) => {
  const metaInfo = {
    title: postMeta.title,
    metaKeywords: postMeta.tags?.map((tag) => tag.name) ?? [],
    metaDesc: postMeta.description
  };

  return (
    <FullLayout metaInfo={metaInfo}>
      <HeaderMain />
      <BlogTitleBar postMeta={postMeta} />

      <main className='mx-auto grid w-full max-w-[1180px] min-w-0 gap-8 px-4 py-8 md:px-6 md:py-12 xl:grid-cols-[minmax(0,46rem)_17rem] xl:gap-12 xl:px-8'>
        <div className='min-w-0'>
          <Article mdxSource={compiledMDSource} />
          <PrevNextPosts postsNextPrevInfo={postMeta.infoPrevNextPost} />
        </div>
        <aside className='order-first min-w-0 xl:order-last'>
          <ToC content={markdown} />
        </aside>
      </main>
    </FullLayout>
  );
};

export const getStaticProps = async (context) => {
  const { blog } = context.params;

  // TODO(dummy-content): Remove this branch with the local Markdown fixture.
  if (blog === DUMMY_ARTICLE_SLUG) {
    const markdown = await fs.readFile(path.join(process.cwd(), 'posts', `${DUMMY_ARTICLE_SLUG}.md`), 'utf8');

    return {
      props: {
        markdown,
        postMeta: DUMMY_ARTICLE,
        compiledMDSource: markdown
      }
    };
  }

  const post = await getSingleBlogPost(blog);

  const options = {
    mdxOptions: {
      // remarkPlugins: [remarkToc],
      remarkPlugins: [emoji],
      rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'before' }]]
    }
  };
  // const compiledMDSource = await serialize(post.markdown, options);
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

  // TODO(dummy-content): Remove this path with the local Markdown fixture.
  paths.push({ params: { blog: DUMMY_ARTICLE_SLUG } });
  return {
    paths,
    fallback: false
  };
}

export default PostPage;
