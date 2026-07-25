import React from 'react';

import VerticalCard from './Post/VerticalCard';

const PostList = ({ posts }) => (
  <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:gap-8'>
    {posts.map((post) => (
      <VerticalCard key={post.id} post={post} showExcerpt />
    ))}
  </div>
);
export default PostList;
