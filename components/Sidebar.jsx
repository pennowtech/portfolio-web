import React from 'react';
import RecentArticles from './RecentArticles';
import SidebarCategories from './SidebarCategories';

const Sidebar = ({ className }) => (
  <div className={`font-Monda ${className}`}>
    <RecentArticles />
    <SidebarCategories />
  </div>
);

export default Sidebar;
