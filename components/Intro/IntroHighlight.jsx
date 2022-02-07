/* eslint-disable max-len */
import React from 'react';

import Link from 'next/link';
import { GrReactjs, GrSystem } from 'react-icons/gr';
import {
  SiNextdotjs, SiCplusplus, SiQt, SiSolidity, SiRos, SiSocketdotio, SiDocker, SiKubernetes, SiApachespark, SiApachekafka, SiWireshark, SiGit, SiPytest, SiPostgresql, SiMaterialdesign, SiDesignernews, SiJest, SiGraphql, SiFastapi, SiLinux,
} from 'react-icons/si';
import { IoLogoJavascript, IoMdBuild } from 'react-icons/io';
import {
  MdDesignServices, MdOutlineDesignServices, MdOutlineDeveloperMode, MdOutlineStickyNote2,
} from 'react-icons/md';
import Image from 'next/image';
import {
  BsHddNetwork, BsLayoutTextWindow, BsListCheck, BsTools,
} from 'react-icons/bs';
import { FiDatabase } from 'react-icons/fi';
import {
  FaDatabase, FaDraftingCompass, FaNetworkWired, FaPython,
} from 'react-icons/fa';
import PostTags from '../Post/PostTags';
import TechCard from './TechCard';
import ProfileCard from './ProfileCard';

const IntroHighlight = () => (
  <section className="mt-48 md:mt-10 pb-24 relative ">
    <div className="container mx-auto">
      <h2 className="mt-4 mb-0 font-Monda  underline-offset-2 mx-auto justify-center text-center">Profile Highlights</h2>
      <div className="flex flex-wrap items-center">
        <div className="w-10/12 md:w-4/12 md:px-4 mx-auto lg:text-base mt-16">
          <ProfileCard
            text="I worked in a lot of technology sectors ranging from embedded systems, networking devices, satellite communications, automotive, and robotics. Designed and developed over 30 advanced applications from use cases and functional requirements. "
            thumbnailUrl="/blank-2.jpeg"
          />
        </div>

        <div className="w-full text-base leading-8 md:w-7/12 p-4 md:mt-16">
          <div className="flex flex-wrap">
            <div className="w-full md:w-6/12 px-4">
              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-lg font-bold font-Merriweather items-center">
                  <SiCplusplus />
                  <div className="ml-4">
                    Programming Languages
                  </div>
                </div>
                <p className="mb-4">
                  Extensively worked with C++11/14/17, Python, FastAPI, ReactJS.
                </p>
              </div>

              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-lg font-bold font-Merriweather items-center">
                  <BsHddNetwork />
                  <div className="ml-4">
                    Network Programming
                  </div>
                </div>
                <p className="mb-4">
                  Worked with various networking protocols, like
                  &nbsp;TCP, IPV4, IPv6, DHCP, SNMP, ARP, etc.
                </p>
              </div>
            </div>
            <div className="w-full md:w-6/12 px-4">
              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-lg font-bold font-Merriweather items-center">
                  <BsTools />
                  <div className="ml-4">
                    Performance Monitoring
                  </div>
                </div>
                <p className="mb-4">
                  Experience with performance monitoring tools like iperf, strace, ltrace, gprof, valgrind, etc.
                </p>
              </div>

              <div className="relative flex flex-col min-w-0 mb-8">
                <div className="flex text-lg font-bold font-Merriweather items-center">
                  <GrSystem />
                  <div className="ml-4">
                    System Programming
                  </div>
                </div>
                <p className="mb-4">
                  Implemented many solutions based on IPCs (Sockets, Pipes, Threads, Shared Memory, Mutex, and Semaphores).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-16">
      <div className="items-center flex flex-wrap">
        <div className="w-full md:w-7/12 ml-auto px-12 md:px-4">
          <div className="md:pr-12">
            <div className="p-3 text-center inline-flex items-center justify-center w-16 h-16 shadow-lg rounded-full bg-white dark:bg-gray-500">
              <MdOutlineDesignServices />
            </div>
            <h3 className="text-3xl font-semibold">
              Software Architecture & Design
            </h3>
            <div className="mt-4">
              Technical abilities to develop accurate software blueprints and determine design choices.
            </div>
            <ul className="list-none mt-6">
              <li className="py-2">
                <div className="flex text-base items-center">
                  <BsListCheck />
                  <div className="ml-4">
                    Defining product requirements
                  </div>
                </div>
                {' '}

              </li>
              <li className="py-2">
                <div className="flex text-base items-center">
                  <MdOutlineStickyNote2 />
                  <div className="ml-4">
                    High-level architectural specifications
                  </div>
                </div>
              </li>
              <li className="py-2">
                <div className="flex text-base items-center">
                  <IoMdBuild />
                  <div className="ml-4">
                    Content integration and delivery (CI/CD) systems
                  </div>
                </div>
              </li>
            </ul>
            <div className="block pb-6">
              <PostTags tags={[{ name: 'UML', slug: '' }, { name: 'Archimate', slug: '' }, { name: 'TOGAF', slug: '' }]} />
            </div>
          </div>
        </div>

        <div className="w-full md:w-4/12 mr-auto px-4 pt-4 md:pt-0">
          <div
            className="shadow-xl relative h-48 lg:h-56"
            style={{
              transform:
                    'perspective(1040px) rotateY(-11deg) rotateX(2deg) rotate(2deg)',
            }}
          >
            <Image layout="fill" src="/blank.jpg" className="rounded-lg " />
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto overflow-hidden pb-2">
      <div className="flex flex-wrap items-center">
        <div className="w-full md:w-4/12 lg:w-4/12 px-4 mr-auto ml-auto mt-8">
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

        <div className="w-full md:w-7/12 px-12 md:px-4 ml-auto mr-auto md:mt-12">
          <div className="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white dark:bg-gray-500">
            <FaDraftingCompass />
          </div>
          <h3 className="text-3xl mb-2 my-2 font-semibold leading-normal">
            User Interface Design
          </h3>
          <p className="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-600">
            In order to create a great User Experience, implemented applications and solutions using a range of technologies and programming languages.
          </p>
          <ul className="list-none mt-6">

            <li className="py-2">
              <div className="flex text-base items-center">
                <MdOutlineDeveloperMode />
                <div className="ml-4">
                  Full-Stack Web Development
                </div>
              </div>
            </li>
            <li className="py-2">
              <div className="flex text-base items-center">
                <BsLayoutTextWindow />
                <div className="ml-4">
                  Desktop based UIs in Qt/QML
                </div>
              </div>
            </li>
            <li className="py-2">
              <div className="flex text-base items-center">
                <FiDatabase />
                <div className="ml-4">
                  Databases: PostgreSQL and Redis
                </div>
              </div>
            </li>
            {' '}

          </ul>
          <div className="block pb-6">
            <PostTags tags={[{ name: 'PyQt', slug: '' }, { name: 'REST', slug: '' }, { name: 'Graphql', slug: '' }]} />
          </div>
        </div>
      </div>
    </div>
    <div className="container mx-auto px-4 pb-24">
      <div className="items-center flex md:text-sm text-xs flex-wrap md:gap-12 gap-8">
        <h2 className="w-full">Skills in short</h2>
        <div className="text-center mb-2">
          <SiCplusplus className="md:text-7xl text-5xl mb-2" />
          C++ 11/17
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
