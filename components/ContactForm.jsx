import React from 'react';

function ContactForm() {
  return (
    <div className="relative py-16 ">
      <h2 className="flex justify-center lg:text-3xl text-bold leading-normal md:mt-20 mt-8">
        Want to Contact me?
      </h2>
      <p className="flex justify-center text-bold leading-normal md:mb-20 mb-8">Complete this form and I will get back to you.</p>
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
                type="text"
                placeholder="First Name"
              />
              <p className="text-red-500 text-xs italic">
                Please fill out this field.
              </p>
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
              />
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
              />

            </div>
          </div>
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label
                htmlFor="message"
                className="block uppercase tracking-wide text-xs font-bold mb-2"
                htmlFor="message"
              >
                Message
              </label>
              <textarea
                className="no-resize appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 border-4  rounded-lg  py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white border-gray-300 focus:border-gray-400 h-48 resize-none"
                id="message"
                name="message"
                placeholder="Hey, I would like to get in touch with you"
              />
            </div>
          </div>
          <div className="md:flex md:items-center">
            <div
              className="button focus:shadow-outline "
              type="button"
            >
              Submit
            </div>
            <div className="md:w-2/3" />
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;
