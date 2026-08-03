import Link from 'next/link';
import LegalPage from '@components/LegalPage';
import { useLanguage } from '../utils/LanguageContext';

const Imprint = () => {
  const { t } = useLanguage();

  return (
    <LegalPage
      title={t('legal.imprint.title', 'Imprint')}
      eyebrow={t('legal.imprint.eyebrow', 'Legal information')}
      description={t(
        'legal.imprint.description',
        'Operator and contact information for the SinghBuildsTech personal professional portfolio.'
      )}
    >
      <section>
        <h2>{t('imprintPage.operatorTitle', 'Website operator')}</h2>
        <p>
          Sukhdeep Singh
          <br />
          {t('imprintPage.country', 'Germany')}
        </p>
      </section>
      <section>
        <h2>{t('imprintPage.contactTitle', 'Contact')}</h2>
        <p>
          {t('imprintPage.website', 'Website')}: <a href='https://singhbuildstech.com'>https://singhbuildstech.com</a>
          <br />
          {t('imprintPage.email', 'Email')}: <a href='mailto:singhbuildstech@gmail.com'>singhbuildstech@gmail.com</a>
          <br />
          {t('imprintPage.online', 'Online')}:{' '}
          <Link href='/contact'>{t('imprintPage.contactFormLink', 'Contact form')}</Link>
        </p>
      </section>
      <section>
        <h2>{t('imprintPage.natureTitle', 'Nature of this website')}</h2>
        <p>
          {t(
            'imprintPage.natureText',
            'SinghBuildsTech is a personal professional portfolio presenting experience, projects, and technical writing. No purchases, contracts, or paid digital services are concluded directly through this website.'
          )}
        </p>
      </section>
      <section>
        <h2>{t('imprintPage.noteTitle', 'Important German provider-information note')}</h2>
        <p>
          {t(
            'imprintPage.noteText',
            'Section 5 DDG requires a name, geographic address, and electronic contact details when its conditions apply to a commercially operated digital service. This page currently provides the operator’s identity and electronic contact information but does not publish a postal address. Before using this site to offer paid services or otherwise operating it within Section 5 DDG, a qualifying postal address must be added and reviewed.'
          )}
        </p>
        <p>
          {t('imprintPage.officialText', 'Official text')}:{' '}
          <a href='https://www.gesetze-im-internet.de/ddg/__5.html' target='_blank' rel='noreferrer'>
            {t('imprintPage.sectionLink', 'Section 5 DDG')}
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
};

export default Imprint;
