const Login = () => (
  <div className="bg-white shadow rounded-lg lg:flex items-center justify-center md:mt-0 w-full lg:max-w-screen-lg 2xl:max:max-w-screen-lg xl:p-0 md:mx-auto">
    <div className="hidden lg:flex w-2/3 max-h-[450px]">
      <img
        className="rounded-l-lg"
        src="https://flowbite.com/application-ui/demo/images/authentication/login.jpg"
        alt="login image"
      />
    </div>
    <div className="w-full p-6 sm:p-8 lg:p-16 lg:py-0 space-y-8">
      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
        Sign in to patform
      </h2>
      <form className="mt-8 space-y-6" action="#">
        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-900 block mb-2"
          >
            Your email
          </label>
          <input
            type="email"
            name="email"
            id="loginemail"
            className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="name@company.com"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-900 block mb-2"
          >
            Your password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder=""
            className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            required
          />
        </div>
        <div className="flex items-start">
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
        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base px-5 py-3 w-full sm:w-auto text-center"
        >
          Login to your account
        </button>
        <div className="text-sm font-medium text-gray-500">
          Not registered?
          {' '}
          <a className="text-blue-700 hover:underline">Create account</a>
        </div>
      </form>
    </div>
  </div>
);

export default Login;
