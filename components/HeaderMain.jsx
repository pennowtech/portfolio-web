import React from 'react';

import ThemeToggle from './ThemeToggle';

import Navbar from './Navbar';
import Logo from './Logo';

const HeaderMain = ({ homepage = false }) => (
  <header className='md:sticky bg-slate-100 dark:bg-slate-800 prose-a:text-gray-800 shadow-inner dark:prose-a:text-gray-400 top-0 z-50 max-w-screenf-lg'>
    <div className=' flex mx-auto py-2 md:py-0 px-4 lg:px-8 items-center justify-between md:max-w-screen-lg xl:max-w-[1048px] w-full'>
      <Logo />
      <div className='flex items-center justify-end'>
        <ThemeToggle />
        <Navbar homepage={homepage} classprops='font-Monda font-semibold' />
      </div>
    </div>
  </header>
);

export default HeaderMain;
