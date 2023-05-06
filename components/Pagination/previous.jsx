import React from 'react';
import Link from 'next/link';

import { GrCaretPrevious } from 'react-icons/gr';

const Previous = ({ currentPage, postName }) => {
  const paginationLink = `/${postName}/${currentPage - 1}/`;

  return (
    <Link
      href={paginationLink}
      className='rounded-full border-gray-300 px-4 py-2 mr-1 transition duration-500 ease-in-out hover:bg-gray-400 hover:text-white'
    >
      <GrCaretPrevious className='inline-block' />
    </Link>
  );
};

export default Previous;
