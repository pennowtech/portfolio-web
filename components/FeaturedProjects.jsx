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
        className='rounded-full border border-slate-300 bg-slate-100/80 px-3 py-1 font-Monda text-xs font-bold text-slate-700 shadow-xs dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200'
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
      className='inline-flex min-h-11 items-center justify-center rounded-xl bg-green-700 px-5 font-Monda text-sm font-bold text-white shadow-md transition duration-200 hover:bg-green-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 dark:bg-green-600 dark:hover:bg-green-500'
    >
      {t('projects.exploreGithub', 'Explore on GitHub')}
      <FaArrowUpRightFromSquare aria-hidden='true' className='ml-2 text-xs' />
    </Link>
  ) : (
    <p className='mb-0 flex min-h-11 items-center font-Monda text-sm font-semibold text-slate-500 dark:text-slate-400'>
      <FaLock aria-hidden='true' className='mr-2' />
      {t('projects.privateDevelopment', 'Private product development')}
    </p>
  );

const ProjectImage = ({ project, featured = false }) => (
  <div
    className={`relative overflow-hidden ${featured ? 'aspect-[16/10] lg:aspect-auto lg:min-h-[30rem]' : 'aspect-[16/10]'}`}
  >
    <Image
      src={project.image}
      alt={project.imageAlt}
      fill
      sizes={featured ? '(max-width: 1023px) 100vw, 55vw' : '(max-width: 767px) 100vw, 50vw'}
      className='m-0 object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105'
    />
    <div className='absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent' />
    <span className='absolute bottom-4 left-4 rounded-full border border-orange-500/40 bg-slate-950/80 px-3.5 py-1 font-Monda text-xs font-bold tracking-wide text-orange-400 backdrop-blur-md shadow-md'>
      {project.label}
    </span>
  </div>
);

const FeaturedProject = ({ project, t }) => (
  <article className='not-prose group relative grid min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-orange-500/40 lg:grid-cols-[1.15fr_0.85fr]'>
    <ProjectImage project={project} featured />
    <div className='flex flex-col justify-center p-6 sm:p-8 lg:p-10'>
      <div className='mb-3 inline-flex items-center gap-2'>
        <span className='size-2.5 rounded-full bg-orange-500 animate-pulse' />
        <span className='font-Monda text-xs font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400'>
          {t('projects.featuredLabel', 'Featured project')}
        </span>
      </div>
      <h3 className='mb-4 mt-0 font-Neuton text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl'>
        {project.title}
      </h3>
      <p className='mb-6 text-base leading-relaxed text-slate-600 dark:text-slate-300'>{project.description}</p>

      <ul className='mb-6 mt-0 grid list-none gap-2.5 p-0 text-sm text-slate-700 dark:text-slate-200'>
        {project.highlights.map((highlight) => (
          <li key={highlight} className='flex items-start gap-2.5'>
            <FaCheck aria-hidden='true' className='mt-1 shrink-0 text-green-600 dark:text-green-400' />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <TechnologyList project={project} />
      <div className='mt-8'>
        <ProjectAction project={project} t={t} />
      </div>
    </div>
  </article>
);

const SupportingProject = ({ project, t }) => (
  <article className='not-prose group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-500/50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-orange-500/40'>
    <ProjectImage project={project} />
    <div className='flex flex-1 flex-col p-6 sm:p-7'>
      <h3 className='mb-3 mt-0 font-Neuton text-2xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-3xl'>
        {project.title}
      </h3>
      <p className='mb-6 text-base leading-relaxed text-slate-600 dark:text-slate-300'>{project.description}</p>
      <div className='mt-auto'>
        <TechnologyList project={project} />
        <div className='mt-6'>
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
    <section
      aria-labelledby='projects-title'
      className='relative py-20 md:py-28 bg-slate-100/90 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors duration-200 isolate overflow-hidden border-y border-slate-200 dark:border-slate-800 shadow-xl'
    >
      {/* Premium ambient glow lighting */}
      <div className='absolute -top-40 left-1/4 -z-10 h-[30rem] w-[30rem] rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-[120px]' />
      <div className='absolute -bottom-40 right-1/4 -z-10 h-[30rem] w-[30rem] rounded-full bg-green-500/10 dark:bg-green-500/15 blur-[120px]' />

      <div className='mx-auto w-full max-w-[1048px] px-4 lg:px-8'>
        <header className='mx-auto mb-14 max-w-3xl text-center md:mb-20'>
          <p className='mb-3 font-Monda text-xs font-bold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400'>
            {t('projects.subtitle', 'Selected work')}
          </p>
          <h2
            id='projects-title'
            className='mb-4 font-Neuton text-4xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl'
          >
            {t('projects.title', 'Projects built around real problems')}
          </h2>
          <p className='mx-auto mb-0 max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg'>
            {t(
              'projects.desc',
              'Three products that bring together systems thinking, hands-on engineering, and architecture designed to hold up beyond the first release.'
            )}
          </p>
        </header>

        <FeaturedProject project={featuredProject} t={t} />

        <div className='mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10'>
          {supportingProjects.map((project) => (
            <SupportingProject key={project.title} project={project} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
