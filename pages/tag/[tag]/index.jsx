import React from 'react';
import { getPublishedBlogPosts, getAllTagsFromPosts } from '@utils/notion';
import Pagination from '@components/Pagination';
import PostsLayout from '../../../components/PostsLayout';
import { PER_PAGE_BLOGS, RECENT_POSTS_COUNT } from '../../../utils/consts';
import PostList from '../../../components/PostList';

export default function Tag({ tags, postsToShow, currentTag, recentPosts }) {
  const metaInfo = {
    title: `${currentTag} articles | SinghBuildsTech`,
    metaKeywords: `${currentTag}, Software Architecture, Engineering`,
    metaDesc: `Browse SinghBuildsTech articles filed under ${currentTag}.`
  };

  const startIndex = 0; // index page is always zero.
  const posts = postsToShow?.slice(startIndex, startIndex + PER_PAGE_BLOGS);
  return (
    <PostsLayout pageTitle={`Articles on ${currentTag}`} metaInfo={metaInfo} tags={tags} recentPosts={recentPosts}>
      {posts && <PostList posts={posts} />}
      <Pagination totalPosts={postsToShow?.length} postName={`tag/${currentTag}`} />
    </PostsLayout>
  );
}

export async function getStaticProps({ params }) {
  const currentTag = params.tag;

  const posts = await getPublishedBlogPosts();
  const tags = await getAllTagsFromPosts(posts);
  const filteredPosts = posts.filter(
    (post) => post && post.tags && post.tags.some((tag) => tag.name.toUpperCase() === currentTag.toUpperCase())
  );

  return {
    props: {
      tags,
      postsToShow: filteredPosts,
      currentTag,
      recentPosts: posts.slice(0, RECENT_POSTS_COUNT)
    },
    revalidate: 60
  };
}

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();
  const tags = await getAllTagsFromPosts(posts);

  const paths = Object.keys(tags).map((tag) => ({ params: { tag } }));
  return {
    paths,
    fallback: 'blocking'
  };
}
