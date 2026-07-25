import React from 'react';

import { getPublishedBlogPosts } from '@utils/notion';
import Pagination from '@components/Pagination';
import { DUMMY_ARTICLE } from '@utils/dummyArticle';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../utils/consts';
import PostList from '../../components/PostList';

const Index = ({ postsToShow, recentPosts, totalPosts }) => {
  const metaInfo = {
    title: 'Software Architecture and Engineering Articles | ArchitectAtWork',
    metaKeywords: 'Software Architecture, Embedded Systems, Rust, C++, Python, Distributed Systems',
    metaDesc:
      'Practical articles on software architecture, embedded systems, distributed platforms, programming, and engineering decisions.'
  };

  return (
    <PostsLayout pageTitle='Articles' metaInfo={metaInfo} recentPosts={recentPosts}>
      {postsToShow && <PostList posts={postsToShow} />}
      <Pagination totalPosts={totalPosts} postName='page' />
    </PostsLayout>
  );
};
export const getStaticProps = async ({ params }) => {
  const pageNumber = params.page; // Get Current Page No.

  const notionPosts = await getPublishedBlogPosts();
  // TODO(dummy-content): Keep pagination consistent with the first article page.
  const posts = [{ ...DUMMY_ARTICLE, thumbnailUrl: `/${DUMMY_ARTICLE.thumbnailUrl}` }, ...notionPosts];
  // const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  // const data = await res.json();

  const startIndex = (pageNumber - 1) * PER_PAGE_BLOGS;
  const postsToShow = posts?.slice(startIndex, startIndex + PER_PAGE_BLOGS);
  const totalPosts = posts.length;

  return {
    props: {
      postsToShow,
      totalPosts,
      recentPosts: posts.slice(0, RECENT_POSTS_COUNT)
    }
  };
};

export async function getStaticPaths() {
  const notionPosts = await getPublishedBlogPosts();
  // TODO(dummy-content): Count the local fixture while generating pagination routes.
  const posts = [DUMMY_ARTICLE, ...notionPosts];

  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / PER_PAGE_BLOGS);

  return {
    // remove first page, we 're not gonna handle that.
    paths: Array.from({ length: totalPages - 1 }, (_, i) => ({
      params: { page: `${i + 2}` }
    })),
    fallback: false
  };
}

export default Index;
