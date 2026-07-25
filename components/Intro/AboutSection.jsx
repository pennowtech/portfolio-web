import React from 'react';
import Image from 'next/image';
import { Link as ScrollLink } from 'react-scroll';
import { FaCode, FaCubes, FaLightbulb, FaMicrochip, FaNetworkWired } from 'react-icons/fa';

const professionalFacts = [
  { value: '18+', label: 'Years of experience' },
  { value: '6', label: 'Technical domains' },
  { value: '5', label: 'Core languages' }
];

const profileHighlights = [
  {
    icon: FaCubes,
    text: 'More than 18 years of architecture and engineering experience across medical devices, high-frequency trading, autonomous driving, microservices, embedded systems, and network protocols.'
  },
  {
    icon: FaCode,
    text: 'Hands-on development expertise spanning C, modern C++, MATLAB, Rust, and Python, with particular depth in embedded C++ and performance-sensitive software.'
  },
  {
    icon: FaMicrochip,
    text: 'Dependable service and data-platform design using FastAPI, Actix Web, gRPC, PostgreSQL, MongoDB, Redis, SQLAlchemy, and Diesel.'
  },
  {
    icon: FaNetworkWired,
    text: 'Systems expertise covering Docker, Kubernetes, Ansible, Argo CD, TCP/IP, SOME/IP, DHCP, SNMP, IPv4/6, CAN, and proprietary protocols.'
  },
  {
    icon: FaLightbulb,
    text: 'A solution-focused approach to turning complex requirements into robust software that teams can confidently operate, maintain, and evolve.'
  }
];

const handleKeyboardActivation = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.currentTarget.click();
  }
};

const AboutSection = ({ classProps = '' }) => (
  <section aria-labelledby='profile-hero-title' className={`${classProps} relative isolate pb-12 md:pb-16`}>
    <div className='relative h-72 overflow-hidden md:h-96'>
      <div
        aria-hidden='true'
        className='absolute inset-0 bg-cover bg-center'
        style={{ backgroundImage: "url('/top-back-4.jpg')" }}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-slate-950/45 to-slate-950/70' />
      </div>
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden md:h-24'>
        <svg
          aria-hidden='true'
          className='absolute bottom-0 h-full w-full'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='none'
          viewBox='0 0 2560 100'
        >
          <polygon className='fill-current text-white dark:text-gray-600' points='2560 0 2560 100 0 100' />
        </svg>
      </div>
    </div>

    <div className='relative z-10 mx-auto -mt-28 w-full max-w-[1048px] px-4 md:-mt-36 lg:px-8'>
      <article className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-500 dark:bg-gray-600'>
        <div className='px-5 md:px-8'>
          <div className='flex justify-center'>
            <div className='-mt-16 size-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-gray-600 dark:bg-slate-500 md:-mt-20 md:size-40'>
              <Image
                alt='TechishDeep profile mark'
                src='/Logo.png'
                width={160}
                height={160}
                className='h-full w-full object-cover'
              />
            </div>
          </div>

          <header className='mx-auto mt-4 max-w-3xl text-center md:mt-5'>
            <p className='mb-2 font-Monda text-sm font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400'>
              Technical Architect
            </p>
            <h1 id='profile-hero-title' className='mb-2 font-Neuton text-4xl font-semibold leading-tight md:text-5xl'>
              Sukhdeep Singh
            </h1>
            <p className='m-0 font-Monda text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-200'>
              Germany · Architecture, systems and software engineering
            </p>
          </header>
        </div>

        <dl
          aria-label='Professional experience at a glance'
          className='mt-7 grid grid-cols-3 bg-slate-900 px-2 py-5 text-white dark:bg-slate-950 sm:px-8'
        >
          {professionalFacts.map((fact) => (
            <div
              key={fact.label}
              className='flex min-w-0 flex-col items-center justify-center border-r border-white/20 px-2 text-center last:border-r-0 sm:px-6'
            >
              <dt className='order-2 mt-1 w-full text-center font-Monda text-[0.62rem] font-semibold uppercase leading-tight tracking-wide text-slate-300 sm:text-xs'>
                {fact.label}
              </dt>
              <dd className='order-1 m-0 w-full text-center font-Rajdhani text-3xl font-bold leading-none text-orange-400 sm:text-4xl'>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className='mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-10'>
          <div className='mb-7 text-center'>
            <h2 className='mb-2 font-Neuton text-3xl font-semibold md:text-4xl'>
              Designing systems that hold up in the real world
            </h2>
            <p className='mx-auto mb-0 max-w-2xl text-slate-600 dark:text-slate-200'>
              Architecture grounded in hands-on engineering, broad domain knowledge, and a practical focus on reliable
              delivery.
            </p>
          </div>

          <ul className='m-0 grid list-none gap-4 p-0 md:gap-5'>
            {profileHighlights.map((highlight) => (
              <li
                key={highlight.text}
                className='grid grid-cols-[1.75rem_1fr] items-start gap-3 border-b border-slate-200 pb-4 text-left last:border-b-0 last:pb-0 dark:border-slate-500 sm:grid-cols-[2rem_1fr] sm:gap-4'
              >
                <span className='flex justify-center pt-1.5 text-lg text-slate-700 dark:text-slate-100'>
                  <highlight.icon aria-hidden='true' />
                </span>
                <span className='leading-relaxed text-slate-700 dark:text-slate-100'>{highlight.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className='flex flex-col items-stretch justify-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-6 dark:border-slate-500 dark:bg-slate-700/35 sm:flex-row sm:items-center'>
          <ScrollLink
            to='contact'
            spy
            smooth
            offset={-100}
            duration={800}
            role='button'
            tabIndex={0}
            onKeyDown={handleKeyboardActivation}
            className='flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-blue-700 px-6 py-3 font-Monda font-bold text-white shadow transition hover:bg-blue-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus-visible:ring-offset-gray-600'
          >
            Get in touch
          </ScrollLink>
          <ScrollLink
            to='about-me'
            spy
            smooth
            offset={-100}
            duration={500}
            role='button'
            tabIndex={0}
            onKeyDown={handleKeyboardActivation}
            className='flex min-h-11 cursor-pointer items-center justify-center rounded-lg border-2 border-orange-500 px-6 py-3 font-Monda font-bold text-slate-800 transition hover:bg-orange-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:text-slate-100 dark:focus-visible:ring-offset-gray-600'
          >
            View full profile
          </ScrollLink>
        </div>
      </article>
    </div>
  </section>
);

export default AboutSection;
