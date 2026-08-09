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
  SiMqtt,
  SiRust
} from 'react-icons/si';
import { FaNetworkWired, FaPython } from 'react-icons/fa';
import { GrReactjs } from 'react-icons/gr';
import { IoLogoJavascript } from 'react-icons/io';
import {
  MdAccountTree,
  MdArchitecture,
  MdDescription,
  MdDomain,
  MdGridView,
  MdHistory,
  MdOutlineDesignServices,
  MdSettingsEthernet,
  MdSyncAlt
} from 'react-icons/md';

import { ImGithub, ImInstagram, ImTwitter } from 'react-icons/im';

const WebSiteTags = [
  { name: 'ReactJS' },
  { name: 'NodeJS' },
  { name: 'Python' },
  { name: 'PostgreSQL' },
  { name: 'GraphQL' },
  { name: 'Qt/QML' },
  { name: 'REST API' },
  { name: 'Axios' }
];

const MenuItems = [
  { title: 'Home', path: 'home' },
  { title: 'About', path: 'spotlight' },
  { title: 'Life & Interests', path: 'life-interests' },
  { title: 'Projects', path: 'projects' },
  { title: 'Articles', path: 'page' },
  { title: 'Contact', path: 'contact' }
];
const FooterMainMenuItems = [
  { title: 'Home', path: '/' },
  { title: 'About', path: '/about-me' },
  { title: 'Articles', path: '/page' },
  { title: 'Contact', path: '/contact' }
];
const SocialIconList = [
  {
    icon: <ImGithub />,
    path: 'https://github.com/techishdeep',
    title: 'GitHub'
  },
  {
    icon: <ImInstagram />,
    path: 'https://instagram.com/techishdeep',
    title: 'Instagram'
  },
  {
    icon: <ImTwitter />,
    path: 'https://x.com/techishdeep',
    title: 'X / Twitter'
  }
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
  { name: 'MQTT', icon: SiMqtt },
  { name: 'gRPC', icon: MdSyncAlt },
  { name: 'D-Bus', icon: MdSettingsEthernet },
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
  { name: 'Microservices Architecture', icon: MdAccountTree },
  { name: 'Domain-Driven Design', icon: MdDomain },
  { name: 'Network Architecture', icon: FaNetworkWired },
  { name: 'System Design', icon: MdOutlineDesignServices },
  { name: 'Distributed Systems', icon: MdGridView },
  { name: 'Legacy Modernization', icon: MdHistory },
  { name: 'ArchiMate', icon: MdArchitecture },
  { name: 'UML', icon: SiMaterialdesign },
  { name: 'C4 Model', icon: MdGridView },
  { name: 'Architecture Decision Records', icon: MdDescription },
  { name: 'Git', icon: SiGit },
  { name: 'Linux', icon: SiLinux }
];

const POSTS_PER_PAGE = 10;
const RECENT_POSTS_COUNT = 5;

export const SelectedPostsList = [14, 44, 12];
// export const SelectedPostsList = [];
export {
  WebSiteTags,
  MenuItems,
  SocialIconList,
  FooterMainMenuItems,
  skills,
  POSTS_PER_PAGE as PER_PAGE_BLOGS,
  RECENT_POSTS_COUNT
};
