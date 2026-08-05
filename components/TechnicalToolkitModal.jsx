import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTerminal, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../utils/LanguageContext';
import { skills } from '../utils/consts';

const skillGroups = [
  {
    titleKey: 'Architecture',
    defaultTitle: 'Architecture',
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
    titleKey: 'Architecture Modelling',
    defaultTitle: 'Architecture Modelling',
    names: ['ArchiMate', 'UML', 'C4 Model', 'Architecture Decision Records']
  },
  {
    titleKey: 'Languages',
    defaultTitle: 'Languages',
    names: ['C++ 11/17', 'Rust', 'Python', 'JavaScript', 'Solidity']
  },
  {
    titleKey: 'Frameworks & testing',
    defaultTitle: 'Frameworks & testing',
    names: ['Qt', 'ReactJS', 'Next.JS', 'FastAPI', 'Pytest', 'Jest']
  },
  {
    titleKey: 'Systems & networking',
    defaultTitle: 'Systems & networking',
    names: ['TCP/IP', 'Sockets', 'Wireshark', 'Linux']
  },
  {
    titleKey: 'Data & platforms',
    defaultTitle: 'Data & platforms',
    names: ['PostgreSQL', 'GraphQL', 'Docker', 'Kubernetes', 'PySpark', 'Kafka', 'Git']
  },
  {
    titleKey: 'Middleware',
    defaultTitle: 'Middleware',
    names: ['MQTT', 'gRPC', 'D-Bus', 'ROS']
  }
];

const normalizedName = (name) => {
  if (name === 'JS') return 'JavaScript';
  return name;
};

const groupedSkills = skillGroups.map((group) => ({
  ...group,
  items: group.names.map((name) => skills.find((skill) => normalizedName(skill.name) === name)).filter(Boolean)
}));

export default function TechnicalToolkitModal({ isOpen, setIsOpen }) {
  const { t } = useLanguage();

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-slate-950/80 backdrop-blur-md' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-3 text-center sm:p-6 lg:p-8'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-5xl transform overflow-y-auto max-h-[85vh] rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 md:p-8 text-left align-middle shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] transition-all'>
                <div className='flex items-center justify-between border-b border-slate-800 pb-5 sm:pb-6 mb-6 sm:mb-8 sticky top-0 bg-slate-900 z-10'>
                  <div className='flex items-center gap-3 sm:gap-4'>
                    <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-400 border border-orange-500/20 shadow-inner shrink-0'>
                      <FaTerminal className='text-lg sm:text-xl' />
                    </div>
                    <div>
                      <Dialog.Title
                        as='h2'
                        className='text-2xl sm:text-3xl font-Neuton font-bold tracking-wide text-white'
                      >
                        {t('introHighlight.toolkitTitle', 'Technical Toolkit')}
                      </Dialog.Title>
                      <p className='text-slate-400 text-xs sm:text-sm font-Monda mt-0.5 sm:mt-1'>
                        {t(
                          'introHighlight.toolkitDesc',
                          'Languages, frameworks, and architecture tools I work with daily.'
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className='rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none shrink-0 ml-2'
                  >
                    <FaTimes size={22} />
                  </button>
                </div>

                <div className='flex flex-col gap-8 sm:gap-10 px-1 sm:px-2 py-2'>
                  {groupedSkills.map((category) => (
                    <div key={category.titleKey} className='flex flex-col'>
                      <h3 className='text-base sm:text-lg font-Monda font-bold text-slate-300 mb-4 sm:mb-6 uppercase tracking-widest border-b border-slate-800/50 pb-2'>
                        {t(`introHighlight.groups.${category.titleKey}`, category.defaultTitle)}
                      </h3>
                      <div className='flex flex-wrap gap-x-6 gap-y-6 sm:gap-x-10 sm:gap-y-10 md:gap-x-12'>
                        {category.items.map((item) => (
                          <div
                            key={item.name}
                            className='group flex flex-col items-center justify-start w-20 sm:w-28 text-center transition-transform hover:-translate-y-1'
                          >
                            <div className='text-slate-400 transition-colors duration-300 group-hover:text-orange-400 drop-shadow-md'>
                              <item.icon className='text-4xl sm:text-5xl mb-3 sm:mb-4' />
                            </div>
                            <span className='font-Monda text-[11px] sm:text-sm font-semibold tracking-wider text-slate-500 group-hover:text-slate-200 leading-tight'>
                              {normalizedName(item.name)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-8 sm:mt-12 flex justify-end sticky bottom-0 bg-slate-900 pt-4 border-t border-slate-800 z-10'>
                  <button
                    type='button'
                    className='inline-flex justify-center items-center rounded-lg sm:rounded-xl border border-transparent bg-orange-600 px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-Monda font-bold text-white hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all shadow-lg hover:shadow-orange-500/25'
                    onClick={closeModal}
                  >
                    Close Toolkit
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
