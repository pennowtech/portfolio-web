// https://stackoverflow.com/a/66953317
import React, { forwardRef, useEffect, useState } from 'react';
import Image from 'next/image';

const normalizeSource = (source) => {
  if (typeof source !== 'string' || !source) return source;
  if (/^(https?:|data:|blob:)/.test(source) || source.startsWith('/')) return source;
  return `/${source}`;
};

const ImageWithFallback = forwardRef((props, ref) => {
  const {
    src,
    fallbackSrc = '/blank.jpg',
    alt = '',
    layout,
    objectFit,
    objectPosition,
    className,
    style,
    width,
    height,
    sizes,
    ...rest
  } = props;
  const fallback = normalizeSource(fallbackSrc);
  const [imgSrc, setImgSrc] = useState(normalizeSource(src) || fallback);

  useEffect(() => {
    setImgSrc(normalizeSource(src) || fallback);
  }, [fallback, src]);

  const sharedProps = {
    ...rest,
    ref,
    src: imgSrc,
    className,
    sizes,
    style: {
      objectFit,
      objectPosition,
      ...style
    },
    onError: () => setImgSrc(fallback)
  };

  if (layout === 'fill') {
    return <Image {...sharedProps} alt={alt} fill />;
  }

  return <Image {...sharedProps} alt={alt} width={width} height={height} />;
});

ImageWithFallback.displayName = 'ImageWithFallback';

export default ImageWithFallback;
