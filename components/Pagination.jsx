import React from 'react';
import Link from 'next/link';

const paginate = (items, pageNumber, pageSize) => {
  const startIndex = (pageNumber - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};

const Pagination = ({ items, pageSize, currentPage, onPageChange }) => {
  const pagesCount = Math.ceil(items / pageSize); // 100/10

  if (pagesCount === 1) return null;
  const pages = Array.from({ length: pagesCount }, (_, i) => i + 1);
  console.log('Pages:', pages);
  const pageLink = currentPage - 1 === 1 ? '/blog/' : `/blog/${currentPage - 1}`;
  return (
    <div className='flex justify-center my-0'>
      <ul className='flex p-0 m-0 list-none gap-1 '>
        {pages.map((page) => (
          <li
            key={page}
            className={
              page === currentPage
                ? 'flex rounded-full px-4 py-1 transition duration-500 ease-in-out hover:bg-bllue-400 hover:text-white border-blue-800 text-center justify-center  bg-blue-400 text-blue-50 border-2'
                : 'flex rounded-full px-4 py-1 transition duration-500 ease-in-out hover:bg-teal-100 hover:text-white border-teal-800 dark:border-emerald-600 dark:hover:bg-emerald-600 text-center justify-center border-2'
            }
          >
            <Link href={`${pageLink}`} className='cursor-pointer' onClick={() => onPageChange(page)}>
              {page}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { Pagination, paginate };
