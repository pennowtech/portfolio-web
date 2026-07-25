import React from 'react';
import Link from 'next/link';
import LogoMark from './LogoMark';

const Logo = ({ position = 'header' }) => {
  const isFooter = position === 'footer';

  return (
    <Link
      href='/'
      aria-label='ArchitectAtWork — home'
      className={`not-prose inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 ${
        isFooter ? 'focus-visible:ring-green-400' : 'focus-visible:ring-green-700 dark:focus-visible:ring-green-400'
      }`}
    >
      <LogoMark className='size-10 shrink-0 md:size-11' />
      <span className='flex min-w-0 flex-col'>
        <span
          className={`whitespace-nowrap font-Rajdhani text-xl font-bold leading-none tracking-tight md:text-2xl ${
            isFooter ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
        >
          Architect<span className={isFooter ? 'text-green-400' : 'text-green-700 dark:text-green-400'}>AtWork</span>
        </span>
        <span
          className={`mt-1 hidden whitespace-nowrap font-Monda text-[0.55rem] font-semibold uppercase leading-none tracking-[0.16em] sm:block ${
            isFooter ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
          }`}
        >
          Architecture grounded in engineering
        </span>
      </span>
    </Link>
  );
};

export default Logo;
