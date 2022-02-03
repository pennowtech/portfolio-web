/* eslint-disable react/no-multi-comp */
import React from 'react';

import Link from 'next/link';
import { SocialIconList, FooterMainMenuItems, FooterOtherMenuItems } from '../utils/consts';

const IconLinkRoundSquare = ({ SocialIcon }) => (
  <button className="cursor-pointer  bg-slate-200 shadow-lg h-12 w-12 items-center justify-center align-center rounded-full outline-none focus:outline-none pl-2" type="button">
    <Link href={SocialIcon.path}>
      <a>{SocialIcon.icon}</a>
    </Link>
  </button>
);

const IconLink = ({ SocialIcon }) => (
  <div className="cursor-pointer inline-block hover:-translate-y-2">
    <Link href={SocialIcon.path}>
      <a>{SocialIcon.icon}</a>
    </Link>
  </div>
);
const MainMenuLink = ({ menuItem }) => (
  <li key={menuItem.title} className="pb-2 cursor-pointer whitespace-nowrap overflow-hidden">
    <Link href={menuItem.path}>
      <a>{menuItem.title}</a>
    </Link>
  </li>
);

const OtherMenuLink = ({ menuItem }) => (
  <li key={menuItem.title} className="pb-2 block cursor-pointer whitespace-nowrap overflow-hidden">
    <Link href={menuItem.path}>
      <a>{menuItem.title}</a>
    </Link>
  </li>
);

const Footer = () => (
  <footer className="relative font-Monda  bg-slate-700 dark:bg-slate-800 p-4 prose-a:text-gray-400 text-gray-400 prose-a:hover:text-gray-400 dark:prose-a:text-gray-400 dark:prose-a:hover:text-gray-400 pt-8 pb-6 mt-20">
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
          className="text-slate-700 dark:text-slate-800  fill-current"
          points="2560 0 2560 100 0 100"
        />
      </svg>
    </div>
    <div className="container w-full lg:max-w-[1167px] lg:mx-auto md:px-4">
      <div className="flex flex-wrap text-center lg:text-left">
        <div className="w-full lg:w-6/12 px-4">
          <div className="md:mt-8 text-3xl font-semibold">Let&apos;s keep in touch!</div>
          <div className="text-lg mt-0 mb-2 text-blueGray-600">
            Find me on any of these platforms.
            (I usually respond in 1-2 business days, but it can be longer).
          </div>
          <div className="py-8 flex flex-row justify-center items-center gap-8 text-3xl ">
            {SocialIconList.map((icon) => (
              <IconLink key={icon.title} SocialIcon={icon} />
            ))}
          </div>

        </div>
        <div className="w-full text-left mt-8 md:mt-0 lg:w-6/12 md:px-4">
          <div className="flex  items-top mb-6">
            <div className="w-full lg:w-4/12 px-4 ml-auto">
              <span className="block uppercase  text-sm font-semibold mb-2">
                Useful Links
              </span>
              <ul className="list-none  text-sm">
                {FooterMainMenuItems.map((menuItem) => (
                  <MainMenuLink menuItem={menuItem} />
                ))}
              </ul>
            </div>
            <div className="w-full lg:w-6/12 px-4">
              <span className="block uppercase  text-sm font-semibold mb-2">
                Other Resources
              </span>
              <ul className="list-none  text-sm">
                {FooterOtherMenuItems.map((menuItem) => (
                  <OtherMenuLink menuItem={menuItem} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <hr className="my-6 border-blueGray-300" />
      <div className="flex flex-wrap items-center md:justify-between justify-center">
        <div className="w-full md:w-4/12 px-4 mx-auto text-center">
          <div className="text-sm text-blueGray-500 font-semibold py-1">
            Copyright ©
            {' '}
            {new Date().getFullYear()}
            {' '}
            PenNow.tech.
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
