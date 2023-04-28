/* eslint-disable max-len */
import React from 'react';

import Link from 'next/link';
import { GrReactjs, GrSystem } from 'react-icons/gr';
import {
  SiNextdotjs, SiCplusplus, SiQt, SiSolidity, SiRos, SiSocketdotio, SiDocker, SiKubernetes, SiApachespark, SiApachekafka, SiWireshark, SiGit, SiPytest, SiPostgresql, SiMaterialdesign, SiJest, SiGraphql, SiFastapi, SiLinux, SiRust,
} from 'react-icons/si';
import { GiShipWheel } from 'react-icons/gi';
import { IoLogoJavascript, IoMdBuild } from 'react-icons/io';
import {
  MdOutlineDesignServices, MdOutlineDeveloperMode, MdOutlineStickyNote2,
} from 'react-icons/md';
import Image from 'next/image';
import {
  BsHddNetwork, BsLayoutTextWindow, BsListCheck, BsTools,
} from 'react-icons/bs';
import { FiDatabase } from 'react-icons/fi';
import {
  FaDraftingCompass, FaNetworkWired, FaPython,
} from 'react-icons/fa';
import PostTags from '../Post/PostTags';
import TechCard from './TechCard';
import ProfileCard from './ProfileCard';

const IntroHighlight = () => (
  <section className="mt-48 md:mt-10 pb-24 relative ">
    <div className="container mx-auto">
      <h2 className="mt-4 mb-0 font-Monda  underline-offset-2 mx-auto justify-center text-center">Profile Highlights</h2>
      <div className="flex flex-wrap items-center">
        <div className="w-10/12 md:w-4/12 md:px-2 font-Monda mx-auto lg:text-base mt-6">
          <ProfileCard
            text="Whether you are looking to create a sleek new website, design a mobile application, or develop a robust software system for your business, I have the skills and expertise to bring your vision to life."
            thumbnailUrl="/blank-2.jpeg"
          />
        </div>

        <div className="w-full text-base leading-8 md:w-7/12 p-4 mt-6">
          <div className="flex flex-wrap">
            <div className="w-full md:w-6/12 px-4">
              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-xl font-bold font-Rajdhani items-center">
                  <SiCplusplus />
                  <div className="ml-4">Programming Languages</div>
                </div>
                <p className="mb-4 font-Yantramanav font-medium text-base">
                  Extensively worked with C++11/14/17, Qt, Python, FastAPI, ReactJS, TypeScript. These days, exploring Rust.
                </p>
              </div>

              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-xl font-bold font-Rajdhani items-center">
                  <BsHddNetwork />
                  <div className="ml-4">Network Programming</div>
                </div>
                <p className="mb-4 font-Yantramanav font-medium text-base">
                  Worked with various networking protocols, like &nbsp;TCP, IPV4, IPv6, DHCP, SNMP, ARP, etc.
                </p>
              </div>
            </div>
            <div className="w-full md:w-6/12 px-4">
              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-xl font-bold font-Rajdhani items-center">
                  <BsTools />
                  <div className="ml-4">Performance Monitoring</div>
                </div>
                <p className="mb-4 font-Yantramanav font-medium text-base">
                  Experience with performance monitoring tools like iperf, strace, ltrace, gprof, valgrind, etc.
                </p>
              </div>

              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-xl font-bold font-Rajdhani items-center">
                  <GrSystem />
                  <div className="ml-4">System Programming</div>
                </div>
                <p className="mb-4 font-Yantramanav font-medium text-base">
                  Implemented many solutions based on IPCs (Sockets, Pipes, Threads, Shared Memory, Mutex, and Semaphores).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full md:w-7/12 ml-auto px-12 md:px-4">
          <div className="md:pr-12 relative flex flex-col">
            <h3 className="flex font-bold font-Rajdhani items-center">
              <MdOutlineDesignServices />
              <div className="ml-2 font-semibold">Software Architecture & Design</div>
            </h3>
            <div className="mt-4  font-Yantramanav text-xl">
              Technical abilities to develop accurate software blueprints and determine design choices.
            </div>
            <ul className="list-none mt-6 items-center font-Yantramanav text-base">
              <li className="flex">
                <BsListCheck />
                <div className="ml-4">Defining product requirements</div>
              </li>
              <li className="flex">
                <MdOutlineStickyNote2 />
                <div className="ml-4">High-level architectural specifications</div>
              </li>
              <li className="flex">
                <IoMdBuild />
                <div className="ml-4">Content integration and delivery (CI/CD) systems</div>
              </li>
            </ul>
            <div className="block pb-6">
              <PostTags
                tags={[
                  { name: 'UML', slug: '' },
                  { name: 'Archimate', slug: '' },
                  { name: 'TOGAF', slug: '' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-4/12 mr-auto px-4 pt-4 md:pt-0">
          <div
            className="shadow-xl relative h-48 lg:h-56"
            style={{
              transform: 'perspective(1040px) rotateY(-11deg) rotateX(2deg) rotate(2deg)',
            }}
          >
            <Image layout="fill" src="/blank.jpg" className="rounded-lg " />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center">
        <div className="w-full md:w-4/12 lg:w-4/12 px-4 mr-auto ml-auto">
          <div className="justify-center flex flex-wrap relative">
            <div className="my-4 w-full lg:w-6/12 px-4">
              <TechCard className="bg-cyan-600 text-cyan-600 mb-4" icon={<GrReactjs />} text="ReactJS" />

              <TechCard color="gray-700" className=" " icon={<SiNextdotjs />} text="NextJS" />
            </div>
            <div className="my-4 w-full lg:w-6/12 px-4 lg:mt-16">
              <TechCard color="yellow-500" className="bg-yellow-500 text-yellow-500 mb-4" icon={<IoLogoJavascript />} text="JavaScript" />
              <TechCard color="green-600" className="bg-green-600  text-green-600 mb-4" icon={<SiQt />} text="Qt, QML" />
            </div>
          </div>
        </div>

        <div className="w-full md:w-7/12 px-12 md:px-4 ml-auto mr-auto">
          <h3 className="flex font-bold font-Rajdhani items-center">
            <FaDraftingCompass />
            <div className="mb-2 ml-2 my-2 font-semibold">User Interface Design</div>
          </h3>
          <p className="mt-4  font-Roboto text-base font-medium">
            In order to create a great User Experience, implemented applications and solutions using a range of technologies and programming
            languages.
          </p>
          <ul className="list-none mt-6  text-base font-medium items-center font-Yantramanav">
            <li className="flex">
              <MdOutlineDeveloperMode />
              <div className="ml-4">Full-Stack Web Development</div>
            </li>
            <li className="flex">
              <BsLayoutTextWindow />
              <div className="ml-4">Desktop based UIs in Qt/QML</div>
            </li>
            <li className="flex">
              <FiDatabase />
              <div className="ml-4">Databases: PostgreSQL and Redis</div>
            </li>
          </ul>
          <div className="block pb-6">
            <PostTags
              tags={[
                { name: 'PyQt', slug: '' },
                { name: 'REST', slug: '' },
                { name: 'Graphql', slug: '' },
                { name: 'QML', slug: '' },
              ]}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap md:justify-center justify-start md:text-sm text-xs gap-8 md:gap-12 items-center">
        <h3 className="flex items-center text-3xl font-semibold gap-4 w-full">
          <i className="fas fa-ship" />
          Skills in short
        </h3>
        <div className="text-center mb-2 md:mb-0">
          <SiCplusplus className="md:text-7xl text-5xl mb-2" />
          C++ 11/17
        </div>
        <div className="text-center mb-2">
          <SiRust className="md:text-7xl text-5xl mb-2" />
          Rust
        </div>
        <div className="text-center mb-2">
          <FaPython className="md:text-7xl text-5xl mb-2" />
          Python
        </div>
        <div className="text-center mb-2">
          <SiFastapi className="md:text-7xl text-5xl mb-2" />
          FastAPI
        </div>
        <div className="text-center mb-2">
          <SiPytest className="md:text-7xl text-5xl mb-2" />
          Pytest
        </div>
        <div className="text-center mb-2">
          <SiQt className="md:text-7xl text-5xl mb-2" />
          Qt
        </div>
        <div className="text-center mb-2">
          <SiSolidity className="md:text-7xl text-5xl mb-2" />
          Solidity
        </div>
        <div className="text-center mb-2">
          <FaNetworkWired className="md:text-7xl text-5xl mb-2" />
          TCP/IP
        </div>
        <div className="text-center mb-2">
          <SiSocketdotio className="md:text-7xl text-5xl mb-2" />
          Sockets
        </div>
        <div className="text-center mb-2">
          <SiWireshark className="md:text-7xl text-5xl mb-2" />
          Wireshark
        </div>
        <div className="text-center mb-2">
          <SiRos className="md:text-7xl text-5xl mb-2" />
          ROS
        </div>
        <div className="text-center mb-2">
          <GrReactjs className="md:text-7xl text-5xl mb-2" />
          ReactJS
        </div>
        <div className="text-center mb-2">
          <SiNextdotjs className="md:text-7xl text-5xl mb-2" />
          Next.JS
        </div>
        <div className="text-center mb-2">
          <IoLogoJavascript className="md:text-7xl text-5xl mb-2" />
          JS
        </div>
        <div className="text-center mb-2">
          <SiJest className="md:text-7xl text-5xl mb-2" />
          Jest
        </div>
        <div className="text-center mb-2">
          <SiPostgresql className="md:text-7xl text-5xl mb-2" />
          PostgreSQL
        </div>
        <div className="text-center mb-2">
          <SiGraphql className="md:text-7xl text-5xl mb-2" />
          GraphQL
        </div>
        <div className="text-center mb-2">
          <SiDocker className="md:text-7xl text-5xl mb-2" />
          Docker
        </div>
        <div className="text-center mb-2">
          <SiKubernetes className="md:text-7xl text-5xl mb-2" />
          Kubernetes
        </div>
        <div className="text-center mb-2">
          <SiApachespark className="md:text-7xl text-5xl mb-2" />
          PySpark
        </div>
        <div className="text-center mb-2">
          <SiApachekafka className="md:text-7xl text-5xl mb-2" />
          Kafka
        </div>
        <div className="text-center mb-2">
          <MdOutlineDesignServices className="md:text-7xl text-5xl mb-2" />
          Softw. Arch.
        </div>
        <div className="text-center mb-2">
          <SiMaterialdesign className="md:text-7xl text-5xl mb-2" />
          UML
        </div>
        <div className="text-center mb-2">
          <SiGit className="md:text-7xl text-5xl mb-2" />
          Git
        </div>
        <div className="text-center mb-2">
          <SiLinux className="md:text-7xl text-5xl mb-2" />
          Linux
        </div>
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
