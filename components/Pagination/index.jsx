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
    <nav aria-label='Article pages' className='my-10 flex flex-wrap items-center justify-center gap-2 md:my-12'>
      {!showPrev && <Previous currentPage={currentPage} totalPages={totalPages} postName={postName} />}

      {paginationLinks.map((pageNo, index) => {
        const paginationLink = `/${postName}/${pageNo}/`;

        return typeof pageNo === 'number' ? (
          <Link
            key={`page-${pageNo}`}
            href={paginationLink}
            className={cx(
              'flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 font-Monda transition hover:border-green-700 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:border-slate-500 dark:hover:border-green-400 dark:hover:text-green-400',
              {
                'is-active border-green-700 bg-green-700 text-white hover:text-white dark:border-green-600 dark:bg-green-600 dark:hover:text-white':
                  pageNo === currentPage
              }
            )}
          >
            {pageNo}
          </Link>
        ) : (
          // If its "..."
          <span key={`ellipsis-${index}`} className='px-2 py-2' aria-hidden='true'>
            {pageNo}
          </span>
        );
      })}
      {!showNext && <Next currentPage={currentPage} totalPages={totalPages} postName={postName} />}
    </nav>
  );
};

export default Pagination;
