import React from 'react';
import RecentArticles from './RecentArticles';
import SidebarCategories from './SidebarCategories';

const Sidebar = ({ recentPosts, className }) => (
  <div className={`font-Monda ${className}`}>
    <RecentArticles recentPosts={recentPosts} />
    <SidebarCategories />
  </div>
);

export default Sidebar;
