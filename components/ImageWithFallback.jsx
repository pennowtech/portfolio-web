// https://stackoverflow.com/a/66953317
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { BASE_URL } from '../utils/consts';

const ImageWithFallback = (props) => {
  let hostname = '';
  if (typeof window !== 'undefined') {
    hostname = window.location.origin;
  }
  const { src, fallbackSrc, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const imgUrl = `${BASE_URL}${imgSrc}`;
  // console.log(5454, 'hostname:', hostname, 'imgUrl: ', imgUrl);

  return (
    <Image
      {...rest}
      src={imgUrl}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
};

export default ImageWithFallback;
