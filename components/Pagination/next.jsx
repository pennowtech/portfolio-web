import React from 'react';

import { GrCaretNext } from 'react-icons/gr';
import Link from 'next/link';

const Next = ({ currentPage, totalPages, postName }) => {
  const paginationLink = `/${postName}/${currentPage + 1}/`;

  return (
    <Link
      href={paginationLink}
      className=' rounded-full border-gray-300 px-4 py-2 ml-1 transition duration-500 ease-in-out hover:bg-gray-400 hover:text-white'
    >
      <GrCaretNext className='inline-block' />
    </Link>
  );
};

export default Next;
