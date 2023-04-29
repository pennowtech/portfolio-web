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
        className={`font-Rajdhani text-2xl md:text-4xl font-bold ${position === 'footer' || 'text-orange-600'}`}
      >
        Techish

      </span>
      <span
        className={`font-Rajdhani text-2xl md:text-4xl font-semibold ${position === 'footer' || 'text-blue-600 dark:text-blue-500'}`}
      >
        Deep
      </span>
    </a>
  </Link>
);

export default Logo;
