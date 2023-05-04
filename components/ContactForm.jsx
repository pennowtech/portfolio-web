/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { BiPaperPlane } from 'react-icons/bi';

const InputField = ({ id, type, label, value, onChange }) => (
  <>
    <label className='block uppercase tracking-wide text-xs font-bold mb-2' htmlFor={id}>
      {label}
    </label>
    <input
      className='appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 rounded-lg py-3 px-4 leading-tight focus:outline-none border-secondary border-4 focus:bg-white border-gray-300 focus:border-gray-400'
      id={id}
      name={id}
      type={type}
      placeholder={label}
      value={value}
      onChange={onChange}
    />
  </>
);

const ErrorMessage = ({ message }) => <p className='text-red-500 dark:text-red-300 text-xs italic'>{message}</p>;

const ContactForm = () => {
  const { executeRecaptcha, recaptchaLoaded, recaptchaError } = useGoogleReCaptcha();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    message: ''
  });
  const [submitBtnText, setSubmitBtnText] = useState('Submit');
  const [error, setError] = useState({});

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!executeRecaptcha) {
        toast(' This form is not operational right now. Better contact me through twitter!!!', { type: 'warning' });
        return;
      }

      const errors = {};
      Object.keys(formData).forEach((key) => {
        if (!formData[key]) {
          errors[key] = `${key} cannot be blank`;
        } else if (key === 'email' && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(formData[key])) {
          errors[key] = `${key} is probably not a valid email!`;
        }
      });

      if (Object.keys(errors).length > 0) {
        setError(errors);
        toast('Please re-check your inputs.', { type: 'error' });
      } else {
        try {
          const token = await executeRecaptcha();
          if (!token) {
            toast('Failed to Send as executeRecaptcha failed!!!', {
              type: 'error'
            });
            return;
          }
          const res = await fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify({ token, ...formData })
          });
          if (res.status === 201) {
            toast('Thank you for contacting me!', { type: 'success' });
            setFormData({
              firstname: '',
              lastname: '',
              email: '',
              message: ''
            });
          } else {
            toast('Please re-check your inputs.', { type: 'error' });
          }
        } catch (exception) {
          console.warn(exception);
          toast('Failed to Send!!!', { type: 'error' });
        }
      }
    },
    [executeRecaptcha, formData]
  );

  const handleChange = useCallback(
    (e) => {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [e.target.name]: e.target.value
      }));
      setError((prevError) => ({ ...prevError, [e.target.name]: null }));
    },
    [setFormData, setError]
  );

  const { firstname, lastname, email, message } = formData;

  if (recaptchaError) {
    return <div>Error loading reCAPTCHA!</div>;
  }

  return (
    <div className='relative container mx-auto py-4 md:mb-4 px-4 md:px-2'>
      <h2 className='flex justify-center lg:text-3xl leading-normal mt-8'>Want to Contact me?</h2>
      {!executeRecaptcha && (
        <div className='flex font-medium items-center justify-center leading-normal mb-8'>
          This form is not operational right now. Better contact me through
          <Link href='http://twitter.com/techishdeep' className='text-blue-400 dark:text-blue-400 '>
            &nbsp;twitter
          </Link>
        </div>
      )}
      <div className='flex justify-center'>
        <ToastContainer />
        <form className='w-full max-w-lg'>
          <div className='flex flex-wrap -mx-3 mb-6'>
            <div className='w-full md:w-1/2 px-3 mb-6 md:mb-0'>
              <InputField id='firstname' type='text' label='First Name' value={firstname} onChange={handleChange} />
              {error.firstname && <ErrorMessage message={error.firstname} />}
            </div>
            <div className='w-full md:w-1/2 px-3'>
              <InputField id='lastname' type='text' label='Last Name' value={lastname} onChange={handleChange} />
              {error.lastname && <ErrorMessage message={error.lastname} />}
            </div>
          </div>
          <div className='px-3 -mx-3 mb-6'>
            <InputField id='email' type='email' label='Enter Email' value={email} onChange={handleChange} />
            {error.email && <ErrorMessage message={error.email} />}
          </div>
          <div className='flex flex-wrap -mx-3 mb-6'>
            <div className='w-full px-3'>
              <label htmlFor='message' className='block uppercase tracking-wide text-xs font-bold mb-2'>
                Message
              </label>
              <textarea
                className='no-resize appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 border-4  rounded-lg  py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white border-gray-300 focus:border-gray-400 h-48 resize-none'
                id='message'
                name='message'
                placeholder='Hey, I would like to get in touch with you'
                onChange={handleChange}
              />
              {error?.message && <ErrorMessage message={error.message} />}
            </div>
          </div>
          <div className='justify-center md:items-center'>
            <div
              className='text-center button focus:shadow-outline  '
              type='submit'
              role='button'
              onClick={handleSubmit}
              onKeyPress={handleSubmit}
            >
              {submitBtnText}
              <BiPaperPlane className='ml-2 inline-block' />
            </div>
            <div className='md:w-2/3' />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
