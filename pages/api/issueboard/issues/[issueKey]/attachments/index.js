import { authorizeUpload, listAttachments } from '@utils/issueboard/attachmentService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { authorizeUploadSchema, validationErrorResponse } from '@utils/issueboard/validation';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

const ERROR_MESSAGES = {
  ISSUE_NOT_FOUND: ['ISSUE_NOT_FOUND', 404, 'Issue not found.'],
  UNSUPPORTED_TYPE: ['UNSUPPORTED_TYPE', 400, 'Only JPEG, PNG, or WebP images are accepted.'],
  TOO_LARGE: ['TOO_LARGE', 400, 'Compressed image must be 1 MB or smaller.']
};

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['GET', 'POST'])) return;
  const requestId = issueboardRequestId(req);
  res.setHeader('X-Request-Id', requestId);

  if (!isIssueboardSupabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      requestId,
      error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
    });
  }

  const issueKey = String(req.query.issueKey || '').toUpperCase();
  const match = issueKeyPattern.exec(issueKey);
  if (!match)
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid issue key.' } });
  const [, projectKey, issueNumberText] = match;
  const issueNumber = Number(issueNumberText);

  if (req.method === 'GET') {
    try {
      const attachments = await listAttachments(projectKey, issueNumber);
      if (attachments === null)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
      return res.status(200).json({ ok: true, requestId, attachments });
    } catch (error) {
      const normalized = normalizeIssueboardDatastoreError(error);
      return res
        .status(normalized.status)
        .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
    }
  }

  if (!requireSameOriginMutation(req, res)) return;
  const parsed = authorizeUploadSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'attachments:authorize',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many upload requests. Try again shortly.' }
      });
    const result = await authorizeUpload(projectKey, issueNumber, parsed.data, actor.email);
    if (result.error) {
      const [code, status, message] = ERROR_MESSAGES[result.error];
      return res.status(status).json({ ok: false, requestId, error: { code, message } });
    }
    return res.status(201).json({
      ok: true,
      requestId,
      attachmentId: result.attachmentId,
      objectPath: result.objectPath,
      signedUrl: result.signedUrl,
      token: result.token
    });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
