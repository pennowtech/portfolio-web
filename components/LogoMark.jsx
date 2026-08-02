import React from 'react';

const LogoMark = ({ className = '' }) => (
  <svg aria-hidden='true' className={className} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M26 9H10v16M38 9h16v16M54 39v16H38M26 55H10V39'
      className='stroke-slate-800 dark:stroke-slate-100'
      strokeWidth='4'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M44 19H26c-9 0-9 13 0 13h12c9 0 9 13 0 13H20'
      className='stroke-green-700 dark:stroke-green-400'
      strokeWidth='5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='46' cy='19' r='2.5' className='fill-green-700 dark:fill-green-400' />
    <circle cx='18' cy='45' r='2.5' className='fill-green-700 dark:fill-green-400' />
  </svg>
);

export default LogoMark;
