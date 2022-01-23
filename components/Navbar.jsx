import { HiMenuAlt4 } from 'react-icons/hi'
import { AiOutlineClose } from 'react-icons/ai'
import { Link } from "react-scroll";
import Image from 'next/image';
import { useState } from 'react';

import logo from '../public/logo.png'

import { MenuItems } from '../utils/consts'

// const MenuItems = ["Link1", "Link2", "Link3", "Link4"];

const NavBarItem = ({ menu, classprops }) => (
  <li className='border-b md:border-0 w-full py-2'><Link
    activeClass="active"
    to={menu.path}
    spy={true}
    smooth={true}
    offset={-100}
    duration={500}
    className={`cursor-pointer hover:bg-blue-600 text-black hover:text-white px-3 py-2 rounded-md text-sm font-medium ${classprops || ''}`.trim()}
  >
    {menu.title}
  </Link>
  </li>
);

export const Navbar = () => {
  const [isMenuVisible, setMenuVisible] = useState(false)
  return (
    <nav className="bg-slate-50 sticky top-0 z-50 w-full flex justify-between items-center p-4">
      <div className="md:flex-[0.5] flex-initial justify-center items-center">
        <Image src={logo} alt="logo" className="w-32 cursor-pointer" ></Image>
      </div>
      <ul className="md:flex hidden list-none flex-row justify-between items-center flex-initial">
        {MenuItems.map((item, index) => (
          <NavBarItem key={item.title + index} menu={item} />
        ))}
        <li className="bg-[#2952e3] text-white py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd]">
          Login
        </li>
      </ul>
      <div className="flex relative">
        {!isMenuVisible && (
          <HiMenuAlt4 fontSize={28} className="md:hidden cursor-pointer" onClick={() => setMenuVisible(true)} />
        )}
        {isMenuVisible && (
          <ul
            className="z-10 fixed -top-0 -right-2 p-3 w-[70vw] h-screen shadow-2xl md:hidden list-none flex flex-col justify-start items-end rounded-md blue-glassmorphism animate-slide-in transition"
          >
            <li ><AiOutlineClose fontSize={28} className="m-2 md:hidden cursor-pointer" onClick={() => setMenuVisible(false)} /></li>
            {MenuItems.map(
              (item, index) => <NavBarItem key={item.title + index} menu={item} classprops="my-2 text-lg" />,
            )}
          </ul>
        )}
      </div>
    </nav>
  );
};
