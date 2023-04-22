import React from 'react';

const YouTube = ({ videoId }) => (
  <div className="video-responsive">
    <iframe
        width={800}
        height={480}
        frameborder="0"
        allow="accelerometer; autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Embed youtube"
    />
  </div>
);

export default YouTube;
