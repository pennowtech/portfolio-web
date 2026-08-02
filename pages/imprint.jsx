import Link from 'next/link';
import LegalPage from '@components/LegalPage';

const Imprint = () => (
  <LegalPage
    title='Imprint'
    eyebrow='Legal information'
    description='Operator and contact information for the SinghBuildsTech personal professional portfolio.'
  >
    <section>
      <h2>Website operator</h2>
      <p>
        Sukhdeep Singh
        <br />
        Germany
      </p>
    </section>
    <section>
      <h2>Contact</h2>
      <p>
        Email: <a href='mailto:singhbuildstech@gmail.com'>singhbuildstech@gmail.com</a>
        <br />
        Online: <Link href='/contact'>Contact form</Link>
      </p>
    </section>
    <section>
      <h2>Nature of this website</h2>
      <p>
        SinghBuildsTech is a personal professional portfolio presenting experience, projects, and technical writing. No
        purchases, contracts, or paid digital services are concluded directly through this website.
      </p>
    </section>
    <section>
      <h2>Important German provider-information note</h2>
      <p>
        Section 5 DDG requires a name, geographic address, and electronic contact details when its conditions apply to a
        commercially operated digital service. This page currently provides the operator’s identity and electronic
        contact information but does not publish a postal address. Before using this site to offer paid services or
        otherwise operating it within Section 5 DDG, a qualifying postal address must be added and reviewed.
      </p>
      <p>
        Official text:{' '}
        <a href='https://www.gesetze-im-internet.de/ddg/__5.html' target='_blank' rel='noreferrer'>
          Section 5 DDG
        </a>
        .
      </p>
    </section>
  </LegalPage>
);

export default Imprint;
