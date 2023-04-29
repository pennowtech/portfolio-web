import React from 'react';

import {
  ImYoutube, ImGithub, ImInstagram, ImTwitter,
} from 'react-icons/im';

const MenuItems = [
  { title: 'Articles', path: 'blog' },
  { title: 'About Me', path: 'about-me' },
  { title: 'Contact', path: 'contact' },
];
const FooterMainMenuItems = [
  { title: 'About Me', path: 'about-me' },
  { title: 'Articles', path: 'articles' },
  { title: 'Contact Me', path: 'contact' },
];
const FooterOtherMenuItems = [
  { title: 'Terms & Conditions', path: 'about-me' },
  { title: 'Privacy Policy', path: 'articles' },
];
const SocialIconList = [
  { icon: <ImYoutube />, path: 'http://youtube.com', title: 'youtube' },
  {
    icon: <ImGithub />,
    path: 'https://github.com/techishdeep',
    title: 'github',
  },
  {
    icon: <ImInstagram />,
    path: 'https://instagram.com/techishdeep',
    title: 'linkedin',
  },
  {
    icon: <ImTwitter />,
    path: 'https://twitter.com/techishdeep',
    title: 'twitter',
  },
];

const GRAPHQL_URL = 'https://pennow.tech/graphql';
const PER_PAGE_BLOGS = 5;

const isDev = process.env.NODE_ENV === 'development';
const REMOTE_BASE_URL = 'https://sukhdeep.online';
// export const BASE_URL = isDev ? 'http://localhost:3000' : 'http://pennow.tech';
export const BASE_URL = isDev ? 'http://localhost:3000' : REMOTE_BASE_URL;

export const SelectedPostsList = [14, 44, 12];
// export const SelectedPostsList = [];
export {
  MenuItems, SocialIconList, FooterMainMenuItems, FooterOtherMenuItems, GRAPHQL_URL, PER_PAGE_BLOGS,
};
