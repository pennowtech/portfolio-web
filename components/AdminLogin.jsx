import React from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

const AdminLogin = () => {
  const { query } = useRouter();
  const accessDenied = query.error === 'AccessDenied';

  return (
    <main className='mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16'>
      <section className='w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800 md:p-9'>
        <p className='mb-2 font-Monda text-sm font-medium uppercase tracking-[0.16em] text-green-700 dark:text-green-400'>
          Private workspace
        </p>
        <h1 className='font-Neuton text-4xl font-semibold text-slate-900 dark:text-white'>Author sign in</h1>
        <p className='mt-3 text-base text-slate-600 dark:text-slate-300'>
          Continue with the single Google account approved for SinghBuildsTech publishing.
        </p>
        {accessDenied && (
          <p className='mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200'>
            That Google account is not authorized for this workspace.
          </p>
        )}
        <button
          type='button'
          onClick={() => signIn('google', { callbackUrl: '/admin/articles/new' })}
          className='mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 font-Monda font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700'
        >
          <span aria-hidden='true' className='text-lg'>
            G
          </span>
          Continue with Google
        </button>
      </section>
    </main>
  );
};

export default AdminLogin;
