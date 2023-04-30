/* eslint-disable react/no-multi-comp */
/* eslint-disable max-len */
import React from 'react';

import { SiNextdotjs, SiQt } from 'react-icons/si';
import { GrReactjs } from 'react-icons/gr';
import { IoLogoJavascript } from 'react-icons/io';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { skills } from '@utils/consts';
import TechCard from './TechCard';
import ProfileCard from './ProfileCard';

const H3Component = ({ children }) => (
  <h3 className="text-base lg:text-lg my-2">{children}</h3>
);
const H2Component = ({ children }) => (
  <h2 className="my-2">{children}</h2>
);
const ULComponent = ({ children }) => (
  <ul className="px-2 list-none ">{children}</ul>
);

const IntroHighlight = ({ headingBlocks }) => (
  <section className="mt-12 md:mt-10 pb-6 font-RobotoSlab relative ">
    <div className="container mx-auto">
      <h2 className="mt-4 mb-0 font-Monda  underline-offset-2 mx-auto justify-center text-center">
        Profile Highlights
      </h2>
      <div className="grid md:flex md:flex-row items-center">
        <div className="w-full md:w-4/12 px-4 mx-auto mt-6 lg:text-lg font-Monda">
          <ProfileCard
            text="Whether you are looking to create a sleek new website, design a mobile application, or develop a robust software system for your business, I have the skills and expertise to bring your vision to life."
            thumbnailUrl="/blank-2.jpeg"
          />
        </div>

        <div className="w-full md:w-7/12 p-4 md:mt-6 ">
          <div className="grid md:flex md:flex-row items-center gap-4">
            {headingBlocks.slice(1, 3).map((heading, index) => (
              <div key={index} className="w-full md:w-6/12">
                <ReactMarkdown components={{ h3: H3Component }}>
                  {heading}
                </ReactMarkdown>
              </div>
            ))}
          </div>
          <ReactMarkdown components={{ h2: H2Component }}>
            {headingBlocks[0]}
          </ReactMarkdown>
          <hr className="my-2" />
        </div>
      </div>

      <div className="grid md:flex md:flex-row items-center gap-4">
        <div className="w-full md:w-7/12 px-6">
          <div className="md:pr-12 relative">
            <ReactMarkdown components={{ h2: H2Component, ul: ULComponent }}>
              {headingBlocks[3]}
            </ReactMarkdown>
          </div>
          <hr className="hidden md:block md:my-2" />
        </div>

        <div className="w-full md:w-4/12 px-4 pt-4 md:pt-0">
          <div className="shadow-xl relative h-48 lg:h-56 transform -rotate-x-1 rotate-y-2 rotate-2">
            <Image layout="fill" src="/blank.jpg" className="rounded-lg" />
          </div>
          <hr className="block md:hidden md:my-2" />
        </div>
      </div>

      <div className="grid gap-4 md:flex md:flex-row md:items-center px-6">
        <div className="w-full md:w-4/12 p-4">
          <div className="flex gap-4 flex-row md:items-center lg:text-lg">
            <div className="w-1/2 md:w-6/12">
              <TechCard
                className="bg-cyan-600 text-cyan-600 mb-4"
                icon={<GrReactjs />}
                text="ReactJS"
              />
              <TechCard
                className="bg-gray-700 text-gray-100"
                icon={<SiNextdotjs />}
                text="NextJS"
              />
            </div>
            <div className="w-1/2 md:w-6/12 mt-8 md:mt-16">
              <TechCard
                className="bg-yellow-500 text-yellow-500 mb-4"
                icon={<IoLogoJavascript />}
                text="JavaScript"
              />
              <TechCard
                className="bg-green-600 text-green-600 mb-4"
                icon={<SiQt />}
                text="Qt, QML"
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-7/12 ml-auto mr-auto">
          <ReactMarkdown components={{ h2: H2Component, ul: ULComponent }}>
            {headingBlocks[4]}
          </ReactMarkdown>
          <hr className="my-2" />
        </div>
      </div>

      <div className="flex flex-wrap md:justify-center md:text-sm text-xs gap-8 md:gap-12  justify-center items-center px-6">
        <h3 className="mt-6 flex items-center text-3xl font-semibold gap-4 w-full">
          <i className="fas fa-ship" />
          Skills in short
        </h3>
        {skills.map((skill, index) => (
          <div key={index} className="text-center mb-2">
            <skill.icon className="md:text-5xl text-4xl mb-2" />
            {skill.name}
          </div>
        ))}
      </div>
    </div>
    {/* <Link href="/Sukhdeep Singh_CV_Architect.pdf">
      <a>
        <div className="button xl:w-48 w-40 text-center mx-auto">
          Complete CV
        </div>
      </a>
    </Link> */}
  </section>
);

export default IntroHighlight;
