import React from 'react';

import ThemeToggle from './ThemeToggle';

import Navbar from './Navbar';
import Logo from './Logo';

const Header = () => (
  <header className="md:sticky bg-slate-200 dark:bg-slate-800 prose-a:text-gray-800 dark:prose-a:text-gray-400  top-0 z-50">
    <div className="md:max-w-screen-lg xl:max-w-[1167px] w-full mx-auto flex px-4 py-2">
      <div className="flex flex-row items-center">
        <div>
          <Logo />

        </div>
        <div className="pl-12 relative">
          <ThemeToggle />
          <Navbar />

        </div>
      </div>
    </div>
  </header>
);

export default Header;
