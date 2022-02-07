/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import Link from 'next/link';

function ContactForm() {
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitBtnText, setSubmitBtnText] = useState('Submit');
  const [error, setError] = useState({});
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailSentFailed, setEmailSentFailed] = useState(false);

  const handleValidation = (data) => {
    const tempErrors = {};
    setError({ ...tempErrors });
    let isValid = true;
    console.log('Verifying form data', data);

    if (data.firstname.length <= 0) {
      tempErrors.firstname = true;
      isValid = false;
    }
    if (data.lastname.length <= 0) {
      tempErrors.lastname = true;
      isValid = false;
    }
    if (data.email.length <= 0) {
      tempErrors.email = true;
      isValid = false;
    }
    if (data.message.length <= 0) {
      tempErrors.message = true;
      isValid = false;
    }

    setError({ ...tempErrors });
    console.log('errors', error);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.trim(),
      message: message.trim(),
    };
    console.log('Submitting form data', firstname);

    const isValidForm = handleValidation(data);
    if (!isValidForm) { return; }
    setSubmitBtnText('Sending...');

    console.log('Submitting form data', data);

    fetch('/api/contactform', {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((res) => {
      console.log('Response received');
      setSubmitBtnText('Submit');
      if (res.status === 200) {
        console.log('Response succeeded!');
        setEmailSentSuccess(true);
        setEmailSentFailed(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setMessage('');
      } else {
        console.error('Email sent failed!', res);
        setEmailSentSuccess(false);
        setEmailSentFailed(true);
      }
    });
  };

  return (
    <div className="relative container mx-auto py-16 px-4 md:px-2">
      <h2 className="flex justify-center lg:text-3xl text-bold leading-normal md:mt-20 mt-8">
        Want to Contact me?
      </h2>
      <p className="flex justify-center text-bold leading-normal md:mb-2 mb-8">Complete this form and I will get back to you.</p>
      <div className="flex font-semibold items-center justify-center text-bold leading-normal md:mb-20 mb-8">
        Or better contact me through
        <Link href="http://linkedin.com/in/pennowtech"><a className="text-red-400 dark:text-pink-400 ">&nbsp; linkedin</a></Link>
      </div>
      {' '}
      <div className="flex justify-center">
        <form className="w-full max-w-lg">
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-xs font-bold mb-2"
                htmlFor="firstname"
              >
                First Name
              </label>
              <input
                className="appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 rounded-lg py-3 px-4 leading-tight focus:outline-none border-secondary border-4 focus:bg-white border-gray-300 focus:border-gray-400"
                id="firstname"
                name="firstname"
                type="text"
                placeholder="First Name"
                onChange={(e) => { setFirstName(e.target.value); }}
              />
              {error?.firstname && (
              <p className="text-red-500 dark:text-red-300 text-xs italic">First name cannot be blank.</p>
              )}
            </div>
            <div className="w-full md:w-1/2 px-3">
              <label
                className="block uppercase tracking-wide  text-xs font-bold mb-2"
                htmlFor="lastname"
              >
                Last Name
              </label>
              <input
                className="appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 rounded-lg py-3 px-4 leading-tight focus:outline-none border-secondary border-4 focus:bg-white border-gray-300 focus:border-gray-400"
                id="lastname"
                type="text"
                placeholder="Last Name"
                onChange={(e) => { setLastName(e.target.value); }}
              />
              {error?.lastname && (
              <p className="text-red-500 dark:text-red-300 text-xs italic">Last name cannot be blank.</p>
              )}

            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label
                className="block uppercase tracking-wide text-xs font-bold mb-2"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                className="appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 rounded-lg py-3 px-4 leading-tight focus:outline-none border-secondary border-4 focus:bg-white border-gray-300 focus:border-gray-400"
                id="email"
                type="email"
                placeholder="Enter email"
                onChange={(e) => { setEmail(e.target.value); }}
              />
              {error?.email && (
              <p className="text-red-500 dark:text-red-300 text-xs italic">Email is required.</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label
                htmlFor="message"
                className="block uppercase tracking-wide text-xs font-bold mb-2"
              >
                Message
              </label>
              <textarea
                className="no-resize appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 border-4  rounded-lg  py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white border-gray-300 focus:border-gray-400 h-48 resize-none"
                id="message"
                name="message"
                placeholder="Hey, I would like to get in touch with you"
                onChange={(e) => { setMessage(e.target.value); }}
              />
              {error?.message && (
              <p className="text-red-500 dark:text-red-300 text-xs italic">Message cannot be blank.</p>
              )}

            </div>
          </div>
          <div className="md:flex md:items-center">
            <div
              className="button focus:shadow-outline  "
              type="submit"
              role="button"
              onClick={(e) => { handleSubmit(e); }}
              onKeyPress={handleSubmit}
            >
              {submitBtnText}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="ml-2 inline-block"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.00967 5.12761H11.0097C12.1142 5.12761 13.468 5.89682 14.0335 6.8457L16.5089 11H21.0097C21.562 11 22.0097 11.4477 22.0097 12C22.0097 12.5523 21.562 13 21.0097 13H16.4138L13.9383 17.1543C13.3729 18.1032 12.0191 18.8724 10.9145 18.8724H8.91454L12.4138 13H5.42485L3.99036 15.4529H1.99036L4.00967 12L4.00967 11.967L2.00967 8.54712H4.00967L5.44417 11H12.5089L9.00967 5.12761Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="md:w-2/3" />
          </div>
          <div className="text-left text-base">
            {emailSentSuccess && (
              <p className="text-green-500 font-semibold text-sm my-2">
                Thank you for contacting me!
              </p>
            )}
            {emailSentFailed && (
            <p className="text-red-500 dark:text-red-300">
              Your message failed to deliver, please try again or contact through
              <a href="http://linkedin.com/in/pennowtech" className="text-blue-500 dark:text-pink-400 font-semibold">&nbsp;linkedin</a>
              .
            </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;
