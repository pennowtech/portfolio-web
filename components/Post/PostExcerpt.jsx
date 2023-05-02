import React from 'react';
import Link from 'next/link';
import { FaCaretRight } from 'react-icons/fa';

const PostExcerpt = ({
  blogUrl, excerpt, length, className, showReadNow = true,
}) => {
  if (!excerpt) { return ''; }
  let trimmedExcerpt = excerpt;
  if (excerpt.length > length) { trimmedExcerpt = `${excerpt.substring(0, length)}...`; }

  return (
    <div className={`${className}`}>
      {trimmedExcerpt}
      <div className="prose-a:text-[#f97316] dark:prose-a:text-pink-400 font-bold inline-block cursor-pointer">
        {showReadNow && (
        <>
          <FaCaretRight className="inline-block mr-1" />
          <Link href={blogUrl}>
            Read Now
          </Link>
        </>
        )}
      </div>
    </div>
  );
};
export default PostExcerpt;
