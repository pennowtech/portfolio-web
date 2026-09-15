import { startSprint } from '@utils/issueboard/sprintService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { startSprintSchema, validationErrorResponse } from '@utils/issueboard/validation';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const sprintId = String(req.query.sprintId || '');
  if (!uuidPattern.test(sprintId))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid sprint id.' } });

  const parsed = startSprintSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'sprints:start',
      limit: 20,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });
    const sprint = await startSprint(sprintId, parsed.data, actor.email);
    return res.status(200).json({ ok: true, requestId, sprint });
  } catch (error) {
    if (error?.message?.includes('EMPTY_SPRINT'))
      return res.status(409).json({
        ok: false,
        requestId,
        error: {
          code: 'EMPTY_SPRINT',
          message: 'No issues are planned in this sprint. Confirm to start it empty.'
        }
      });
    if (error?.message?.includes('Only a planned sprint') || error?.message?.includes('valid start date'))
      return res
        .status(400)
        .json({ ok: false, requestId, error: { code: 'INVALID_SPRINT_STATE', message: error.message } });
    if (error?.code === '23505')
      return res.status(409).json({
        ok: false,
        requestId,
        error: { code: 'SPRINT_ALREADY_ACTIVE', message: 'Another sprint is already active for this project.' }
      });
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
