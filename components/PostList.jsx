import React from 'react';

import Post from './Post';

const PostList = ({ posts }) => (
  <>
    {posts.map((post, index) => (
      <article key={post.id} className="col-span-2 overflow-hidden mb-8">
        <Post post={post} />
      </article>
    ))}
  </>
);
export default PostList;
