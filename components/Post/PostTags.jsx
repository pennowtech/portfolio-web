import React from 'react';
import Link from 'next/link';

const PostTags = ({ tags, limitedTags = true, variant = 'default' }) => {
  if (tags?.length === 0) {
    return '';
  }
  const newTags = limitedTags ? tags?.slice(0, 3) : tags;
  const cardStyles =
    'rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium leading-none text-slate-600 transition hover:border-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:border-slate-500 dark:text-slate-300 dark:hover:border-slate-300 dark:hover:text-white';

  return (
    <div
      className={
        variant === 'card'
          ? 'mt-3 flex flex-wrap gap-2 font-Monda'
          : 'my-2 flex flex-wrap gap-x-4 font-Comic text-sm font-semibold text-slate-500'
      }
    >
      {newTags?.map((tag) => (
        <Link
          href={`/tag/${tag.name}`}
          key={tag.name}
          className={
            variant === 'card'
              ? cardStyles
              : 'my-1 overflow-hidden rounded-full bg-gray-200 px-2 py-1 text-center dark:bg-slate-500 dark:text-slate-300 md:px-2'
          }
        >
          {tag.name?.slice(0, 15)}
        </Link>
      ))}
    </div>
  );
};

export default PostTags;
