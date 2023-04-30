/* eslint-disable react/destructuring-assignment */
import React from 'react';

import { getPublishedBlogPosts, getSinglePage } from '@utils/notion';
import { PAGES_POSTS_QUERY } from '../../queries/queries';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS } from '../../utils/consts';
import PostList from '../../components/PostList';
import Pagination from '../../components/Pagination';

const totalPagesCount = (totalPostsCount) => Math.ceil(totalPostsCount / PER_PAGE_BLOGS);

const Blog = ({ data }) => {
  console.warn(data);
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };

  const totalPages = totalPagesCount(data.length ?? 0);

  return (
    <PostsLayout
      pageTitle="Articles"
      metaInfo={metaInfo}
      recentPosts={data.slice(1, 3)}
    >
      <PostList posts={data ?? []} />
      <Pagination totalPages={totalPages} postName="blog" />
    </PostsLayout>
  );
};

export async function getStaticProps() {
  const response = await getPublishedBlogPosts();
  return {
    props: {
      data: response,
    },
  };
}

export default Blog;
