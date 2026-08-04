import React from 'react';

import ThemeToggle from './ThemeToggle';

import Navbar from './Navbar';
import Logo from './Logo';

const HeaderMain = ({ homepage = false }) => (
  <header className='sticky top-0 z-50 w-full border-b border-slate-200/80 bg-slate-100/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 prose-a:text-gray-800 dark:prose-a:text-gray-300'>
    <div className='mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-3.5 sm:px-4 lg:px-8'>
      <Logo />
      <Navbar homepage={homepage} classprops='font-Monda font-semibold' />
    </div>
  </header>
);

export default HeaderMain;
