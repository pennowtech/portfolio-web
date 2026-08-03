import Link from 'next/link';
import LegalPage from '@components/LegalPage';
import { useLanguage } from '../utils/LanguageContext';

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <LegalPage
      title={t('legal.privacy.title', 'Privacy Policy')}
      eyebrow={t('legal.privacy.eyebrow', 'Your data and choices')}
      description={t(
        'legal.privacy.description',
        'How SinghBuildsTech.com processes personal data, which services are involved, and the choices and rights available to visitors.'
      )}
    >
      <section>
        <h2>{t('privacyPage.s1Title', 'Controller and contact')}</h2>
        <p>{t('privacyPage.s1p1', 'The controller responsible for this website is Sukhdeep Singh, Germany.')}</p>
        <p>
          {t('privacyPage.s1p2Start', 'This notice applies to')}{' '}
          <a href='https://singhbuildstech.com'>https://singhbuildstech.com</a>{' '}
          {t('privacyPage.s1p2End', 'and its redirected www hostname.')}
        </p>
        <p>
          {t('privacyPage.s1p3Start', 'Privacy enquiries can be sent to')}{' '}
          <a href='mailto:singhbuildstech@gmail.com'>singhbuildstech@gmail.com</a>{' '}
          {t('privacyPage.s1p3Mid', 'or through the')}{' '}
          <Link href='/contact'>{t('privacyPage.contactFormLink', 'contact form')}</Link>.
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s2Title', 'Hosting and server logs')}</h2>
        <p>
          {t(
            'privacyPage.s2p1',
            'The website is hosted by Vercel. When a page is requested, technical connection data such as the IP address, date and time, requested resource, browser information, and response status may be processed in server and security logs. This is necessary to deliver, secure, and diagnose the website. The legal basis is the legitimate interest in reliable and secure operation under Article 6(1)(f) GDPR.'
          )}
        </p>
        <p>
          {t('privacyPage.s2p2Start', 'Details about Vercel’s processing are available in the')}{' '}
          <a href='https://vercel.com/legal/privacy-policy' target='_blank' rel='noreferrer'>
            {t('privacyPage.vercelPolicy', 'Vercel Privacy Policy')}
          </a>
          .
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s3Title', 'Contact enquiries')}</h2>
        <p>
          {t(
            'privacyPage.s3p1',
            'The contact form collects first name, last name, email address, and message content. These details are used to evaluate and respond to the enquiry. The legal basis is Article 6(1)(b) GDPR where the request concerns a possible engagement or other pre-contractual steps, and Article 6(1)(f) GDPR for other correspondence.'
          )}
        </p>
        <p>
          {t(
            'privacyPage.s3p2',
            'Successful submissions are stored in a private Notion database. Contact records are reviewed at least quarterly and deleted no later than 12 months after the last substantive communication, unless they are needed for an ongoing engagement or a statutory retention obligation.'
          )}
        </p>
        <p>
          {t('privacyPage.s3p3Start', 'Learn more in the')}{' '}
          <a href='https://www.notion.so/help/privacy' target='_blank' rel='noreferrer'>
            {t('privacyPage.notionPolicy', 'Notion Privacy Policy')}
          </a>
          .
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s4Title', 'Spam protection with Google reCAPTCHA')}</h2>
        <p>
          {t(
            'privacyPage.s4p1',
            'The contact form uses Google reCAPTCHA v3 to distinguish legitimate submissions from automated abuse. The service evaluates technical and behavioural signals and returns a risk score. That score is used only to accept or reject a form submission; it does not produce a decision with legal or similarly significant effects. reCAPTCHA loads only on pages where the contact form is rendered.'
          )}
        </p>
        <p>
          {t(
            'privacyPage.s4p2Start',
            'This processing supports the legitimate interest in protecting the form and website under Article 6(1)(f) GDPR. Google’s'
          )}{' '}
          <a href='https://policies.google.com/privacy' target='_blank' rel='noreferrer'>
            {t('privacyPage.googlePrivacy', 'Privacy Policy')}
          </a>{' '}
          {t('privacyPage.and', 'and')}{' '}
          <a href='https://policies.google.com/terms' target='_blank' rel='noreferrer'>
            {t('privacyPage.googleTerms', 'Terms')}
          </a>{' '}
          {t('privacyPage.apply', 'apply.')}
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s5Title', 'Optional Google Analytics')}</h2>
        <p>
          {t(
            'privacyPage.s5p1',
            'If Google Analytics is configured, it remains disabled until the visitor selects “Accept analytics.” The service may then process page views, device and browser information, approximate location, and interaction data. IP anonymisation is requested in the site configuration. The legal basis is consent under Article 6(1)(a) GDPR. Analytics event data is retained for no longer than two months.'
          )}
        </p>
        <p>
          {t(
            'privacyPage.s5p2',
            'Consent can be refused without losing access to the website and can be changed later through “Privacy settings” in the footer. Withdrawal does not affect processing that occurred before withdrawal.'
          )}
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s6Title', 'Fonts and local browser storage')}</h2>
        <p>
          {t(
            'privacyPage.s6p1',
            'Website fonts are delivered from the same origin as the portfolio. The visitor’s browser does not contact Google Fonts to render them.'
          )}
        </p>
        <p>
          {t(
            'privacyPage.s6p2',
            'The site stores the theme preference and privacy choice in local storage. These values are necessary to honour the visitor’s requested appearance and consent status. They remain until removed through browser settings; they are not used to follow visitors across websites.'
          )}
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s7Title', 'Embedded media and social posts')}</h2>
        <p>
          {t(
            'privacyPage.s7p1',
            'Articles may contain YouTube videos or posts from LinkedIn and X/Twitter. Social posts are not requested from those platforms until the visitor selects the corresponding load button. Once activated, the provider receives connection data such as the IP address, browser information, referring page, and potentially account or cookie information under its own privacy terms. Activation is voluntary and is based on consent under Article 6(1)(a) GDPR.'
          )}
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s8Title', 'Recipients and international transfers')}</h2>
        <p>
          {t(
            'privacyPage.s8p1',
            'Vercel, Notion, and—when the relevant feature is used—Google, LinkedIn, and X may process data. Some processing may take place outside the European Economic Area. Where required, transfers rely on the provider’s applicable adequacy mechanism or contractual safeguards. Current provider terms and transfer information should be reviewed whenever these services or their configurations change.'
          )}
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s9Title', 'Your rights')}</h2>
        <p>
          {t(
            'privacyPage.s9p1',
            'Subject to the GDPR’s conditions, individuals may request access, correction, erasure, restriction, data portability, or object to processing based on legitimate interests. Consent may be withdrawn at any time. Requests can be sent to the email address above.'
          )}
        </p>
        <p>
          {t(
            'privacyPage.s9p2Start',
            'A complaint may also be made to the competent German state data-protection authority. The'
          )}{' '}
          <a href='https://www.bfdi.bund.de/' target='_blank' rel='noreferrer'>
            {t('privacyPage.bfdiLink', 'BfDI contact finder')}
          </a>{' '}
          {t('privacyPage.s9p2End', 'helps identify the responsible authority.')}
        </p>
      </section>

      <section>
        <h2>{t('privacyPage.s10Title', 'Updates')}</h2>
        <p>
          {t(
            'privacyPage.s10p1',
            'Effective date: 2 August 2026. This notice will be updated when data flows, providers, or legal requirements change.'
          )}
        </p>
      </section>
    </LegalPage>
  );
};

export default Privacy;
