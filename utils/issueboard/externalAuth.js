import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';

/**
 * Authenticates external API requests to the Issueboard.
 * Supports:
 * - Scoped Bearer API key (Authorization: Bearer <key>)
 * - Scoped header key (X-API-Key: <key>)
 * - Query parameter apiKey (?apiKey=<key>)
 * - Interactive NextAuth admin session (if calling from browser)
 * - Development auth bypass (when NODE_ENV=development and ISSUEBOARD_DEV_AUTH_BYPASS=true)
 */
export const authenticateExternalApi = async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token && typeof req.headers['x-api-key'] === 'string') {
    token = req.headers['x-api-key'].trim();
  }
  if (!token && typeof req.query?.apiKey === 'string') {
    token = req.query.apiKey.trim();
  }

  const configuredKey = process.env.ISSUEBOARD_API_KEY?.trim();

  // 1. Valid API key match
  if (configuredKey && token && token === configuredKey) {
    return { ok: true, actor: 'api' };
  }

  // 2. Dev auth bypass in local development
  if (isIssueboardDevAuthBypassEnabled()) {
    return { ok: true, actor: issueboardDevIdentity };
  }

  // 3. NextAuth admin session
  try {
    const session = await getServerSession(req, res, authOptions);
    if (isAdminSession(session)) {
      return { ok: true, actor: session.user.email };
    }
  } catch {
    // ignore
  }

  // 4. Fallback to NEXTAUTH_SECRET if ISSUEBOARD_API_KEY is not explicitly set
  if (!configuredKey && process.env.NEXTAUTH_SECRET && token && token === process.env.NEXTAUTH_SECRET) {
    return { ok: true, actor: 'api' };
  }

  if (token) {
    return { ok: false, status: 401, error: 'Invalid API key provided.' };
  }

  return {
    ok: false,
    status: 401,
    error:
      'Authentication required. Provide an API key via Bearer token (Authorization: Bearer <key>) or X-API-Key header.'
  };
};
