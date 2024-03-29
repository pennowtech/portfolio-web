import React, { useState, useMemo } from 'react';
import { AiOutlineBars, AiOutlineClose } from 'react-icons/ai';

import { MenuItems } from '../utils/consts';
import NavBarItem from './NavBarItem';

// const MyLink = React.forwardRef((props, ref) => <Link href={href}>{props.children}</Link>);

const Navbar = ({ homepage, classprops }) => {
  const [isMenuVisible, setMenuVisible] = useState(false);

  // Memoizing the NavBarItems to prevent re-renders on state updates
  const memoizedNavItems = useMemo(
    () => MenuItems.map((item) => <NavBarItem key={item.title} menu={item} homepage={homepage} />),
    [homepage]
  );

  return (
    <nav className={`${classprops} inline-block pl-8`}>
      <ul className='hidden list-none md:flex flex-row m-0 items-center flex-initial'>
        {memoizedNavItems}
        <li className='bg-[#2952e3] text-white px-4 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd]'>Login</li>
      </ul>
      <div className='md:hidden w-full flex justify-end'>
        {!isMenuVisible && (
          <AiOutlineBars fontSize={28} className='cursor-pointer' onClick={() => setMenuVisible(true)} />
        )}
        {isMenuVisible && (
          <ul className='z-10 fixed -top-0 -right-2 p-3 w-[70vw] h-screen shadow-2xl md:hidden list-none flex flex-col justify-start items-end rounded-md bg-slate-200 animate-slide-in transition'>
            <li>
              <AiOutlineClose
                fontSize={28}
                className='m-2 md:hidden cursor-pointer'
                onClick={() => setMenuVisible(false)}
              />
            </li>
            {memoizedNavItems}
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
