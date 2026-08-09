import React from 'react';

import Navbar from './Navbar';
import Logo from './Logo';

const HeaderMain = ({ homepage = false }) => (
  <header className='sticky top-0 z-50 w-full border-b border-slate-200/80 bg-slate-100/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 prose-a:text-gray-800 dark:prose-a:text-gray-300'>
    <div className='mx-auto grid min-h-16 w-full max-w-[768px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 md:grid-cols-1 md:grid-rows-[4.25rem_auto] md:gap-0 md:pb-2 lg:px-8'>
      <div className='min-w-0 self-center md:col-span-full'>
        <Logo />
      </div>
      <Navbar
        homepage={homepage}
        classprops='font-Inter text-xs font-medium tracking-[0.01em] md:col-span-full md:w-full md:border-t md:border-slate-300 md:pt-2 lg:text-sm dark:md:border-slate-700'
      />
    </div>
  </header>
);

export default HeaderMain;
