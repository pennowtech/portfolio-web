import { createHash, randomUUID } from 'node:crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';
import { getIssueboardSupabaseAdmin } from './supabaseAdmin';
import { isSameOriginRequest } from '@utils/requestSecurity';

export const prepareIssueboardApiResponse = (res) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
};

export const allowIssueboardMethods = (req, res, methods) => {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } });
  return false;
};

export const requireIssueboardAdminApi = async (req, res) => {
  prepareIssueboardApiResponse(res);
  if (isIssueboardDevAuthBypassEnabled()) return { email: issueboardDevIdentity, developmentBypass: true };

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isAdminSession(session)) {
      res
        .status(401)
        .json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Administrator authentication is required.' } });
      return null;
    }
    return { email: session.user.email, developmentBypass: false };
  } catch {
    res
      .status(401)
      .json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Administrator authentication is required.' } });
    return null;
  }
};

export const issueboardRequestId = (req) => {
  const supplied = req.headers['x-request-id'];
  return typeof supplied === 'string' && /^[a-zA-Z0-9._:-]{1,100}$/.test(supplied) ? supplied : randomUUID();
};

export const requireSameOriginMutation = (req, res) => {
  if (isSameOriginRequest(req)) return true;
  res.status(403).json({ ok: false, error: { code: 'INVALID_ORIGIN', message: 'A same-origin request is required.' } });
  return false;
};

export const consumeIssueboardRateLimit = async ({ actor, operation, limit = 20, windowSeconds = 60 }) => {
  const actorHash = createHash('sha256').update(actor.toLowerCase()).digest('hex');
  const { data, error } = await getIssueboardSupabaseAdmin().rpc('issueboard_consume_rate_limit', {
    target_bucket_key: `${operation}:${actorHash}`,
    request_limit: limit,
    window_seconds: windowSeconds
  });
  if (error) throw error;
  return data === true;
};
