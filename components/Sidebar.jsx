import React from 'react';
import RecentArticles from './RecentArticles';
import SidebarTags from './SidebarTags';
import Search from './Search';

const Sidebar = ({ recentPosts, tags, className }) => (
  <aside
    aria-label='Article discovery'
    className={`min-w-0 border-t border-slate-200 pt-8 font-RobotoCond text-base dark:border-slate-500 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0 ${className || ''}`}
  >
    <Search />
    <RecentArticles recentPosts={recentPosts} />
    <SidebarTags tags={tags} />
  </aside>
);

export default Sidebar;
