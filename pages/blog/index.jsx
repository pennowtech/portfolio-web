/* eslint-disable react/destructuring-assignment */
import React from 'react';

import { PAGES_POSTS_QUERY } from '../../queries/queries';
import PostsLayout from '../../components/PostsLayout';
import { PER_PAGE_BLOGS } from '../../utils/consts';
import PostList from '../../components/PostList';
import Pagination from '../../components/Pagination';

const totalPagesCount = (totalPostsCount) => Math.ceil(totalPostsCount / PER_PAGE_BLOGS);

const Blog = (props) => {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };

  const totalPages = totalPagesCount(props?.data?.posts?.pageInfo?.offsetPagination?.total ?? 0);

  return (
    <PostsLayout pageTitle="Articles" metaInfo={metaInfo}>
      <PostList posts={props?.data?.posts?.nodes ?? []} />
      <Pagination totalPages={totalPages} postName="blog" />
    </PostsLayout>
  );
};

export async function getStaticProps() {
  const result = await gqlAuthClient(false).query(PAGES_POSTS_QUERY, {
    perPage: PER_PAGE_BLOGS,
    offset: null,
  }).toPromise();

  return {
    props: {
      data: result.data,
      urqlState: ssrCache.extractData(),
    },
    /*
     * Revalidate means that if a new request comes to server,
     *  then every 1 sec  it will check if the data is changed,
     *  if it is changed then it will update the static file
     *  inside .next folder with the new data, so that any
     * 'SUBSEQUENT' requests should have updated data.
     */
    revalidate: 1,
  };
}

export default Blog;
