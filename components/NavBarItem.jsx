import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

const NavBarItem = ({ menu, classprops }) => (
  <li className="md:border-0 border-b-2 border-slate-100 w-full md:py-2 prose-a:hover:text-white inline-block">
    <ScrollLink
      activeClass="active"
      to={menu.path}
      spy
      smooth
      offset={-100}
      duration={500}
      className={`cursor-pointer grow hover:bg-blue-600  dark:hover:border-b-4 dark:hover:border-orange-400 dark:hover:bg-slate-900 dark:hover:text-orange-400 px-3 py-1 hover:rounded-md font-semibold  whitespace-nowrap overflow-hidden ${
        classprops || ''
      }`.trim()}
    >
      {menu.title}
    </ScrollLink>
  </li>
);

export default NavBarItem;
