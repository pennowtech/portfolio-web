import { createIssue, listIssues } from '@utils/issueboard/issueService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { createIssueSchema, validationErrorResponse } from '@utils/issueboard/validation';

const sendDatastoreError = (res, requestId, error) => {
  const normalized = normalizeIssueboardDatastoreError(error);
  return res
    .status(normalized.status)
    .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
};

const projectKeyPattern = /^[A-Z][A-Z0-9]{1,9}$/;

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

  if (req.method === 'GET') {
    const projectKey = String(req.query.projectKey || '')
      .trim()
      .toUpperCase();
    if (!projectKeyPattern.test(projectKey))
      return res.status(400).json({
        ok: false,
        requestId,
        error: { code: 'VALIDATION_ERROR', message: 'A valid projectKey query parameter is required.' }
      });

    try {
      const issues = await listIssues({ projectKey });
      if (issues === null)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
      return res.status(200).json({ ok: true, requestId, issues });
    } catch (error) {
      return sendDatastoreError(res, requestId, error);
    }
  }

  if (!requireSameOriginMutation(req, res)) return;
  const parsed = createIssueSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'issues:create',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many issue creation attempts. Try again shortly.' }
      });
    const issue = await createIssue(parsed.data, actor.email);
    if (!issue)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
    return res.status(201).json({ ok: true, requestId, issue });
  } catch (error) {
    if (error?.message?.includes('Parent issue not found'))
      return res.status(400).json({
        ok: false,
        requestId,
        error: { code: 'INVALID_PARENT_ISSUE', message: 'The selected parent issue was not found in this project.' }
      });
    if (error?.message?.includes('NESTING_LIMIT'))
      return res.status(400).json({
        ok: false,
        requestId,
        error: {
          code: 'NESTING_LIMIT',
          message: 'That issue is already a subtask. Only one level of nesting is supported.'
        }
      });
    return sendDatastoreError(res, requestId, error);
  }
}
