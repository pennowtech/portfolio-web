/* eslint-disable max-len */
import React from 'react';
import Image from 'next/image';
import { Link as ScrollLink } from 'react-scroll';
import { FaCodepen, FaLaptopCode } from 'react-icons/fa';
import { GrStackOverflow } from 'react-icons/gr';

/*
I'm a full-stack developer and San Antonio native with a drive to create and a hunger to learn. I've got a passion for narrative, an eye for aesthetics, and a curisoity that is never satisfied, alongside an arsenal of skills and smarts that can push limits and solve problems in a snap.

Outside of the tech world, I can be caught drawing, cooking, playing video games, or running a game of DnD with friends. I'm also a published writer, a freelance illustrator, a hobbyist game developer, and an irrepressible baker. I enjoy inunduating people with baked goods and taking pictures of my cat.
*/
const AboutSection = () => (
  <div className="block  -mb-20">
    <section className="relative block h-96">
      <div
        className="absolute top-0 w-full h-full bg-center bg-cover"
        style={{
          backgroundImage: "url('/top-back-4.jpg')",
        }}
      >
        <span
          id="blackOverlay"
          className="w-full h-full absolute opacity-50 bg-black"
        />
      </div>
      <div
        className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-24"
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
            className="text-slate-50 dark:text-gray-600 fill-current"
            points="2560 0 2560 100 0 100"
          />
        </svg>
      </div>
    </section>
    <section className="relative py-16 bg-blueGray-200">
      <div className="container lg:mx-auto ">
        <div className="relative flex flex-col min-w-0 break-words bg-white dark:bg-gray-500 w-full mb-6 shadow-xl rounded-lg -mt-64">
          <div className="px-6">
            <div className="flex flex-wrap justify-center">
              <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                <div className="-mt-16">
                  <Image
                    alt="..."
                    src="/Logo.png"
                    width={150}
                    height={150}
                    className="shadow-none rounded-full w-auto h-auto align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 bg-white dark:bg-slate-500"
                  />
                </div>
              </div>
              <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center text-center">
                <div className="py-6 mx-auto px-3 mt-0 inline-block">
                  <ScrollLink
                    activeClass="active"
                    to="contact"
                    spy
                    smooth
                    offset={-100}
                    duration={1000}
                  >
                    <div
                      className="bg-gray-700 active:bg-gray-600 uppercase cursor-pointer text-slate-200 font-bold hover:shadow-md shadow text-xs px-4 py-2 rounded outline-none focus:outline-none sm:mr-2 mb-1 ease-linear transition-all duration-150"
                      type="button"
                    >
                      Connect
                    </div>
                  </ScrollLink>
                </div>
              </div>
              <div className="w-full lg:w-4/12 px-4 lg:order-1">
                <div className="flex justify-center py-4 lg:pt-4 pt-8">
                  <div className="mr-4 p-3 text-center">
                    <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                      22
                    </span>
                    <span className="text-sm">Articles</span>
                  </div>
                  <div className="mr-4 p-3 text-center">
                    <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                      10
                    </span>
                    <span className="text-sm">Photos</span>
                  </div>
                  <div className="lg:mr-4 p-3 text-center">
                    <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                      89
                    </span>
                    <span className="text-sm">Comments</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-0">
              <h3 className="text-4xl font-semibold leading-normal mb-2">
                Sukhdeep Singh
              </h3>
              <div className="text-sm leading-normal mt-0 mb-2 font-bold uppercase">
                <i className="fas fa-map-marker-alt mr-2 text-lg" />
                Germany
              </div>
              <div className="mb-2 font-bold text-gray-500 dark:text-slate-200 mt-2">
                <i className="fas fa-briefcase mr-2 text-lg" />
                Senior Solution Architect
              </div>
            </div>
            <div className="py-10 border-t border-blueGray-200 text-center max-w-screen-md mx-auto">
              <div className="flex flex-wrap justify-center">
                <div className="w-full lg:w-10/12 px-4">
                  <div className="mb-4 text-base font-Roboto leading-relaxed">
                    <ul className="list-none text-left">
                      <li className="mb-4">
                        <i className="fas fa-handshake mr-2 text-base" />
                        Hey
                        there! It&apos;s great to meet you. I&apos;m excited to
                        tell you a bit about my background as a Software
                        Architect.
                      </li>
                      <li className="mb-4">
                        <GrStackOverflow className="inline-block mr-2" />
                        I&apos;ve over 15 years of experience in various
                        technologies. A few of them includes Medical devices,
                        Automative, Satellite communications, Embedded systems,
                        Network programming, and Data analytics.
                      </li>
                      <li>
                        <i className="fas fa-briefcase mr-2 text-base" />
                        I&apos;m experienced in all phases of the SDLC and Agile
                        modeling: design, development, testing, and management.
                      </li>
                      <li>
                        <i className="fas fa-code mr-2 text-base" />
                        In addition
                        to my vast experience in Architecture & Design, I also
                        have a strong development background in C++, Python, and
                        JavaScript.
                      </li>
                      <li>
                        <FaCodepen className="inline-block mr-2" />
                        I&apos;m passionate about implementing high-quality,
                        scalable software solutions.
                      </li>
                      <li>
                        <i className="fas fa-plane mr-2 text-base" />
                        {' '}
                        This
                        website is all about my technical and travelling life.
                        Yes, I like traveling a lot.
                      </li>
                    </ul>
                  </div>

                  <ScrollLink
                    activeClass="active"
                    to="about-me"
                    spy
                    smooth
                    offset={-100}
                    duration={500}
                  >
                    <div className="button w-36 mx-auto">Show more</div>
                  </ScrollLink>
                </div>
                <div className="mb-2 font-bold text-gray-500 dark:text-slate-200 mt-10">
                    <i className="fas fa-briefcase mr-2 text-lg"/>
                    Senior Solution Architect
                </div>
                <div className="mb-2 font-Barlow text-gray-500 dark:text-slate-200">
                    <i className="fas fa-university mr-2 text-lg"/>
                    Technology and Travel are my passion.
                </div>
            </div>
            <div className="py-10 border-t border-blueGray-200 text-center max-w-screen-md mx-auto">
              <div className="flex flex-wrap justify-center">
                <div className="w-full lg:w-10/12 px-4">
                  <div className="mb-4 text-base font-Roboto leading-relaxed">
                    <ul className="list-none text-left">
                      <li className="mb-4">
                        <i className="fas fa-handshake mr-2 text-base" />
                        Hey
                        there! It&apos;s great to meet you. I&apos;m excited to
                        tell you a bit about my background as a Software
                        Architect.
                      </li>
                      <li className="mb-4">
                        <GrStackOverflow className="inline-block mr-2" />
                        I&apos;ve over 15 years of experience in various
                        technologies. A few of them includes Medical devices,
                        Automative, Satellite communications, Embedded systems,
                        Network programming, and Data analytics.
                      </li>
                      <li>
                        <i className="fas fa-briefcase mr-2 text-base" />
                        I&apos;m experienced in all phases of the SDLC and Agile
                        modeling: design, development, testing, and management.
                      </li>
                      <li>
                        <i className="fas fa-code mr-2 text-base" />
                        In addition
                        to my vast experience in Architecture & Design, I also
                        have a strong development background in C++, Python, and
                        JavaScript.
                      </li>
                      <li>
                        <FaCodepen className="inline-block mr-2" />
                        I&apos;m passionate about implementing high-quality,
                        scalable software solutions.
                      </li>
                      <li>
                        <i className="fas fa-plane mr-2 text-base" />
                        {' '}
                        This
                        website is all about my technical and travelling life.
                        Yes, I like traveling a lot.
                      </li>
                    </ul>
                  </div>

                  <ScrollLink
                    activeClass="active"
                    to="about-me"
                    spy
                    smooth
                    offset={-100}
                    duration={500}
                  >
                    <div className="button w-36 mx-auto">Show more</div>
                  </ScrollLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default AboutSection;
