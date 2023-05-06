import React from 'react';
import randomColor from 'randomcolor';
import { TagCloud } from 'react-tagcloud';

const SidebarTags = ({ tags }) => {
  if (!tags || tags.len === 0) {
    return '';
  }

  const data = Object.keys(tags).map((tag) => ({ value: tag, count: tags[tag] }));

  return (
    <div className='font-medium mx-auto px-2 py-1 md:px-4 overflow-hidden'>
      <h4 className='border-b-2 pl-2'>Tags</h4>
      <TagCloud
        className='justify-center text-center font-Gentium cursor-pointer'
        minSize={20}
        maxSize={35}
        tags={data}
        onClick={(tag) => {
          const url = `/tag/${tag.value}`;
          window.open(url);
        }}
      />
    </div>
  );
};

export default SidebarTags;
