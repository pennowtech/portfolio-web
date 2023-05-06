import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import cx from 'classnames';
import { PER_PAGE_BLOGS } from '@utils/consts';
import { createPaginationLinks } from './PaginationUtils';
import Previous from './previous';
import Next from './next';

const Pagination = ({ totalPosts, postName }) => {
  const router = useRouter();
  const totalPages = Math.ceil(totalPosts / PER_PAGE_BLOGS); // 100/10

  if (!totalPosts || !postName) {
    return null;
  }

  const currentPage = parseInt(router?.query?.page, 10) || 1;

  const paginationLinks = createPaginationLinks(currentPage, totalPages);

  // Calculate the disabled states of the next and previous links
  const showNext = parseInt(currentPage, 10) === parseInt(totalPages, 10);
  const showPrev = parseInt(currentPage, 10) === 1;

  return (
    <div className='flex justify-center my-8'>
      {!showPrev && <Previous currentPage={currentPage} totalPages={totalPages} postName={postName} />}

      {paginationLinks.map((pageNo, index) => {
        const paginationLink = `/${postName}/${pageNo}/`;

        return typeof pageNo === 'number' ? (
          /* eslint-disable react/no-array-index-key */
          <Link
            key={`id-${index}`}
            href={paginationLink}
            className={cx(
              'border rounded-full border-gray-300 px-4 py-2 font-Monda transition duration-500 ease-in-out hover:bg-gray-400 hover:text-white',
              {
                'is-active bg-gray-500 text-white': pageNo === currentPage
              }
            )}
          >
            {pageNo}
          </Link>
        ) : (
          // If its "..."
          <span key={`id-${index}`} className='px-3 py-2'>
            {pageNo}
          </span>
        );
      })}
      {!showNext && <Next currentPage={currentPage} totalPages={totalPages} postName={postName} />}
    </div>
  );
};

export default Pagination;
