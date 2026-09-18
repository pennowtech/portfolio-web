import {
  createLinkedSubtask,
  linkExistingSubtask,
  resolveChecklistItemProjectKey,
  unlinkSubtask
} from '@utils/issueboard/checklistService';
import {
  allowIssueboardMethods,
  consumeIssueboardRateLimit,
  issueboardRequestId,
  requireIssueboardAdminApi,
  requireSameOriginMutation
} from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';
import { linkChecklistItemSubtaskSchema, validationErrorResponse } from '@utils/issueboard/validation';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

const sendDatastoreError = (res, requestId, error) => {
  const normalized = normalizeIssueboardDatastoreError(error);
  return res
    .status(normalized.status)
    .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
};

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['POST', 'PUT', 'DELETE'])) return;
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

  const itemId = String(req.query.itemId || '');
  if (!uuidPattern.test(itemId))
    return res
      .status(400)
      .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid checklist item id.' } });

  try {
    const allowed = await consumeIssueboardRateLimit({
      actor: actor.email,
      operation: 'checklist-items:link-subtask',
      limit: 30,
      windowSeconds: 60
    });
    if (!allowed)
      return res.status(429).json({
        ok: false,
        requestId,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }
      });

    const projectKey = await resolveChecklistItemProjectKey(itemId);
    if (!projectKey)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'ITEM_NOT_FOUND', message: 'Checklist item not found.' } });

    if (req.method === 'DELETE') {
      const item = await unlinkSubtask(itemId, actor.email);
      if (!item)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'ITEM_NOT_FOUND', message: 'Checklist item not found.' } });
      return res.status(200).json({ ok: true, requestId, item });
    }

    if (req.method === 'POST') {
      const issue = await createLinkedSubtask(projectKey, itemId, actor.email);
      if (!issue)
        return res
          .status(404)
          .json({ ok: false, requestId, error: { code: 'ITEM_NOT_FOUND', message: 'Checklist item not found.' } });
      return res.status(201).json({ ok: true, requestId, issue });
    }

    // PUT: link an existing subtask.
    const parsed = linkChecklistItemSubtaskSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ ok: false, requestId, error: validationErrorResponse(parsed.error) });
    const match = issueKeyPattern.exec(parsed.data.subtaskKey.toUpperCase());
    if (!match)
      return res
        .status(400)
        .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: 'Invalid subtask key.' } });

    const item = await linkExistingSubtask(projectKey, itemId, Number(match[2]), parsed.data.resolution, actor.email);
    if (!item)
      return res
        .status(404)
        .json({
          ok: false,
          requestId,
          error: { code: 'SUBTASK_NOT_FOUND', message: 'Subtask not found in this project.' }
        });
    return res.status(200).json({ ok: true, requestId, item });
  } catch (error) {
    if (error?.message?.includes('RESOLUTION_REQUIRED'))
      return res.status(409).json({
        ok: false,
        requestId,
        error: {
          code: 'RESOLUTION_REQUIRED',
          message: 'The checklist item and subtask have different completion states. Choose which one should win.'
        }
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
    if (
      error?.message?.includes('already linked') ||
      error?.message?.includes('must belong to the same issue') ||
      error?.message?.includes('Invalid resolution') ||
      error?.message?.includes('is not linked to a subtask')
    )
      return res
        .status(400)
        .json({ ok: false, requestId, error: { code: 'VALIDATION_ERROR', message: error.message } });
    return sendDatastoreError(res, requestId, error);
  }
}
