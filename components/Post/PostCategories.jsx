import React from 'react';

// Only one category is supported
const PostCategories = ({ categories, variant = 'default' }) => {
  if (!categories?.name) return null;

  if (variant === 'card') {
    return (
      <span className='absolute left-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 font-Monda text-xs font-semibold text-white backdrop-blur-sm'>
        {categories.name}
      </span>
    );
  }

  return (
    <div
      key={categories?.id}
      className='absolute inset-x-0 top-0 flex py-2.5 font-Comic text-xs font-bold leading-4 text-white'
    >
      <div className='m-4 rounded-full bg-red-500 px-2 py-1 font-medium shadow-xl md:px-4'>{categories.name}</div>
    </div>
  );
};
export default PostCategories;
