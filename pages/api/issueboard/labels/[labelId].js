import { deleteLabel, updateLabel } from '@utils/issueboard/labelService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { updateLabelSchema, validationErrorResponse } from '@utils/issueboard/validation';

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

  const labelId = String(req.query.labelId || '');
  if (!uuidPattern.test(labelId))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid label id.' } });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'labels:mutate',
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
      const deleted = await deleteLabel(labelId, actor.email);
      if (!deleted)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'LABEL_NOT_FOUND', message: 'Label not found.' } });
      return res.status(200).json({ ok: true, requestId });
    }

    const parsed = updateLabelSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });
    const label = await updateLabel(labelId, parsed.data, actor.email);
    if (!label)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'LABEL_NOT_FOUND', message: 'Label not found.' } });
    return res.status(200).json({ ok: true, requestId, label });
  } catch (error) {
    if (error.code === 'LABEL_EXISTS')
      return res.status(409).json({
        ok: false,
        requestId,
        error: { code: 'LABEL_EXISTS', message: 'A label with this name already exists in this project.' }
      });
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
