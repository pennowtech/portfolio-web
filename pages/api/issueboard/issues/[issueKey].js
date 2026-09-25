import { deleteIssue, getIssueByKey, updateIssue } from '@utils/issueboard/issueService';
import { getProjectByKey, listStatuses } from '@utils/issueboard/projectService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { updateIssueSchema, validationErrorResponse } from '@utils/issueboard/validation';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

const sendDatastoreError = (res, requestId, error) => {
  const normalized = normalizeIssueboardDatastoreError(error);
  return res
    .status(normalized.status)
    .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
};

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['GET', 'PATCH', 'DELETE'])) return;
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
      const [issue, project] = await Promise.all([getIssueByKey(projectKey, issueNumber), getProjectByKey(projectKey)]);
      if (!issue || !project)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
      const statuses = await listStatuses(project.id);
      return res.status(200).json({ ok: true, requestId, issue, statuses });
    } catch (error) {
      return sendDatastoreError(res, requestId, error);
    }
  }

  if (!requireSameOriginMutation(req, res)) return;

  if (req.method === 'DELETE') {
    try {
      const allowed = await consumeIssueboardRateLimit({
        actor: actor.email,
        operation: 'issues:delete',
        limit: 30,
        windowSeconds: 60
      });
      if (!allowed)
        return res.status(429).json({
          ok: false,
          requestId,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
        });
      const result = await deleteIssue(projectKey, issueNumber, actor.email);
      if (!result)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
      return res.status(200).json({ ok: true, requestId, ...result });
    } catch (error) {
      return sendDatastoreError(res, requestId, error);
    }
  }

  const parsed = updateIssueSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'issues:update',
      limit: 60,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many update attempts. Try again shortly.' }
      });
    const issue = await updateIssue(projectKey, issueNumber, parsed.data, actor.email);
    if (!issue)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
    return res.status(200).json({ ok: true, requestId, issue });
  } catch (error) {
    if (error?.message?.includes('CONFLICT'))
      return res.status(409).json({
        ok: false,
        requestId,
        error: { code: 'CONFLICT', message: 'This issue changed since it was loaded. Reload and try again.' }
      });
    if (error?.message?.includes('Status not found'))
      return res.status(400).json({
        ok: false,
        requestId,
        error: { code: 'INVALID_STATUS', message: 'The selected status does not belong to this project.' }
      });
    return sendDatastoreError(res, requestId, error);
  }
}
