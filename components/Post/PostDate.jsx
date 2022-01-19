import React from 'react';
import {
  BiDotsVerticalRounded, BiTimer, BiUserCircle, BiCalendar,
} from 'react-icons/bi';
import { BsCalendar3 } from 'react-icons/bs';
import { FiUser } from 'react-icons/fi';
import { DateForDateTime, DateForDisplay } from '../../utils/date';

const PostDate = ({ date, readingTime, author }) => (
  <div className="m-0 overflow-hidden text-muted text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase font-Monda">
    {author
      && (
      <div className="inline-block">
        <div className="flex">
          <BiUserCircle className="text-base mr-2" />
          {author}
          <BiDotsVerticalRounded className="mx-2 md:mx-4 inline-block" />
        </div>
      </div>
      )}
    <div className="inline-block">
      <div className="flex">
        <BiCalendar className="text-base mr-2" />
        <time dateTime={DateForDateTime(date)}>
          {DateForDisplay(date)}
        </time>
      </div>
    </div>
    {readingTime && (
    <div className="inline-block">
      <div className="flex">
        <BiDotsVerticalRounded className="mx-2 md:mx-4 inline-block" />
        <BiTimer className="text-base mr-2" />
        {`${readingTime} min read`}
      </div>
    </div>
    )}
  </div>
);

export default PostDate;
