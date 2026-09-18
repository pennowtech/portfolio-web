import { setIssueWorkState } from '@utils/issueboard/issueService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { setIssueWorkStateSchema, validationErrorResponse } from '@utils/issueboard/validation';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

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
  if (!match)
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid issue key.' } });
  const [, projectKey, issueNumberText] = match;

  const parsed = setIssueWorkStateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'issues:set-work-state',
      limit: 60,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const issue = await setIssueWorkState(projectKey, Number(issueNumberText), parsed.data.workState, actor.email);
    if (!issue)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
    return res.status(200).json({ ok: true, requestId, issue });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
