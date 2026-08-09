import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineBars, AiOutlineClose } from 'react-icons/ai';
import { BiSearch } from 'react-icons/bi';

import { MenuItems } from '../utils/consts';
import NavBarItem from './NavBarItem';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ homepage, classprops }) => {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const desktopNavItems = useMemo(
    () => MenuItems.map((item) => <NavBarItem key={item.title} menu={item} homepage={homepage} />),
    [homepage]
  );

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const triggerCmdK = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  useEffect(() => {
    if (!isMenuVisible) return undefined;

    const previousOverflow = document.body.style.overflow;
    const drawer = drawerRef.current;
    const menuButton = menuButtonRef.current;
    const focusableElements = drawer?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements?.[0];
    const lastFocusable = focusableElements?.[focusableElements.length - 1];

    document.body.style.overflow = 'hidden';
    firstFocusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key !== 'Tab' || !firstFocusable || !lastFocusable) return;
      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      menuButton?.focus();
    };
  }, [isMenuVisible]);

  return (
    <nav aria-label='Primary navigation' className={`${classprops} flex items-center`}>
      <ul className='m-0 hidden w-full list-none flex-row items-center gap-0.5 p-0 md:flex'>
        {desktopNavItems}
        <li className='ml-auto flex items-center gap-1.5 border-l border-slate-300 pl-2 lg:gap-2.5 lg:pl-4 dark:border-slate-700'>
          <button
            type='button'
            onClick={triggerCmdK}
            aria-label='Search articles and commands'
            className='inline-flex size-11 items-center justify-center rounded-lg border border-slate-300 bg-slate-100/80 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 lg:w-auto lg:gap-1.5 lg:px-3 lg:py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            title='Search articles and commands (Cmd + K)'
          >
            <BiSearch aria-hidden='true' className='text-sm text-slate-500 dark:text-slate-400' />
            <span className='hidden lg:inline'>Search</span>
            <kbd className='hidden rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-2xs xl:inline dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'>
              ⌘K
            </kbd>
          </button>
          <ThemeToggle />
          <LanguageSwitcher />
        </li>
      </ul>

      <div className='flex items-center gap-1.5 sm:gap-2 md:hidden'>
        <button
          type='button'
          onClick={triggerCmdK}
          aria-label='Search articles and commands'
          className='inline-flex size-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-100 sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
          title='Search articles and commands (Cmd + K)'
        >
          <BiSearch aria-hidden='true' className='text-sm text-orange-600 dark:text-orange-400' />
          <span className='hidden sm:inline'>Search</span>
          <kbd className='hidden rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 sm:inline dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'>
            ⌘K
          </kbd>
        </button>
        <button
          ref={menuButtonRef}
          type='button'
          aria-label='Open navigation menu'
          aria-expanded={isMenuVisible}
          aria-controls='mobile-navigation'
          className='flex size-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 shadow-2xs transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
          onClick={() => setMenuVisible(true)}
        >
          <AiOutlineBars aria-hidden='true' className='text-2xl' />
        </button>
      </div>

      {isMenuVisible && (
        <div className='fixed inset-0 z-[100] md:hidden'>
          <button
            type='button'
            aria-label='Close navigation menu'
            className='absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-xs'
            onClick={closeMenu}
          />
          <aside
            id='mobile-navigation'
            ref={drawerRef}
            role='dialog'
            aria-modal='true'
            aria-label='Navigation menu'
            className='relative flex h-dvh w-[min(85vw,22rem)] flex-col bg-slate-100 p-5 text-slate-900 shadow-2xl dark:bg-slate-800 dark:text-slate-100'
          >
            <div className='mb-6 flex items-center justify-between border-b border-slate-300 pb-3.5 dark:border-slate-700'>
              <span className='font-Rajdhani text-2xl font-bold tracking-wide'>Menu</span>
              <button
                type='button'
                aria-label='Close navigation menu'
                className='flex size-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
                onClick={closeMenu}
              >
                <AiOutlineClose aria-hidden='true' className='text-2xl' />
              </button>
            </div>
            <ul className='m-0 flex list-none flex-col gap-2 p-0'>
              {MenuItems.map((item) => (
                <NavBarItem key={item.title} menu={item} homepage={homepage} onNavigate={closeMenu} />
              ))}
            </ul>
            <div className='mt-auto flex flex-col gap-3 border-t border-slate-300 pt-5 dark:border-slate-700'>
              <div className='flex items-center justify-between rounded-xl border border-slate-300 bg-white p-3 shadow-2xs dark:border-slate-700 dark:bg-slate-900/60'>
                <span className='font-Monda text-sm font-semibold text-slate-800 dark:text-slate-200'>Appearance</span>
                <ThemeToggle />
              </div>
              <div className='flex items-center justify-between rounded-xl border border-slate-300 bg-white p-3 shadow-2xs dark:border-slate-700 dark:bg-slate-900/60'>
                <span className='font-Monda text-sm font-semibold text-slate-800 dark:text-slate-200'>Language</span>
                <LanguageSwitcher />
              </div>
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
