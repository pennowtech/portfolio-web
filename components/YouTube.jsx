import React from 'react';

const YouTube = ({ videoId }) => {
  console.log(videoId)
  return(
    <iframe
      width={800}
      height={480}
      frameBorder="0"
      allow="accelerometer; autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="Embed youtube"
    />
);}

export default YouTube;
