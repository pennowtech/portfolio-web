import React from 'react';
import Image from "next/legacy/image";

const ProfileCard = ({ text, thumbnailUrl }) => (
  <div className="max-w-sm rounded-lg overflow-hidden shadow-lg mb-6 block bg-slate-600  dark:bg-gray-800 text-white dark:text-slate-300">

    <div className="grow rounded-lg ">
      <div className="relative rounded-lg">
        <div className="relative rounded-t-lg overflow-hidden">

          <Image
            src={thumbnailUrl}
            alt="..."
            layout="intrinsic"
            className="object-cover w-full"
            width={700}
            height={365}
          />

          <div className="relative -mt-10 bg-slate-600 dark:bg-gray-800">
            <div
              className="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20 "
              style={{ transform: 'translateZ(0)' }}
            >
              <svg
                className="absolute bottom-0 overflow-hidden"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="text-slate-600 dark:text-gray-800  fill-current"
                  points="2560 0 2560 100 0 100"
                />
              </svg>
            </div>
            <p className="px-6 py-2 my-2">{text}</p>

          </div>
        </div>

      </div>
    </div>
  </div>
);
export default ProfileCard;
