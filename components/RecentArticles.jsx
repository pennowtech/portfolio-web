import React from 'react';
import Link from 'next/link';
import { useQuery } from 'urql';
import { FIRST_FIVE_POSTS } from '../queries/queries';
import PostDate from './Post/PostDate';

const RecentArticles = () => {
  const [result, getPosts] = useQuery({ query: FIRST_FIVE_POSTS });
  const { data, fetching, error } = result;
  if (fetching) return <div>Fetching</div>;
  if (error) return <div>{error}</div>;

  const posts = data?.posts?.nodes || [];
  posts.sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified));
  console.warn(1234, 'Fetching All Posts data...', posts);

  return (
    <div className="font-medium mx-auto px-2 py-1 md:px-4 whitespace-nowrap overflow-hidden">
      <h4 className="border-b-2">Recent Articles</h4>
      { posts.map((post) => (
        <div key={post.id} className="text-base py-2">
          <Link href={`/blog/${post.slug}`}>
            <a>
              {post.title}
            </a>
          </Link>
          <PostDate date={post.modified} readingTime={post.readingTime} />
        </div>
      )) }
    </div>
  );
};

export default RecentArticles;
