import React from 'react';
import Link from 'next/link';

const SidebarCategories = ({ categories }) => {
  if (!categories || categories.len === 0) {
    return '';
  }

  return (
    <div className='font-medium mx-auto px-2 py-1 md:px-4 whitespace-nowrap overflow-hidden'>
      <h4 className='border-b-2'>Categories</h4>
      {Object.keys(categories).map((category) => (
        <div key={category} className='text-base py-2 flex h-full items-center justify-between'>
          <Link href={`/category/${category}`}>{category}</Link>
          <div className='ml-2 px-2 py-1 rounded-full text-slate-200 bg-blue-500 text-xs '>{categories[category]}</div>
        </div>
      ))}
    </div>
  );
};

export default SidebarCategories;
