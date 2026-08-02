export const PRIVACY_CONSENT_KEY = 'sbtPrivacyConsent';
export const PRIVACY_CONSENT_EVENT = 'sbt-privacy-consent-change';
export const OPEN_PRIVACY_SETTINGS_EVENT = 'sbt-open-privacy-settings';

export const readPrivacyConsent = () => {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(window.localStorage.getItem(PRIVACY_CONSENT_KEY));
  } catch {
    return null;
  }
};

export const savePrivacyConsent = (analytics) => {
  const preference = { analytics, updatedAt: new Date().toISOString(), version: 1 };
  window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(preference));
  if (!analytics) {
    document.cookie.split(';').forEach((entry) => {
      const name = entry.split('=')[0].trim();
      if (name === '_ga' || name === '_gid' || name === '_gat' || name.startsWith('_ga_')) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    });
  }
  window.dispatchEvent(new CustomEvent(PRIVACY_CONSENT_EVENT, { detail: preference }));
  return preference;
};
