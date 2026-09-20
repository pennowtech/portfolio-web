import { timingSafeEqual } from 'node:crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isIssueboardDevAuthBypassEnabled, issueboardDevIdentity } from '@utils/issueboardAuth';

// Constant-time string compare -- a plain `===` on a secret leaks timing
// information proportional to the matching prefix length.
const secureEquals = (a, b) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
};

/**
 * Authenticates external API requests to the Issueboard.
 * Supports:
 * - Scoped Bearer API key (Authorization: Bearer <key>)
 * - Scoped header key (X-API-Key: <key>)
 * - Query parameter apiKey (?apiKey=<key>)
 * - Interactive NextAuth admin session (if calling from browser)
 * - Development auth bypass (when NODE_ENV=development and ISSUEBOARD_DEV_AUTH_BYPASS=true)
 *
 * Deliberately does NOT fall back to NEXTAUTH_SECRET: that secret signs session
 * JWTs for the whole site, and treating it as a shareable API credential would
 * multiply its exposure. A missing ISSUEBOARD_API_KEY means the API-key path is
 * simply unavailable, not silently backed by a more sensitive secret.
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
  if (configuredKey && token && secureEquals(token, configuredKey)) {
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
