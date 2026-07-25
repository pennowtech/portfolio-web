import React from 'react';

import { GrCaretNext } from 'react-icons/gr';
import Link from 'next/link';

const Next = ({ currentPage, totalPages, postName }) => {
  const paginationLink = `/${postName}/${currentPage + 1}/`;

  return (
    <Link
      href={paginationLink}
      aria-label='Next article page'
      className='flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 transition hover:border-green-700 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:border-slate-500 dark:hover:border-green-400 dark:hover:text-green-400'
    >
      <GrCaretNext className='inline-block' />
    </Link>
  );
};

export default Next;
