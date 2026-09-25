import { getReadyImageAttachmentUrl } from '@utils/issueboard/attachmentService';
import { isAttachmentLinkSignatureValid } from '@utils/issueboard/attachmentLinks';
import { isIssueboardSupabaseConfigured } from '@utils/issueboard/supabaseAdmin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public on purpose: the signed `sig` query value is the credential. It only ever redirects to a short-lived
// signed download URL for one ready image; nothing is listed and no bytes pass through this function.
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const { id, sig } = req.query;
  // Same response for a bad id, a bad signature and a missing image, so links can't be probed.
  if (typeof id !== 'string' || !UUID.test(id) || !isAttachmentLinkSignatureValid(id, sig)) {
    return res.status(404).end();
  }
  if (!isIssueboardSupabaseConfigured()) return res.status(503).end();

  try {
    const url = await getReadyImageAttachmentUrl(id);
    if (!url) return res.status(404).end();
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Referrer-Policy', 'no-referrer');
    return res.redirect(302, url);
  } catch (error) {
    console.error('Attachment link failed:', error);
    return res.status(502).end();
  }
}
