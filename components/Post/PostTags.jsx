import React from 'react';

const PostTags = ({ tags, limitedTags = true }) => {
  if (tags?.length === 0) {
    return '';
  }
  const newTags = limitedTags ? tags?.slice(0, 3) : tags;
  return (
    <div className='my-2 flex flex-wrap font-semibold font-Comic text-slate-500 text-sm  gap-x-4'>
      {newTags?.map((tag) => (
        <div
          key={tag.name}
          className=' bg-gray-200 dark:bg-slate-500 rounded-full px-2 py-1 my-1 md:px-2 text-center dark:text-slate-300 overflow-hidden'
        >
          {tag.name?.slice(0, 15)}
        </div>
      ))}
    </div>
  );
};

export default PostTags;
