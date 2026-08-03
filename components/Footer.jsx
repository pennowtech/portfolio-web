import React from 'react';
import Link from 'next/link';
import { FooterMainMenuItems, SocialIconList } from '../utils/consts';
import Logo from './Logo';
import { OPEN_PRIVACY_SETTINGS_EVENT } from '@utils/privacyConsent';
import { useLanguage } from '../utils/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const analyticsAvailable = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS);

  return (
    <footer className='not-prose border-t border-slate-600 bg-slate-800 font-RobotoCond text-slate-300'>
      <div className='mx-auto w-full max-w-[1048px] px-4 py-10 md:px-6 md:py-12 lg:px-8'>
        <div className='grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.4fr_0.7fr_0.9fr]'>
          <div>
            <Logo position='footer' />
            <p className='mb-0 mt-3 max-w-md text-base leading-relaxed text-slate-300'>
              {t(
                'footer.slogan',
                'Architecture grounded in engineering—through practical systems, dependable software, and work built for the real world.'
              )}
            </p>
            <Link
              href='/contact'
              className='mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-green-700 px-5 py-2.5 font-Monda text-sm font-bold text-white transition hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800'
            >
              {t('contact.title', 'Start a conversation')}
            </Link>
          </div>

          <nav aria-labelledby='footer-navigation-title'>
            <h2
              id='footer-navigation-title'
              className='mb-4 font-Monda text-sm font-semibold uppercase tracking-[0.14em] text-white'
            >
              {t('footer.explore', 'Explore')}
            </h2>
            <ul className='m-0 grid list-none gap-2 p-0'>
              {FooterMainMenuItems.map((menuItem) => (
                <li key={menuItem.path}>
                  <Link
                    href={menuItem.path}
                    className='inline-flex min-h-11 items-center rounded-sm text-base text-slate-300 transition hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
                  >
                    {t(
                      `nav.${
                        menuItem.path === '/'
                          ? 'home'
                          : menuItem.path === '/about-me'
                            ? 'about'
                            : menuItem.path === '/page'
                              ? 'articles'
                              : menuItem.path === '/contact'
                                ? 'contact'
                                : ''
                      }`,
                      menuItem.title
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className='mb-4 font-Monda text-sm font-semibold uppercase tracking-[0.14em] text-white'>
              {t('footer.connect', 'Connect')}
            </h2>
            <ul className='m-0 flex list-none flex-wrap gap-3 p-0'>
              {SocialIconList.map((social) => (
                <li key={social.title}>
                  <Link
                    href={social.path}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={`Visit ${social.title}`}
                    title={social.title}
                    className='flex size-11 items-center justify-center rounded-lg border border-slate-600 text-xl text-slate-200 transition hover:border-green-500 hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
                  >
                    {social.icon}
                  </Link>
                </li>
              ))}
            </ul>
            <p className='mb-0 mt-4 text-sm leading-relaxed text-slate-400'>
              {t('footer.responseNotice', 'Usually responding within one or two business days.')}
            </p>
          </div>
        </div>

        <div className='mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-600 pt-6 text-center text-sm text-slate-400 md:flex-row md:text-left'>
          <p className='m-0'>
            © {new Date().getFullYear()} Sukhdeep Singh. {t('footer.rights', 'All rights reserved.')}
          </p>
          <nav
            aria-label='Legal, privacy, and author links'
            className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2'
          >
            <Link
              href='/privacy'
              className='rounded-sm text-slate-300 hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
            >
              {t('footer.privacy', 'Privacy')}
            </Link>
            <Link
              href='/imprint'
              className='rounded-sm text-slate-300 hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
            >
              {t('footer.imprint', 'Imprint')}
            </Link>
            <Link
              href='/write'
              rel='nofollow'
              className='rounded-sm text-slate-400 hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
            >
              Write
            </Link>
            {analyticsAvailable && (
              <button
                type='button'
                onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_SETTINGS_EVENT))}
                className='rounded-sm text-slate-300 hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
              >
                {t('footer.privacySettings', 'Privacy settings')}
              </button>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
