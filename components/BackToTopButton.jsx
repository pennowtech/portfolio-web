import { useEffect, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import { useLanguage } from '../utils/LanguageContext';

const BackToTopButton = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 480);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const label = t('accessibility.backToTop', 'Back to top');

  return (
    <button
      type='button'
      onClick={scrollToTop}
      aria-label={label}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      title={label}
      className={`fixed bottom-5 right-4 z-[70] inline-flex size-12 items-center justify-center rounded-full bg-green-700 text-white shadow-lg transition-[opacity,transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus-visible:ring-green-400 dark:focus-visible:ring-offset-slate-900 sm:bottom-6 sm:right-6 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <FiArrowUp aria-hidden='true' className='text-xl' />
    </button>
  );
};

export default BackToTopButton;
