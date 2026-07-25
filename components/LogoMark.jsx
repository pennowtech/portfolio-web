import React from 'react';

const LogoMark = ({ className = '' }) => (
  <svg aria-hidden='true' className={className} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M8 53 27 10l18 43M15.5 36h23'
      className='stroke-slate-800 dark:stroke-slate-100'
      strokeWidth='5.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='m28 30 8 23 8-17 8 17 6-23'
      className='stroke-green-700 dark:stroke-green-400'
      strokeWidth='5.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='27' cy='10' r='3.5' className='fill-green-700 dark:fill-green-400' />
  </svg>
);

export default LogoMark;
