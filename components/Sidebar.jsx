import React from 'react';
import RecentArticles from './RecentArticles';
import SidebarTags from './SidebarTags';
import Search from './Search';

const Sidebar = ({ recentPosts, tags, className }) => (
  <div className={`font-RobotoCond text-base ${className}`}>
    <Search />
    <RecentArticles recentPosts={recentPosts} />
    <SidebarTags tags={tags} />
  </div>
);

export default Sidebar;
