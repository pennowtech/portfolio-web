/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/jsx-no-comment-textnodes */
import React, { useState } from 'react';
import Image from 'next/image';
import { useMutation } from 'urql';
import { LOGIN_WP_USER } from '../queries/queries';
import { useRouter } from 'next/router';
import { isEmpty } from 'lodash';
import { setToken, setLoggedUser } from '../utils/token';
import validateAndSanitizeLoginForm from '../utils/validate_login_form';
// SDSINGH:
// username: 'sdsingh.developer@gmail.com',
// password: 'eTR8b5AHG7',

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  const [errorMessage, setErrorMessage] = useState({ email: '', pwd: '' });

  const [res, executeLoginUser] = useMutation(LOGIN_WP_USER);
  const executeLogin = React.useCallback(() => {
    setErrorMessage({ email: '', pwd: '' });
    const validationResult = validateAndSanitizeLoginForm({ email, pwd });

    if (validationResult.isValid) {
      const { page } = router?.query ?? {};
      executeLoginUser({
        username: email,
        password: pwd,
      })
        .then((result) => {
          if (result.error) {
            console.error('Oh no!', result.error.message);
          }
          const token = result.data?.login?.authToken;
          const username = result.data?.login?.user?.name;
          if (token) {
            setToken(token);
            setLoggedUser(username);
            console.warn(username, ' logged in');
            router.push(page);
          }
          // console.error('Failed to login');
        });
    } else {
      const msg = { email: validationResult.errors.email, pwd: validationResult.errors.pwd };
      setErrorMessage(msg);
      console.error('SDSingh Error:', errorMessage);
    }
  }, [email, errorMessage, executeLoginUser, pwd, router]);
  //------------------------

  return (
    <div className="container text-center mx-auto">

      <div className="bg-white dark:bg-gray-500 shadow rounded-lg md:flex items-center justify-center md:mt-0 w-full lg:max-w-screen-lg 2xl:max:max-w-screen-lg md:mx-auto py-4 md:py-0 h-full">
        <div className="hidden relative ml-4 md:ml-0 md:flex w-2/3  h-80">
          <Image
            className="md:rounded-l-lg"
            src="/login.jpg"
            alt="login image"
            sizes="100%"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="w-full px-4 ">
          <p className="text-2xl lg:text-3xl font-bold text-gray-900">
            Sign in to platform
          </p>


          <div>
            <div className="my-3">
              <input
                type="email"
                name="email"
                id="loginemail"
                className="appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 rounded-lg py-2 px-4 leading-tight focus:outline-none border-secondary border-2 focus:bg-white border-gray-300 focus:border-gray-500"
                placeholder="Your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="my-3">
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Your password"
                className="appearance-none block w-full bg-gray-100 dark:bg-gray-300 text-gray-700 dark:border-gray-800 rounded-lg py-2 px-4 leading-tight focus:outline-none border-secondary border-2 focus:bg-white border-gray-300 focus:border-gray-500"
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>
            <div className="flex items-start my-3">
              <div className="flex items-center h-5">
                <input
                  id="remember"
                  aria-describedby="remember"
                  name="remember"
                  type="checkbox"
                  className="bg-gray-50 border-gray-300 focus:ring-3 focus:ring-blue-300 h-4 w-4 rounded"
                  required
                />
              </div>
              <div className="text-sm ml-3">
                <label htmlFor="remember" className="font-medium text-gray-900">
                  Remember me
                </label>
              </div>
              <a
                href="#"
                className="text-sm text-blue-700 hover:underline ml-auto"
              >
                Lost Password?
              </a>
            </div>
            <div className="grid font-Monda justify-center">
              <div className="button focus:shadow-outline cursor-pointer" onClick={executeLogin}>
                Login
              </div>
            </div>
          </div>
        </div>
      </div>
      {!isEmpty(errorMessage) && (
      <div
        className="text-red-600 dark:text-red-500"
        dangerouslySetInnerHTML={{
          __html: `${errorMessage.email} <br/> ${errorMessage.pwd}`,
        }}
      />
      )}
    </div>
  );
};
export default Login;
