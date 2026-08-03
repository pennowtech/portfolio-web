import React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import Link from 'next/link';
import { useLanguage } from '../utils/LanguageContext';

const NavBarItem = ({ menu, classprops, homepage, onNavigate }) => {
  const { t } = useLanguage();
  const fullPath = `/#${menu.path}`;
  const localizedTitle = t(
    `nav.${menu.path === 'about-me' ? 'about' : menu.path === 'page' ? 'articles' : menu.path}`,
    menu.title
  );
  const linkClasses = `flex min-h-11 w-full items-center rounded-md px-3 py-2 transition-colors duration-200
    hover:bg-green-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700
    dark:hover:bg-slate-900 dark:hover:text-orange-400 ${classprops || ''}`.trim();

  return (
    <li className='w-full list-none xl:w-auto'>
      {homepage ? (
        <ScrollLink
          activeClass='bg-green-700 text-white dark:bg-green-600 dark:text-white'
          to={menu.path}
          spy
          smooth
          offset={-100}
          duration={500}
          role='link'
          tabIndex={0}
          onClick={onNavigate}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          className={`${linkClasses} cursor-pointer whitespace-nowrap`}
        >
          {localizedTitle}
        </ScrollLink>
      ) : (
        <Link href={fullPath} onClick={onNavigate} className={`${linkClasses} whitespace-nowrap`}>
          {localizedTitle}
        </Link>
      )}
    </li>
  );
};
export default NavBarItem;
