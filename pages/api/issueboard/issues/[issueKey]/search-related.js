import { searchIssues } from '@utils/issueboard/relationshipService';
import { getIssueByKey } from '@utils/issueboard/issueService';
import { allowIssueboardMethods, issueboardRequestId, requireIssueboardAdminApi } from '@utils/issueboard/api';
import { isIssueboardSupabaseConfigured, normalizeIssueboardDatastoreError } from '@utils/issueboard/supabaseAdmin';

const issueKeyPattern = /^([A-Z][A-Z0-9]{1,9})-(\d{1,10})$/;

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['GET'])) return;
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
  const query = String(req.query.q || '')
    .trim()
    .slice(0, 100);

  try {
    const issue = await getIssueByKey(projectKey, Number(issueNumberText));
    if (!issue)
      return res
        .status(404)
        .json({ ok: false, requestId, error: { code: 'ISSUE_NOT_FOUND', message: 'Issue not found.' } });
    const results = await searchIssues(projectKey, query, issue.id);
    return res.status(200).json({ ok: true, requestId, results });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res
      .status(normalized.status)
      .json({ ok: false, requestId, error: { code: normalized.code, message: normalized.message } });
  }
}
