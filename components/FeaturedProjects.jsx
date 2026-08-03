import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowUpRightFromSquare, FaCheck, FaLock } from 'react-icons/fa6';
import { useLanguage } from '../utils/LanguageContext';

const TechnologyList = ({ project }) => (
  <ul aria-label={`${project.title} technologies`} className='m-0 flex list-none flex-wrap gap-2 p-0'>
    {project.technologies.map((technology) => (
      <li
        key={technology}
        className='rounded-full border border-slate-200 px-2.5 py-1 font-Monda text-xs font-semibold text-slate-600 dark:border-slate-500 dark:text-slate-200'
      >
        {technology}
      </li>
    ))}
  </ul>
);

const ProjectAction = ({ project, t }) =>
  project.href ? (
    <Link
      href={project.href}
      target='_blank'
      rel='noopener noreferrer'
      className='inline-flex min-h-11 items-center font-Monda text-sm font-bold text-green-700 transition hover:text-green-600 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:text-green-400 dark:hover:text-green-300'
    >
      {t('projects.exploreGithub', 'Explore on GitHub')}
      <FaArrowUpRightFromSquare aria-hidden='true' className='ml-2' />
    </Link>
  ) : (
    <p className='mb-0 flex min-h-11 items-center font-Monda text-sm font-semibold text-slate-500 dark:text-slate-300'>
      <FaLock aria-hidden='true' className='mr-2' />
      {t('projects.privateDevelopment', 'Private product development')}
    </p>
  );

const ProjectImage = ({ project, featured = false }) => (
  <div
    className={`relative overflow-hidden ${featured ? 'aspect-[16/9] lg:aspect-auto lg:min-h-[29rem]' : 'aspect-[16/9]'}`}
  >
    <Image
      src={project.image}
      alt={project.imageAlt}
      fill
      sizes={featured ? '(max-width: 1023px) 100vw, 60vw' : '(max-width: 767px) 100vw, 50vw'}
      className='m-0 object-cover object-top transition duration-500 group-hover:scale-[1.025]'
    />
    <div className='absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/85 to-transparent' />
    <span className='absolute bottom-4 left-4 rounded-full border border-white/40 bg-slate-950/75 px-3 py-1 font-Monda text-xs font-semibold text-white backdrop-blur-sm'>
      {project.label}
    </span>
  </div>
);

const FeaturedProject = ({ project, t }) => (
  <article className='not-prose group grid min-w-0 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md transition duration-200 hover:border-slate-400 hover:shadow-xl dark:border-slate-500 dark:bg-gray-700 dark:hover:border-slate-400 lg:grid-cols-[1.2fr_0.8fr]'>
    <ProjectImage project={project} featured />
    <div className='flex flex-col justify-center p-6 md:p-8 lg:p-9'>
      <p className='mb-2 font-Monda text-xs font-bold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-400'>
        {t('projects.featuredLabel', 'Featured project')}
      </p>
      <h3 className='mb-4 mt-0 font-Neuton text-3xl font-semibold leading-tight md:text-4xl'>{project.title}</h3>
      <p className='mb-6 text-base leading-relaxed text-slate-600 dark:text-slate-200'>{project.description}</p>

      <ul className='mb-6 mt-0 grid list-none gap-2.5 p-0 text-sm text-slate-700 dark:text-slate-100'>
        {project.highlights.map((highlight) => (
          <li key={highlight} className='flex items-start gap-2.5'>
            <FaCheck aria-hidden='true' className='mt-1 shrink-0 text-green-700 dark:text-green-400' />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <TechnologyList project={project} />
      <div className='mt-6'>
        <ProjectAction project={project} t={t} />
      </div>
    </div>
  </article>
);

const SupportingProject = ({ project, t }) => (
  <article className='not-prose group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-500 dark:bg-gray-700 dark:hover:border-slate-400'>
    <ProjectImage project={project} />
    <div className='flex flex-1 flex-col p-5 md:p-6'>
      <h3 className='mb-3 mt-0 font-Neuton text-2xl font-semibold leading-tight md:text-3xl'>{project.title}</h3>
      <p className='mb-5 text-base leading-relaxed text-slate-600 dark:text-slate-200'>{project.description}</p>
      <div className='mt-auto'>
        <TechnologyList project={project} />
        <div className='mt-5'>
          <ProjectAction project={project} t={t} />
        </div>
      </div>
    </div>
  </article>
);

const FeaturedProjects = () => {
  const { t } = useLanguage();

  const projects = [
    {
      title: t('projects.rustyCanStudio.title', 'Rusty CAN Studio'),
      image: '/projects/rusty-can-studio.jpg',
      imageAlt: t(
        'projects.rustyCanStudio.imageAlt',
        'Engineering workstation visualizing CAN bus traffic and embedded network signals'
      ),
      description: t(
        'projects.rustyCanStudio.description',
        'A desktop engineering workbench that turns complex CAN and CAN-FD traffic into inspectable, decodable, and repeatable workflows—without requiring a custom tool for every test scenario.'
      ),
      technologies: ['Rust', 'Tauri', 'React', 'TypeScript', 'CAN-FD'],
      highlights: t('projects.rustyCanStudio.highlights', [
        'Live and offline trace analysis',
        'Profile-driven protocol decoding',
        'Repeatable test simulation'
      ]),
      href: 'https://github.com/pennowtech/rusty-can-studio',
      label: t('projects.rustyCanStudio.label', 'Flagship engineering tool')
    },
    {
      title: t('projects.lingora.title', 'Lingora'),
      image: '/projects/lingora.png',
      imageAlt: t(
        'projects.lingora.imageAlt',
        'Cross-platform language learning system with connected semantic concepts and review cards'
      ),
      description: t(
        'projects.lingora.description',
        'An AI-native, local-first language platform built around German morphology, contextual meaning clusters, validated generation, and FSRS-based review across mobile and desktop.'
      ),
      technologies: ['React Native', 'Tauri', 'SQLite', 'TypeScript', 'AI'],
      href: 'https://github.com/pennowtech/Lingora',
      label: t('projects.lingora.label', 'AI architecture')
    },
    {
      title: t('projects.shelfie.title', 'Shelfie'),
      image: '/projects/shelfie.jpg',
      imageAlt: t(
        'projects.shelfie.imageAlt',
        'Offline-first digital library with reading, annotation, vocabulary, and synchronization tools'
      ),
      description: t(
        'projects.shelfie.description',
        'A mature offline-first Android library and eBook reader with lending, annotations, vocabulary practice, privacy-aware AI assistance, and conflict-safe optional synchronization.'
      ),
      technologies: ['React Native', 'Expo', 'WatermelonDB', 'Firebase'],
      label: t('projects.shelfie.label', 'Product engineering'),
      isPrivate: true
    }
  ];

  const [featuredProject, ...supportingProjects] = projects;

  return (
    <section aria-labelledby='projects-title' className='relative py-14 md:py-20'>
      <div className='mx-auto w-full max-w-[1048px] px-4 lg:px-8'>
        <header className='mx-auto mb-10 max-w-3xl text-center md:mb-12'>
          <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300'>
            {t('projects.subtitle', 'Selected work')}
          </p>
          <h2 id='projects-title' className='mb-3 font-Neuton text-4xl font-semibold leading-tight md:text-5xl'>
            {t('projects.title', 'Projects built around real problems')}
          </h2>
          <p className='mx-auto mb-0 max-w-2xl text-slate-600 dark:text-slate-200'>
            {t(
              'projects.desc',
              'Three products that bring together systems thinking, hands-on engineering, and architecture designed to hold up beyond the first release.'
            )}
          </p>
        </header>

        <FeaturedProject project={featuredProject} t={t} />

        <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:gap-8'>
          {supportingProjects.map((project) => (
            <SupportingProject key={project.title} project={project} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
