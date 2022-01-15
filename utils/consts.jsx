import React from 'react';

import {
  ImYoutube, ImGithub, ImLinkedin, ImTwitter,
} from 'react-icons/im';

const MenuItems = [
  { title: 'Home', path: '/' },
  { title: 'Articles', path: 'articles' },
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
  { icon: <ImYoutube />, path: '/', title: 'youtube' },
  { icon: <ImGithub />, path: '/', title: 'github' },
  { icon: <ImLinkedin />, path: '/', title: 'linkedin' },
  { icon: <ImTwitter />, path: 'http://twitter.com', title: 'twitter' },
];
export {
  MenuItems, SocialIconList, FooterMainMenuItems, FooterOtherMenuItems,
};
