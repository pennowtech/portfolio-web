export const isSameOriginRequest = (req) => {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === String(host).split(',')[0].trim();
  } catch {
    return false;
  }
};
