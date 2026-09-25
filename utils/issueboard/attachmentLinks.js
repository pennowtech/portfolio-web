import { createHmac, timingSafeEqual } from 'node:crypto';

// GitHub issues can't host images through the API, and the issueboard bucket is private, so the signed
// storage URLs (5-minute lifetime) would break in a GitHub issue almost immediately. Instead the issue links to
// a stable URL on this site whose signature proves the link was minted by the server; opening it redirects to a
// fresh short-lived signed URL. The image bytes stay in Supabase Storage -- only the link is permanent.

const SITE_ORIGIN = 'https://singhbuildstech.com';

export const siteOrigin = () => (process.env.NEXT_PUBLIC_SITE_URL || SITE_ORIGIN).trim().replace(/\/+$/, '');

// Derived from the auth secret so no new environment variable is needed; the derivation label keeps the
// signing key distinct from anything else that secret is used for.
const signingKey = () => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update('issueboard-attachment-link-v1').digest();
};

const signatureFor = (attachmentId) => {
  const key = signingKey();
  if (!key) return null;
  return createHmac('sha256', key).update(String(attachmentId)).digest('base64url').slice(0, 43);
};

export const isAttachmentLinkSignatureValid = (attachmentId, signature) => {
  const expected = signatureFor(attachmentId);
  if (!expected || typeof signature !== 'string' || signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

// null when the server has no secret to sign with.
export const stableAttachmentUrl = (attachmentId) => {
  const signature = signatureFor(attachmentId);
  if (!signature) return null;
  return `${siteOrigin()}/api/attachment-link/${attachmentId}?sig=${signature}`;
};

export const issueTicketUrl = (issueKey) => `${siteOrigin()}/admin/issues/${encodeURIComponent(issueKey)}`;
