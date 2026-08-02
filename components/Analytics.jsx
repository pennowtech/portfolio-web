import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { PRIVACY_CONSENT_EVENT, readPrivacyConsent } from '@utils/privacyConsent';

const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

const Analytics = () => {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = (event) => setEnabled(Boolean(event?.detail?.analytics ?? readPrivacyConsent()?.analytics));
    syncConsent();
    window.addEventListener(PRIVACY_CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(PRIVACY_CONSENT_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const trackPage = (url) => window.gtag?.('config', measurementId, { page_path: url });
    router.events.on('routeChangeComplete', trackPage);
    return () => router.events.off('routeChangeComplete', trackPage);
  }, [enabled, router.events]);

  if (!measurementId || !enabled) return null;

  return (
    <>
      <Script strategy='afterInteractive' src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <Script id='google-analytics-consented' strategy='afterInteractive'>
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
};

export default Analytics;
