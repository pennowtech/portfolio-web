import React from 'react';

import Link from 'next/link';
import Image from 'next/image';

import logo from '../public/pic.png';

const Logo = ({ position }) => (
  <Link href="/">
    <a>
        {/* <Image
        src={logo}
        alt="logo"
        className="w-32 cursor-pointer"
      /> */}
        <span
            className={`font-YantraManav text-3xl md:text-4xl font-bold ${position === "footer" || "text-orange-600"}`}>Pen</span>
        <span
            className={`font-Rajdhani text-3xl md:text-4xl font-semibold ${position === "footer" || "text-blue-600 dark:text-blue-500"}`}>
        Now
      </span>
        <span className="font-Roboto pl-1 text-xl md:text-2xl text-underline font-bold">tech</span>
    </a>
  </Link>
);

export default Logo;
