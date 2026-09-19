import { setSprintBoardLayout } from '@utils/issueboard/projectService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { setSprintBoardLayoutSchema, validationErrorResponse } from '@utils/issueboard/validation';

const projectKeyPattern = /^[A-Z][A-Z0-9]{1,9}$/;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['PATCH', 'POST'])) return;
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

  const projectKey = String(req.query.projectKey || '')
    .trim()
    .toUpperCase();
  if (!projectKeyPattern.test(projectKey))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid project key.' } });

  const parsed = setSprintBoardLayoutSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'projects:board-layout',
      limit: 60,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });

    const project = await setSprintBoardLayout(projectKey, parsed.data.layout, actor.email);
    if (!project)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
    return res.status(200).json({ ok: true, requestId, project });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
