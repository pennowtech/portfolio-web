import React from 'react';
import {
  SiNextdotjs,
  SiCplusplus,
  SiQt,
  SiSolidity,
  SiRos,
  SiSocketdotio,
  SiDocker,
  SiKubernetes,
  SiApachespark,
  SiApachekafka,
  SiWireshark,
  SiGit,
  SiPytest,
  SiPostgresql,
  SiMaterialdesign,
  SiJest,
  SiGraphql,
  SiFastapi,
  SiLinux,
  SiRust,
} from 'react-icons/si';
import { FaNetworkWired, FaPython } from 'react-icons/fa';
import { GrReactjs } from 'react-icons/gr';
import { IoLogoJavascript } from 'react-icons/io';
import { MdOutlineDesignServices } from 'react-icons/md';

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

const skills = [
  { name: 'C++ 11/17', icon: SiCplusplus },
  { name: 'Rust', icon: SiRust },
  { name: 'Python', icon: FaPython },
  { name: 'FastAPI', icon: SiFastapi },
  { name: 'Pytest', icon: SiPytest },
  { name: 'Qt', icon: SiQt },
  { name: 'Solidity', icon: SiSolidity },
  { name: 'TCP/IP', icon: FaNetworkWired },
  { name: 'Sockets', icon: SiSocketdotio },
  { name: 'Wireshark', icon: SiWireshark },
  { name: 'ROS', icon: SiRos },
  { name: 'ReactJS', icon: GrReactjs },
  { name: 'Next.JS', icon: SiNextdotjs },
  { name: 'JS', icon: IoLogoJavascript },
  { name: 'Jest', icon: SiJest },
  { name: 'PostgreSQL', icon: SiPostgresql },
  { name: 'GraphQL', icon: SiGraphql },
  { name: 'Docker', icon: SiDocker },
  { name: 'Kubernetes', icon: SiKubernetes },
  { name: 'PySpark', icon: SiApachespark },
  { name: 'Kafka', icon: SiApachekafka },
  { name: 'Softw. Arch.', icon: MdOutlineDesignServices },
  { name: 'UML', icon: SiMaterialdesign },
  { name: 'Git', icon: SiGit },
  { name: 'Linux', icon: SiLinux },
];

const PER_PAGE_BLOGS = 3;

const isDev = process.env.NODE_ENV === 'development';
const REMOTE_BASE_URL = 'https://sukhdeep.online';
// export const BASE_URL = isDev ? 'http://localhost:3000' : 'http://pennow.tech';
export const BASE_URL = isDev ? 'http://localhost:3000' : REMOTE_BASE_URL;

export const SelectedPostsList = [14, 44, 12];
// export const SelectedPostsList = [];
export {
  MenuItems, SocialIconList, FooterMainMenuItems, FooterOtherMenuItems, skills, PER_PAGE_BLOGS,
};
