import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { skills } from '@utils/consts';

const profileBlocks = [
  `## 18+ years across demanding domains

Experience stretches across medical devices, high-frequency trading, autonomous driving, microservices, embedded systems, and network programming. It is an unusual mix, but that variety makes it easier to spot patterns, ask sharper questions, and adapt proven ideas to new problems.`,
  `### Still hands-on

Architecture has never meant stepping away from implementation. Strong working knowledge of C, modern C++, MATLAB, Rust, and Python keeps technical decisions realistic—especially for embedded, performance-sensitive, and systems-level software.`,
  `### From the wire to the platform

The technical range runs from TCP/IP, SOME/IP, DHCP, SNMP, IPv4/6, CAN, and proprietary protocols to FastAPI, Actix Web, gRPC, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, Ansible, and Argo CD.`,
  `## More than design documents

The work covers the full path from algorithm development and model-based software to vehicle dynamics, system testing, integration, and delivery. Experience with both Agile and V-model development helps bridge fast-moving teams and rigorously controlled engineering environments.`,
  `## Practical, positive, and solution-focused

Complex challenges are approached with curiosity, resourcefulness, and a calm focus on finding a workable solution. The goal is not simply to propose an architecture, but to help teams turn it into software that is robust, understandable, and ready to evolve.`
];

const skillGroups = [
  {
    title: 'Architecture',
    names: [
      'Microservices Architecture',
      'Domain-Driven Design',
      'Network Architecture',
      'System Design',
      'Distributed Systems',
      'Legacy Modernization'
    ]
  },
  {
    title: 'Architecture Modelling',
    names: ['ArchiMate', 'UML', 'C4 Model', 'Architecture Decision Records']
  },
  {
    title: 'Languages',
    names: ['C++ 11/17', 'Rust', 'Python', 'JavaScript', 'Solidity']
  },
  {
    title: 'Frameworks & testing',
    names: ['Qt', 'ReactJS', 'Next.JS', 'FastAPI', 'Pytest', 'Jest', 'Material Design']
  },
  {
    title: 'Systems & networking',
    names: ['TCP/IP', 'Sockets', 'Wireshark', 'Linux']
  },
  {
    title: 'Data & platforms',
    names: ['PostgreSQL', 'GraphQL', 'Docker', 'Kubernetes', 'PySpark', 'Kafka', 'Git']
  },
  {
    title: 'Middleware',
    names: ['MQTT', 'gRPC', 'D-Bus', 'ROS']
  }
];

const normalizedName = (name) => {
  if (name === 'JS') return 'JavaScript';
  if (name === 'Materialdesign') return 'Material Design';
  return name;
};

const groupedSkills = skillGroups.map((group) => ({
  ...group,
  items: group.names.map((name) => skills.find((skill) => normalizedName(skill.name) === name)).filter(Boolean)
}));

const MarkdownHeading2 = ({ children }) => (
  <h3 className='mb-3 mt-0 font-Neuton text-2xl font-semibold leading-tight md:text-3xl'>{children}</h3>
);

const MarkdownHeading3 = ({ children }) => (
  <h4 className='mb-2 mt-0 font-Monda text-lg font-semibold leading-snug'>{children}</h4>
);

const MarkdownParagraph = ({ children }) => (
  <p className='mb-0 leading-relaxed text-slate-700 dark:text-slate-100'>{children}</p>
);

const MarkdownList = ({ children }) => (
  <ul className='mb-0 mt-3 space-y-2 pl-5 text-slate-700 marker:text-current dark:text-slate-100'>{children}</ul>
);

const markdownComponents = {
  h2: MarkdownHeading2,
  h3: MarkdownHeading3,
  p: MarkdownParagraph,
  ul: MarkdownList
};

const ContentBlock = ({ children, className = '' }) => (
  <div className={`border-l-2 border-slate-300 pl-5 dark:border-slate-400 ${className}`}>
    <ReactMarkdown components={markdownComponents}>{children}</ReactMarkdown>
  </div>
);

const IntroHighlight = ({ classProps = '' }) => {
  const contentBlocks = profileBlocks;

  return (
    <section aria-labelledby='profile-highlights-title' className={`${classProps} relative py-14 md:py-20`}>
      <div className='mx-auto w-full max-w-[1048px] px-4 lg:px-8'>
        <header className='mx-auto mb-12 max-w-3xl text-center md:mb-16'>
          <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300'>
            Experience in practice
          </p>
          <h2
            id='profile-highlights-title'
            className='mb-4 font-Neuton text-4xl font-semibold leading-tight md:text-5xl'
          >
            Profile Highlights
          </h2>
          <p className='mx-auto mb-0 max-w-2xl text-slate-600 dark:text-slate-200'>
            A career shaped by complex systems, hands-on development, and the kind of technical variety that keeps the
            work interesting.
          </p>
        </header>

        <div className='grid items-center gap-8 border-b border-slate-200 pb-12 dark:border-slate-400 md:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:pb-16'>
          <div className='relative aspect-[4/3] w-full overflow-hidden rounded-xl'>
            <Image
              src='/blank-2.jpeg'
              alt='Software development workspace with source code displayed on a laptop'
              fill
              className='object-cover'
              sizes='(max-width: 1023px) 100vw, 42vw'
            />
          </div>
          <div className='space-y-8'>
            <ContentBlock>{contentBlocks[0]}</ContentBlock>
            <ContentBlock>{contentBlocks[1]}</ContentBlock>
            <ContentBlock>{contentBlocks[2]}</ContentBlock>
          </div>
        </div>

        <div className='grid gap-8 border-b border-slate-200 py-12 dark:border-slate-400 md:gap-10 lg:grid-cols-2 lg:py-16'>
          <ContentBlock>{contentBlocks[3]}</ContentBlock>
          <ContentBlock>{contentBlocks[4]}</ContentBlock>
        </div>

        <div id='skills' className='scroll-mt-24 pt-12 lg:pt-16'>
          <div className='mb-9 max-w-2xl'>
            <h3 className='mb-3 font-Neuton text-3xl font-semibold md:text-4xl'>Technical toolkit</h3>
            <p className='mb-0 text-slate-600 dark:text-slate-200'>
              Languages, platforms, and engineering tools used across real products and very different technical
              environments.
            </p>
          </div>

          <div className='divide-y divide-slate-200 dark:divide-slate-400'>
            {groupedSkills.map((group) => (
              <section
                key={group.title}
                aria-labelledby={`skill-group-${group.title.replaceAll(' ', '-').replace('&', 'and').toLowerCase()}`}
                className='grid gap-4 py-6 first:pt-0 md:grid-cols-[12rem_1fr] md:gap-8'
              >
                <h4
                  id={`skill-group-${group.title.replaceAll(' ', '-').replace('&', 'and').toLowerCase()}`}
                  className='m-0 font-Monda text-base font-semibold'
                >
                  {group.title}
                </h4>
                <ul className='m-0 grid list-none grid-cols-2 gap-x-5 gap-y-5 p-0 sm:grid-cols-3 lg:grid-cols-4'>
                  {group.items.map((skill) => (
                    <li key={skill.name} className='flex min-w-0 items-center gap-2.5 text-sm sm:text-base'>
                      <skill.icon aria-hidden='true' className='shrink-0 text-lg' />
                      <span className='min-w-0 leading-tight'>{normalizedName(skill.name)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroHighlight;
