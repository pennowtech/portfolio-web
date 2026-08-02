import Link from 'next/link';
import LegalPage from '@components/LegalPage';

const Privacy = () => (
  <LegalPage
    title='Privacy Policy'
    eyebrow='Your data and choices'
    description='How SinghBuildsTech.com processes personal data, which services are involved, and the choices and rights available to visitors.'
  >
    <section>
      <h2>Controller and contact</h2>
      <p>The controller responsible for this website is Sukhdeep Singh, Germany.</p>
      <p>
        Privacy enquiries can be sent to <a href='mailto:singhbuildstech@gmail.com'>singhbuildstech@gmail.com</a> or
        through the <Link href='/contact'>contact form</Link>.
      </p>
    </section>

    <section>
      <h2>Hosting and server logs</h2>
      <p>
        The website is hosted by Vercel. When a page is requested, technical connection data such as the IP address,
        date and time, requested resource, browser information, and response status may be processed in server and
        security logs. This is necessary to deliver, secure, and diagnose the website. The legal basis is the legitimate
        interest in reliable and secure operation under Article 6(1)(f) GDPR.
      </p>
      <p>
        Details about Vercel’s processing are available in the{' '}
        <a href='https://vercel.com/legal/privacy-policy' target='_blank' rel='noreferrer'>
          Vercel Privacy Policy
        </a>
        .
      </p>
    </section>

    <section>
      <h2>Contact enquiries</h2>
      <p>
        The contact form collects first name, last name, email address, and message content. These details are used to
        evaluate and respond to the enquiry. The legal basis is Article 6(1)(b) GDPR where the request concerns a
        possible engagement or other pre-contractual steps, and Article 6(1)(f) GDPR for other correspondence.
      </p>
      <p>
        Successful submissions are stored in a private Notion database. Contact records are reviewed at least quarterly
        and deleted no later than 12 months after the last substantive communication, unless they are needed for an
        ongoing engagement or a statutory retention obligation.
      </p>
      <p>
        Learn more in the{' '}
        <a href='https://www.notion.so/help/privacy' target='_blank' rel='noreferrer'>
          Notion Privacy Policy
        </a>
        .
      </p>
    </section>

    <section>
      <h2>Spam protection with Google reCAPTCHA</h2>
      <p>
        The contact form uses Google reCAPTCHA v3 to distinguish legitimate submissions from automated abuse. The
        service evaluates technical and behavioural signals and returns a risk score. That score is used only to accept
        or reject a form submission; it does not produce a decision with legal or similarly significant effects.
        reCAPTCHA loads only on pages where the contact form is rendered.
      </p>
      <p>
        This processing supports the legitimate interest in protecting the form and website under Article 6(1)(f) GDPR.
        Google’s{' '}
        <a href='https://policies.google.com/privacy' target='_blank' rel='noreferrer'>
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href='https://policies.google.com/terms' target='_blank' rel='noreferrer'>
          Terms
        </a>{' '}
        apply.
      </p>
    </section>

    <section>
      <h2>Optional Google Analytics</h2>
      <p>
        If Google Analytics is configured, it remains disabled until the visitor selects “Accept analytics.” The service
        may then process page views, device and browser information, approximate location, and interaction data. IP
        anonymisation is requested in the site configuration. The legal basis is consent under Article 6(1)(a) GDPR.
        Analytics event data is retained for no longer than two months.
      </p>
      <p>
        Consent can be refused without losing access to the website and can be changed later through “Privacy settings”
        in the footer. Withdrawal does not affect processing that occurred before withdrawal.
      </p>
    </section>

    <section>
      <h2>Fonts and local browser storage</h2>
      <p>
        Website fonts are delivered from the same origin as the portfolio. The visitor’s browser does not contact Google
        Fonts to render them.
      </p>
      <p>
        The site stores the theme preference and privacy choice in local storage. These values are necessary to honour
        the visitor’s requested appearance and consent status. They remain until removed through browser settings; they
        are not used to follow visitors across websites.
      </p>
    </section>

    <section>
      <h2>Recipients and international transfers</h2>
      <p>
        Vercel, Notion, and—when the relevant feature is used—Google may act as service providers. Some processing may
        take place outside the European Economic Area. Where required, transfers rely on the provider’s applicable
        adequacy mechanism or contractual safeguards. Current provider terms and transfer information should be reviewed
        whenever these services or their configurations change.
      </p>
    </section>

    <section>
      <h2>Your rights</h2>
      <p>
        Subject to the GDPR’s conditions, individuals may request access, correction, erasure, restriction, data
        portability, or object to processing based on legitimate interests. Consent may be withdrawn at any time.
        Requests can be sent to the email address above.
      </p>
      <p>
        A complaint may also be made to the competent German state data-protection authority. The{' '}
        <a href='https://www.bfdi.bund.de/' target='_blank' rel='noreferrer'>
          BfDI contact finder
        </a>{' '}
        helps identify the responsible authority.
      </p>
    </section>

    <section>
      <h2>Updates</h2>
      <p>
        Effective date: 2 August 2026. This notice will be updated when data flows, providers, or legal requirements
        change.
      </p>
    </section>
  </LegalPage>
);

export default Privacy;
