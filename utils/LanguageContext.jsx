import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import en from '../locales/en.json';
import de from '../locales/de.json';

const translations = { en, de };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const router = useRouter();
  const [locale, setLocale] = useState(router.locale || 'en');

  useEffect(() => {
    if (router.locale && router.locale !== locale) {
      setLocale(router.locale);
    }
  }, [router.locale, locale]);

  const switchLanguage = (newLocale) => {
    setLocale(newLocale);
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  const t = (keyPath, fallback = '') => {
    const keys = keyPath.split('.');
    let current = translations[locale] || translations.en;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English
        let fall = translations.en;
        for (const fk of keys) {
          if (fall && fall[fk] !== undefined) {
            fall = fall[fk];
          } else {
            return fallback || keyPath;
          }
        }
        return fall;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: switchLanguage, t }}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
