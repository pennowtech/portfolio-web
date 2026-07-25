import React from 'react';
import { BiCalendar, BiDotsVerticalRounded, BiTimer, BiUserCircle } from 'react-icons/bi';
import { DateForDateTime, DateForDisplay } from '../../utils/date';

const PostDate = ({ date, readingTime, author, variant = 'default' }) => {
  if (date === undefined) {
    return '';
  }

  if (variant === 'card') {
    return (
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 font-Monda text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300'>
        <span className='flex items-center gap-1.5'>
          <BiCalendar aria-hidden='true' className='text-base' />
          <time dateTime={DateForDateTime(date)}>{DateForDisplay(date)}</time>
        </span>
        {readingTime && (
          <span className='flex items-center gap-1.5'>
            <BiTimer aria-hidden='true' className='text-base' />
            {`${Math.ceil(readingTime)} min read`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className='m-0 overflow-hidden text-muted text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase flex h-full items-center'>
      {author && (
        <div className='inline-block'>
          <div className='flex h-full items-center'>
            <BiUserCircle className='text-base mr-2' />
            {author}
            <BiDotsVerticalRounded className='mx-2 md:mx-4 inline-block' />
          </div>
        </div>
      )}
      <div className='inline-block'>
        <div className='flex h-full items-center'>
          <BiCalendar className='text-base mr-2' />
          <time dateTime={DateForDateTime(date)}>{DateForDisplay(date)}</time>
        </div>
      </div>
      {readingTime && (
        <div className='inline-block'>
          <div className='flex h-full items-center'>
            <BiDotsVerticalRounded className='mx-2 md:mx-4 inline-block' />
            <BiTimer className='text-base mr-2' />
            {`${readingTime} min read`}
          </div>
        </div>
      )}
    </div>
  );
};
export default PostDate;
