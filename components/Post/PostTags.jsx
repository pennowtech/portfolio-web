import React from 'react';

const PostTags = ({ tags, limitedTags = true }) => {
  if (tags.length === 0) { return ''; }
  const newTags = limitedTags ? tags.slice(0, 3) : tags;
  return (
    <div className="my-4 flex flex-wrap font-Monda text-slate-500 text-sm  gap-x-4">
      {newTags.map((tag, idx) => (
        <div
          key={tag.name}
          className="mb-4 bg-gray-200 dark:bg-slate-500 rounded-full px-2 py-1 md:px-4 text-center dark:text-slate-300 overflow-hidden"
        >
          {tag.name?.slice(0, 10)}
        </div>
      ))}
    </div>
  );
};

export default PostTags;
