import { deleteAttachment } from '@utils/issueboard/attachmentService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['DELETE'])) return;
  const requestId = issueboardRequestId(req);
  res.setHeader('X-Request-Id', requestId);

  if (!isIssueboardSupabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      requestId,
      error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
    });
  }

  if (!requireSameOriginMutation(req, res)) return;

  const issueKey = String(req.query.issueKey || '').toUpperCase();
  const match = issueKeyPattern.exec(issueKey);
  const attachmentId = String(req.query.attachmentId || '');
  if (!match || !uuidPattern.test(attachmentId))
    return res.status(400).json({
      ok: false,
      requestId,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid issue key or attachment id.' }
    });
  const [, projectKey, issueNumberText] = match;

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'attachments:delete',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const deleted = await deleteAttachment(projectKey, Number(issueNumberText), attachmentId, actor.email);
    if (!deleted)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found.' } });
    return res.status(200).json({ ok: true, requestId });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
