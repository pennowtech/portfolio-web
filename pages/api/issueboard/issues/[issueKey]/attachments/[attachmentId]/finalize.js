import { finalizeUpload } from '@utils/issueboard/attachmentService';
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

const ERROR_MESSAGES = {
  ISSUE_NOT_FOUND: ['ISSUE_NOT_FOUND', 404, 'Issue not found.'],
  ATTACHMENT_NOT_FOUND: ['ATTACHMENT_NOT_FOUND', 404, 'Upload not found or already finalized.'],
  UPLOAD_NOT_FOUND: ['UPLOAD_NOT_FOUND', 400, 'The uploaded file could not be found in storage.'],
  SIZE_MISMATCH: ['SIZE_MISMATCH', 400, 'The uploaded file size is invalid.'],
  INVALID_IMAGE: ['INVALID_IMAGE', 400, 'The uploaded file is not a valid image.'],
  TYPE_MISMATCH: ['TYPE_MISMATCH', 400, 'The uploaded file does not match the declared image type.'],
  DIMENSIONS_INVALID: ['DIMENSIONS_INVALID', 400, 'The image dimensions are invalid or too large.']
};

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['POST'])) return;
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
      operation: 'attachments:finalize',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const result = await finalizeUpload(projectKey, Number(issueNumberText), attachmentId, actor.email);
    if (result.error) {
      const [code, status, message] = ERROR_MESSAGES[result.error];
      return res.status(status).json({ ok: false, requestId, error: { code, message } });
    }
    return res.status(200).json({ ok: true, requestId, attachment: result.attachment });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
