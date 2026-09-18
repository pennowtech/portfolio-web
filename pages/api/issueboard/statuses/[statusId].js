import { deleteStatus, updateStatus } from '@utils/issueboard/projectService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { updateStatusSchema, validationErrorResponse } from '@utils/issueboard/validation';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['PATCH', 'DELETE'])) return;
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

  const statusId = String(req.query.statusId || '');
  if (!uuidPattern.test(statusId))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid status id.' } });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'statuses:mutate',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });

    if (req.method === 'DELETE') {
      const deleted = await deleteStatus(statusId, actor.email);
      if (!deleted)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'STATUS_NOT_FOUND', message: 'Status not found.' } });
      return res.status(200).json({ ok: true, requestId });
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });
    const status = await updateStatus(statusId, parsed.data, actor.email);
    if (!status)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'STATUS_NOT_FOUND', message: 'Status not found.' } });
    return res.status(200).json({ ok: true, requestId, status });
  } catch (error) {
    if (error?.message?.includes('STATUS_IN_USE'))
      return res.status(409).json({
        ok: false,
        requestId,
        error: { code: 'STATUS_IN_USE', message: 'This status has issues assigned to it and cannot be deleted.' }
      });
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
