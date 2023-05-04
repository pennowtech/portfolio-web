// https://stackoverflow.com/a/66953317
import React, { useState, useEffect, forwardRef } from 'react';
import Image from "next/legacy/image";
import { BASE_URL } from '../utils/consts';

const ImageWithFallback = forwardRef((props, ref) => {
  let hostname = '';
  if (typeof window !== 'undefined') {
    hostname = window.location.origin;
  }
  const { src, fallbackSrc, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const imgUrl = imgSrc || `${BASE_URL}/${imgSrc}`;
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
});

export default ImageWithFallback;
