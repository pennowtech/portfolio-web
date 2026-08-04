import React from 'react';
import Image from 'next/image';

const LogoMark = ({ className = 'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11' }) => (
  <div className={`relative shrink-0 overflow-hidden rounded-full ${className}`}>
    <Image
      src='/singhbuildstech-logo.png'
      alt='SinghBuildsTech logo'
      width={44}
      height={44}
      className='h-full w-full object-cover'
      priority
    />
  </div>
);

export default LogoMark;
