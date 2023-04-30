import React from 'react';
import Image from 'next/image';

const TechCard = ({
  icon, className, text,
}) => (
  <div className="h-auto">
    <div className={`${className} shadow-lg rounded-lg text-center py-3 mt-6">`}>
      {/* <Image
        alt="..."
        width={48}
        height={48}
        className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white"
        src={icon}
      /> */}
      <div className="shadow-md rounded-full max-w-full w-6 h-6 mx-auto p-1 bg-white">
        {icon}
      </div>
      <div className=" text-white mt-2 font-semibold">
        {text}
      </div>
    </div>
  </div>
);

export default TechCard;
