/* eslint-disable react/destructuring-assignment */
import React from 'react';
import gql from 'graphql-tag';
import { withUrqlClient } from 'next-urql';
import { defaultExchanges, useQuery } from 'urql';
import { devtoolsExchange } from '@urql/devtools';
import { GET_TOTAL_POSTS_COUNT, PAGES_POSTS_QUERY } from 'queries/queries';
import { getPageOffset } from '../../../components/Pagination/PaginationUtils';
import { gqlAuthClient, gqlClient, ssrCache } from '../../../utils/gqlclient';
import PostsLayout from '../../../components/PostsLayout';
import { GRAPHQL_URL, PER_PAGE_BLOGS } from '../../../utils/consts';
import Posts from '../../../components/PostList';
import Pagination from '../../../components/Pagination';

const Blog = (props) => {
  const metaInfo = {
    title: 'Writing down my learnings',
    metaKeywords: 'Reactjs, C++, cpp, Python, Data Science, Database',
    metaDesc: '',
  };

  const totalPosts = props?.data?.posts?.pageInfo?.offsetPagination?.total ?? 0;
  const totalPages = Math.ceil(totalPosts / PER_PAGE_BLOGS);

  return (
    <PostsLayout pageTitle="Articles" metaInfo={metaInfo}>
      <Posts posts={props?.data?.posts?.nodes ?? []} />
      <Pagination totalPages={totalPages} postName="blog" />
    </PostsLayout>
  );
};

export async function getStaticPaths() {
  const result = await gqlAuthClient(false).query(GET_TOTAL_POSTS_COUNT).toPromise();
  const totalPosts = result?.data?.postsCount?.pageInfo?.offsetPagination?.total ?? 0;
  const totalPages = Math.ceil(totalPosts / PER_PAGE_BLOGS);
  console.warn('Fetching All Posts data...', totalPosts);

  const paths = [];

  for (let page = 1; page <= totalPages; page += 1) {
    paths.push({ params: { page: page.toString() } });
  }

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const s = await gqlAuthClient(false).query(PAGES_POSTS_QUERY, {
    perPage: PER_PAGE_BLOGS,
    offset: getPageOffset(params.page),
  }).toPromise();
  console.warn('Fetching All Posts data...', s.data);
  return {
    props: {
      data: s.data,
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
