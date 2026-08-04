import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { BiPaperPlane } from 'react-icons/bi';
import { useLanguage } from '../utils/LanguageContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InputField = ({ id, type, label, value, onChange, error, autoComplete, disabled }) => (
  <div>
    <label className='mb-2 block font-Monda text-sm font-semibold' htmlFor={id}>
      {label}
    </label>
    <input
      className='min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-700 focus:ring-2 focus:ring-green-700/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-500 dark:bg-gray-700 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-green-400 dark:focus:ring-green-400/20'
      id={id}
      name={id}
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} className='mb-0 mt-2 text-sm text-red-700 dark:text-red-300'>
        {error}
      </p>
    )}
  </div>
);

const validateForm = (formData) => {
  const errors = {};
  if (!formData.firstname.trim()) errors.firstname = 'Enter your first name.';
  if (!formData.lastname.trim()) errors.lastname = 'Enter your last name.';
  if (!formData.email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(formData.email.trim())) errors.email = 'Enter a valid email address.';
  if (!formData.message.trim()) errors.message = 'Tell me briefly what you would like to discuss.';
  return errors;
};

const ContactFormContent = ({ hasSiteKey }) => {
  const { t } = useLanguage();
  const recaptchaContext = useGoogleReCaptcha();
  const executeRecaptcha = recaptchaContext?.executeRecaptcha;
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const validationErrors = validateForm(formData);

      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        setStatus({ type: 'error', message: 'Please check the highlighted fields.' });
        return;
      }

      if (!hasSiteKey) {
        setStatus({
          type: 'error',
          message: 'Spam protection (reCAPTCHA) is not configured in this environment. Form submissions are disabled.'
        });
        return;
      }

      if (!executeRecaptcha) {
        setStatus({
          type: 'error',
          message: 'Spam protection is still loading. Please wait a moment and try again.'
        });
        return;
      }

      setIsSubmitting(true);
      setStatus(null);

      try {
        const token = await executeRecaptcha('contact_form');
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token, ...formData })
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (result.errors) setErrors(result.errors);
          throw new Error(result.message || 'The message could not be sent.');
        }

        setFormData({
          firstname: '',
          lastname: '',
          email: '',
          message: ''
        });
        setErrors({});
        setStatus({ type: 'success', message: result.message || 'Thanks—your message has been sent.' });
      } catch (error) {
        setStatus({ type: 'error', message: error.message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [executeRecaptcha, formData, hasSiteKey]
  );

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setStatus(null);
  }, []);

  return (
    <section aria-labelledby='contact-title' className='relative py-14 md:py-20'>
      <div className='mx-auto grid w-full max-w-[1048px] gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8'>
        <div className='self-start lg:sticky lg:top-28'>
          <p className='mb-2 font-Monda text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300'>
            {t('contact.subtitle', 'Start a conversation')}
          </p>
          <h2 id='contact-title' className='mb-4 font-Neuton text-4xl font-semibold leading-tight md:text-5xl'>
            {t('contact.headline', 'Have a system challenge worth discussing?')}
          </h2>
          <p className='mb-5 leading-relaxed text-slate-600 dark:text-slate-200'>
            {t(
              'contact.desc',
              'Share a little context about the product, platform, or engineering problem. A concise message is enough to get the conversation started.'
            )}
          </p>
          <p className='mb-0 text-sm text-slate-500 dark:text-slate-300'>
            {t('contact.fallbackText', 'If the form is unavailable, reach out through')}{' '}
            <Link
              href='https://x.com/techishdeep'
              className='font-semibold text-green-700 underline underline-offset-4 hover:text-green-600 dark:text-green-400'
            >
              X / Twitter
            </Link>
            .
          </p>
        </div>

        <form
          className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-500 dark:bg-gray-700 md:p-8'
          onSubmit={handleSubmit}
          noValidate
        >
          {!hasSiteKey && (
            <div
              role='alert'
              className='mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
            >
              ⚠️ {t('contact.noRecaptchaWarning', 'Spam protection (reCAPTCHA) is not configured in this environment. Form submissions are disabled.')}
            </div>
          )}

          <div className='grid gap-6 sm:grid-cols-2'>
            <InputField
              id='firstname'
              type='text'
              label={t('contact.firstname', 'First name')}
              autoComplete='given-name'
              value={formData.firstname}
              onChange={handleChange}
              error={errors.firstname}
              disabled={isSubmitting || !hasSiteKey}
            />
            <InputField
              id='lastname'
              type='text'
              label={t('contact.lastname', 'Last name')}
              autoComplete='family-name'
              value={formData.lastname}
              onChange={handleChange}
              error={errors.lastname}
              disabled={isSubmitting || !hasSiteKey}
            />
          </div>

          <div className='mt-6'>
            <InputField
              id='email'
              type='email'
              label={t('contact.email', 'Email address')}
              autoComplete='email'
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isSubmitting || !hasSiteKey}
            />
          </div>

          <div className='mt-6'>
            <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
              <label htmlFor='message' className='font-Monda text-sm font-semibold'>
                {t('contact.message', 'Message')}
              </label>
              <div className='flex flex-wrap gap-1.5 text-xs font-Monda'>
                {[
                  {
                    label: 'Architecture Audit',
                    text: 'Hi Sukhdeep, I would like to discuss an Architecture Audit for our system.'
                  },
                  { label: 'System Design', text: 'Hi Sukhdeep, we have a System Design challenge in our platform.' },
                  { label: 'Consulting', text: 'Hi Sukhdeep, I am interested in technical architecture consulting.' }
                ].map((preset) => (
                  <button
                    type='button'
                    key={preset.label}
                    disabled={isSubmitting || !hasSiteKey}
                    onClick={() => setFormData((curr) => ({ ...curr, message: preset.text }))}
                    className='rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id='message'
              name='message'
              rows={5}
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting || !hasSiteKey}
              placeholder={t('contact.placeholder', 'A short overview of the challenge, context, or opportunity…')}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'message-error' : 'message-help'}
              className={`w-full rounded-lg border bg-white px-3.5 py-2 text-base outline-none transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 ${
                errors.message
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                  : 'border-slate-300 focus:border-green-700 focus:ring-2 focus:ring-green-700 dark:border-slate-500 dark:focus:border-green-400 dark:focus:ring-green-400'
              }`}
            />
            {errors.message ? (
              <p id='message-error' className='mt-1 text-xs text-red-600 dark:text-red-400'>
                {errors.message}
              </p>
            ) : (
              <p id='message-help' className='mt-1 text-xs text-slate-500 dark:text-slate-300'>
                {t('contact.helpMessage', 'Please avoid including confidential information.')}
              </p>
            )}
          </div>

          {status && (
            <div
              role={status.type === 'error' ? 'alert' : 'status'}
              aria-live='polite'
              className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950/30 dark:text-green-100'
                  : 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/30 dark:text-red-100'
              }`}
            >
              {status.message}
            </div>
          )}

          <button
            type='submit'
            disabled={isSubmitting || !hasSiteKey}
            className='mt-6 flex min-h-12 w-full items-center justify-center rounded-lg bg-green-700 px-6 py-3 font-Monda font-bold text-white shadow-sm transition hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500 dark:focus-visible:ring-offset-gray-700 sm:w-auto'
          >
            {isSubmitting ? t('contact.sending', 'Sending…') : t('contact.send', 'Send message')}
            <BiPaperPlane aria-hidden='true' className='ml-2 text-lg' />
          </button>
          <p className='mb-0 mt-4 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-300'>
            {t(
              'contact.privacyNotice',
              'Your details are used only to respond to this enquiry. See the privacy policy for retention, recipients, and your rights.'
            )}
          </p>
          {hasSiteKey && (
            <p className='mb-0 mt-2 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-300'>
              {t('contact.recaptchaStart', 'This site is protected by reCAPTCHA and the Google')}{' '}
              <a className='text-green-700 underline dark:text-green-400' href='https://policies.google.com/privacy'>
                {t('contact.recaptchaPrivacy', 'Privacy Policy')}
              </a>{' '}
              {t('contact.recaptchaAnd', 'and')}{' '}
              <a className='text-green-700 underline dark:text-green-400' href='https://policies.google.com/terms'>
                {t('contact.recaptchaTerms', 'Terms of Service')}
              </a>{' '}
              {t('contact.recaptchaEnd', 'apply.')}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

const ContactForm = () => {
  const siteKey = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY;
  if (!siteKey) return <ContactFormContent hasSiteKey={false} />;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey} scriptProps={{ async: true, defer: true, appendTo: 'body' }}>
      <ContactFormContent hasSiteKey={true} />
    </GoogleReCaptchaProvider>
  );
};

export default ContactForm;
