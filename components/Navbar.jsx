import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineBars, AiOutlineClose } from 'react-icons/ai';

import { MenuItems } from '../utils/consts';
import NavBarItem from './NavBarItem';
import LanguageSwitcher from './LanguageSwitcher';

// const MyLink = React.forwardRef((props, ref) => <Link href={href}>{props.children}</Link>);

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
      <ul className='m-0 hidden list-none flex-row items-center gap-1 p-0 xl:flex'>
        {desktopNavItems}
        <li className='ml-2 border-l border-slate-300 dark:border-slate-700 pl-3'>
          <LanguageSwitcher />
        </li>
      </ul>

      <div className='flex items-center xl:hidden'>
        <LanguageSwitcher className='mr-2' />
        <button
          ref={menuButtonRef}
          type='button'
          aria-label='Open navigation menu'
          aria-expanded={isMenuVisible}
          aria-controls='mobile-navigation'
          className='ml-1 flex size-11 items-center justify-center rounded-md transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-slate-700'
          onClick={() => setMenuVisible(true)}
        >
          <AiOutlineBars aria-hidden='true' fontSize={28} />
        </button>
      </div>

      {isMenuVisible && (
        <div className='fixed inset-0 z-[60] xl:hidden'>
          <button
            type='button'
            aria-label='Close navigation menu'
            className='absolute inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-[1px]'
            onClick={closeMenu}
          />
          <aside
            id='mobile-navigation'
            ref={drawerRef}
            role='dialog'
            aria-modal='true'
            aria-label='Navigation menu'
            className='relative flex h-dvh w-[min(82vw,22rem)] flex-col bg-slate-100 p-4 text-slate-900 shadow-2xl dark:bg-slate-800 dark:text-slate-100'
          >
            <div className='mb-5 flex items-center justify-between border-b border-slate-300 pb-3 dark:border-slate-600'>
              <span className='font-Rajdhani text-xl font-bold'>Menu</span>
              <button
                type='button'
                aria-label='Close navigation menu'
                className='flex size-11 items-center justify-center rounded-md transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-slate-700'
                onClick={closeMenu}
              >
                <AiOutlineClose aria-hidden='true' fontSize={28} />
              </button>
            </div>
            <ul className='m-0 flex list-none flex-col gap-2 p-0'>
              {MenuItems.map((item) => (
                <NavBarItem key={item.title} menu={item} homepage={homepage} onNavigate={closeMenu} />
              ))}
            </ul>
            <div className='mt-6 pt-4 border-t border-slate-300 dark:border-slate-700 flex justify-center'>
              <LanguageSwitcher />
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
