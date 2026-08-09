import React from 'react';
import Image from 'next/image';
import { useLanguage } from '../../utils/LanguageContext';

const PhotoStory = ({ story, priority = false }) => (
  <figure
    className={`group relative m-0 h-80 min-h-64 overflow-hidden rounded-2xl bg-slate-900 sm:h-[22rem] md:h-auto ${story.layout}`}
  >
    <Image
      src={story.src}
      alt={story.alt}
      fill
      priority={priority}
      className={`object-cover transition duration-700 ease-out group-hover:scale-[1.025] ${story.position || ''}`}
      sizes={story.sizes || '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw'}
    />
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent'
    />
    <figcaption className='absolute inset-x-0 bottom-0 max-w-[34rem] p-4 font-Neuton text-lg leading-snug text-white sm:p-5 sm:text-xl md:p-6 md:text-2xl'>
      {story.caption}
    </figcaption>
  </figure>
);

const TextStory = ({ story }) => (
  <article
    className={`flex min-h-64 flex-col justify-center rounded-2xl px-6 py-8 md:px-9 ${
      story.tone === 'light'
        ? 'bg-stone-100 text-slate-900 dark:bg-slate-800 dark:text-white'
        : 'bg-slate-900 text-white dark:bg-slate-800'
    } ${story.layout}`}
  >
    <p
      className={`mb-3 font-Monda text-xs font-semibold uppercase tracking-[0.14em] ${
        story.tone === 'light' ? 'text-orange-700 dark:text-orange-300' : 'text-orange-300'
      }`}
    >
      {story.label}
    </p>
    <h3 className='mb-3 font-Neuton text-2xl font-semibold leading-tight md:text-3xl'>{story.title}</h3>
    <p
      className={`m-0 max-w-[32rem] text-base leading-7 ${
        story.tone === 'light' ? 'text-slate-700 dark:text-slate-200' : 'text-slate-200'
      }`}
    >
      {story.body}
    </p>
  </article>
);

const PersonalSide = ({ classProps = '' }) => {
  const { t } = useLanguage();

  const stories = [
    {
      id: 'writing',
      kind: 'text',
      tone: 'light',
      label: t('personalSide.stories.writing.label', 'Writing'),
      title: t('personalSide.stories.writing.title', 'I enjoy turning ideas into words'),
      body: t(
        'personalSide.stories.writing.body',
        'I write about things I have learned, places I have seen, and ideas that stay with me. It is a simple way to share a little of how I see the world.'
      ),
      layout: 'md:col-span-5 md:row-span-2'
    },
    {
      id: 'reading',
      src: '/personal/book-reader.png',
      alt: t('personalSide.readerAlt', 'Sukhdeep enjoying a book'),
      caption: t(
        'personalSide.readerCaption',
        'Reading feeds my curiosity. I enjoy discovering new ideas, different perspectives, and stories that stay with me long after the last page.'
      ),
      layout: 'md:col-span-7 md:row-span-2',
      position: 'object-center',
      sizes: '(max-width: 767px) 100vw, 60vw'
    },
    {
      id: 'mysore',
      src: '/personal/travel-mysore-palace.jpeg',
      alt: t('personalSide.stories.mysore.alt', 'A cultural stop from Sukhdeep’s travels'),
      caption: t('personalSide.traits.explore', 'Travels for the culture, not the checklist.'),
      layout: 'md:col-span-4 md:row-span-4',
      position: 'object-center'
    },
    {
      id: 'water',
      kind: 'text',
      label: t('personalSide.stories.water.label', 'Swimming'),
      title: t('personalSide.stories.water.title', 'Put me near water and I am happy'),
      body: t(
        'personalSide.stories.water.body',
        'Swimming is one of my favorite ways to stay active and switch off. Pool, lake, or sea—I am rarely difficult to convince when there is a chance to get in the water.'
      ),
      layout: 'md:col-span-8 md:row-span-2'
    },
    {
      id: 'lisbon',
      src: '/personal/travel-lisbon-arch.jpeg',
      alt: t('personalSide.stories.lisbon.alt', 'An evening discovered while travelling'),
      caption: t(
        'personalSide.stories.lisbon.caption',
        'The best plans leave a little room for the road to surprise you.'
      ),
      layout: 'md:col-span-4 md:row-span-2',
      position: 'object-center'
    },
    {
      id: 'street',
      src: '/personal/travel-trogir-street.jpeg',
      alt: t('personalSide.stories.street.alt', 'Sukhdeep exploring a new city on foot'),
      caption: t(
        'personalSide.stories.street.caption',
        'New streets. New stories. A better way of seeing familiar problems.'
      ),
      layout: 'md:col-span-4 md:row-span-2',
      position: 'object-center'
    }
  ];

  return (
    <section
      aria-labelledby='personal-side-title'
      className={`${classProps} relative overflow-hidden border-y border-stone-300/70 bg-stone-200/70 py-16 dark:border-slate-700 dark:bg-slate-900 md:py-24`}
    >
      <div className='mx-auto w-full max-w-[1120px] px-4 lg:px-8'>
        <header className='relative isolate mb-10 min-h-[24rem] overflow-hidden rounded-3xl sm:min-h-[22rem] md:mb-12 md:min-h-96'>
          <div className='absolute inset-0 overflow-hidden'>
            <Image
              src='/personal/cycling-alps.jpeg'
              alt=''
              role='presentation'
              fill
              className='object-cover object-[55%_center] sm:object-center'
              sizes='100vw'
            />
            <div aria-hidden='true' className='absolute inset-0 bg-slate-950/60' />
          </div>
          <div className='relative z-10 flex min-h-[24rem] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[22rem] sm:px-8 md:min-h-96'>
            <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-orange-200'>
              {t('personalSide.subtitle', 'Off the clock')}
            </p>
            <h2
              id='personal-side-title'
              className='mb-4 font-Neuton text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl'
            >
              {t('personalSide.title', 'The same curiosity, pointed elsewhere')}
            </h2>
            <p className='mx-auto mb-0 max-w-2xl text-slate-100 md:text-lg'>
              {t(
                'personalSide.desc',
                "Systems thinking doesn't stay at the keyboard. It follows me up mountains, into new cities, and back to open water — usually with a paperback close behind."
              )}
            </p>
          </div>
        </header>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[8rem]'>
          {stories.map((story) =>
            story.kind === 'text' ? (
              <TextStory key={story.id} story={story} />
            ) : (
              <PhotoStory key={story.id} story={story} />
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default PersonalSide;
