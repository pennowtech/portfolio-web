import cookie from 'cookie';

export default async function login(req, res) {
  const { email, pwd } = req?.body ?? {};
  // const result = await loginUser({ email, pwd });
  const result = undefined;
  const token = result?.data?.login?.authToken;
  const username = result.data?.login?.user?.name;
  /**
     * Note when you run 'npm run start' locally, cookies won't be
     * set, because locally process.env.NODE_ENV = 'production'
     * so secure will be true, but it will still be http and not
     * https , when tested locally.
     * So when testing locally both in dev and prod, set the value
     * of 'secure' to be false.
     */
  res.setHeader('Set-Cookie', cookie.serialize('auth', String(token ?? ''), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  }));

  // Only sending a message that successful, because we dont want to send JWT to client.
  res.status(200).json({ success: Boolean(token), username });
}
