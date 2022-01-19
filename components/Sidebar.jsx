import React from 'react';
import Link from 'next/link';

const Sidebar = () => (
  <div className="font-Monda ">
    <div className="font-medium mx-auto rounded-full px-2 py-1 md:px-4 cursor-pointer">
      <Link href="articles">
        View all articles
      </Link>
    </div>
  </div>
);

export default Sidebar;
