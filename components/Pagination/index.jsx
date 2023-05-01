import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import cx from 'classnames';
import { createPaginationLinks } from './PaginationUtils';
import Previous from './previous';
import Next from './next';

const Pagination = ({
  currentPage,
  totalPages,
  postName,
  onPageChange,
}) => {
  const router = useRouter();

  if (!totalPages || !postName || totalPages == 1) {
    return null;
  }
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  console.log(pages);
  // const currentPage = parseInt(router?.query?.page, 10) || 1;

  const paginationLinks = createPaginationLinks(currentPage, totalPages);

  // Calculate the disabled states of the next and previous links
  const nextDisabled = parseInt(currentPage, 10) === parseInt(totalPages, 10);
  const prevDisabled = parseInt(currentPage, 10) === 1;

  return (
    <div className="flex justify-center my-8">
      {!prevDisabled && (
        <Previous currentPageNo={currentPage} postName={postName} />
      )}

      {paginationLinks.map((pageNo, index) => {
        const paginationLink = `/${postName}/page/${pageNo}/`;

        return typeof pageNo === 'number' ? (
          /* eslint-disable react/no-array-index-key */
          <Link key={`id-${index}`} href={paginationLink}>
            <a
              className={cx(
                'border rounded-full border-gray-300 px-4 py-2 font-Monda transition duration-500 ease-in-out hover:bg-gray-400 hover:text-white',
                {
                  'is-active bg-gray-500 text-white': pageNo === currentPage,
                },
              )}
            >
              {pageNo}
            </a>
          </Link>
        ) : (
          // If its "..."
          <span key={`id-${index}`} className="px-3 py-2">
            {pageNo}
          </span>
        );
      })}
      {!nextDisabled && (
        <Next
          currentPage={currentPage}
          totalPages={totalPages}
          postName={postName}
        />
      )}
    </div>
  );
};

export default Pagination;
