import React from 'react';

const PostTags = ({ tags }) => {
  if (tags.length === 0) { return ''; }
  return (
    <div className="my-4 flex font-Monda text-slate-500 text-sm  gap-x-4">
      {tags.slice(0, 3).map((tag, idx) => (
        <div
          key={tag + idx}
          className="bg-gray-200 dark:bg-slate-500 rounded-full px-2 py-1 md:px-4 dark:text-slate-300"
        >
          {tag.name?.slice(0, 10)}
        </div>
      ))}
    </div>
  );
};

export default PostTags;
