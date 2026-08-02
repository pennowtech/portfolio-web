import HeaderMain from './HeaderMain';
import FullLayout from './FullLayout';

const LegalPage = ({ title, eyebrow, description, children }) => (
  <FullLayout metaInfo={{ title: `${title} | SinghBuildsTech`, metaDesc: description, metaKeywords: '' }}>
    <HeaderMain />
    <main className='mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-16 lg:px-8'>
      <header className='mb-10 border-b border-slate-200 pb-8 dark:border-slate-500'>
        <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-green-700 dark:text-green-400'>
          {eyebrow}
        </p>
        <h1 className='mb-4 font-Neuton text-4xl font-semibold md:text-6xl'>{title}</h1>
        <p className='mb-0 max-w-2xl text-slate-600 dark:text-slate-200'>{description}</p>
      </header>
      <div className='space-y-9 [&_a]:text-green-700 [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-green-400 [&_h2]:mb-3 [&_h2]:font-Neuton [&_h2]:text-3xl [&_h2]:font-semibold [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:space-y-2'>
        {children}
      </div>
    </main>
  </FullLayout>
);

export default LegalPage;
