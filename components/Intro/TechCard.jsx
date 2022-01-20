import React from 'react';
import Image from 'next/image';

const TechCard = ({
  color, icon, className, text,
}) => (
  <div className="h-auto">
    <div className={`bg-${color} ${className} shadow-lg rounded-lg text-center px-8 py-4 mt-8">`}>
      {/* <Image
        alt="..."
        width={48}
        height={48}
        className="shadow-md rounded-full max-w-full w-16 mx-auto p-2 bg-white"
        src={icon}
      /> */}
      <div className={`text-${color} shadow-md rounded-full max-w-full w-9 h-9 mx-auto p-2 bg-white`}>
        {icon}

      </div>
      <div className="text-lg text-white mt-4 font-semibold">
        {text}
      </div>
    </div>
  </div>
);

export default TechCard;
