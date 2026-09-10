import { allowIssueboardMethods, issueboardRequestId, requireIssueboardAdminApi } from '@utils/issueboard/api';
import {
  getIssueboardSupabaseAdmin,
  isIssueboardSupabaseConfigured,
  normalizeIssueboardDatastoreError
} from '@utils/issueboard/supabaseAdmin';

const EXPECTED_SCHEMA_VERSION = '20260910130000';

const unavailableComponent = { status: 'unavailable' };

export default async function handler(req, res) {
  const actor = await requireIssueboardAdminApi(req, res);
  if (!actor || !allowIssueboardMethods(req, res, ['GET'])) return;

  const requestId = issueboardRequestId(req);
  res.setHeader('X-Request-Id', requestId);

  if (!isIssueboardSupabaseConfigured()) {
    return res.status(503).json({
      ok: false,
      requestId,
      checkedAt: new Date().toISOString(),
      status: 'unconfigured',
      components: { database: unavailableComponent, storage: unavailableComponent, schema: unavailableComponent },
      error: { code: 'DATASTORE_UNAVAILABLE', message: 'Issue management storage is not configured.' }
    });
  }

  try {
    const supabase = getIssueboardSupabaseAdmin();
    const [schemaResult, bucketResult] = await Promise.allSettled([
      supabase
        .from('issueboard_schema_versions')
        .select('version')
        .order('applied_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.storage.getBucket('issueboard-private')
    ]);

    const schemaResponse = schemaResult.status === 'fulfilled' ? schemaResult.value : { error: schemaResult.reason };
    const bucketResponse = bucketResult.status === 'fulfilled' ? bucketResult.value : { error: bucketResult.reason };
    const databaseReady = !schemaResponse.error;
    const schemaCurrent = databaseReady && schemaResponse.data?.version === EXPECTED_SCHEMA_VERSION;
    const storageReady = !bucketResponse.error && bucketResponse.data?.public === false;
    const ready = databaseReady && schemaCurrent && storageReady;

    return res.status(ready ? 200 : 503).json({
      ok: ready,
      requestId,
      checkedAt: new Date().toISOString(),
      status: ready ? 'ready' : 'degraded',
      components: {
        database: { status: databaseReady ? 'ready' : 'unavailable' },
        storage: { status: storageReady ? 'ready' : 'unavailable', private: storageReady },
        schema: {
          status: schemaCurrent ? 'current' : databaseReady ? 'migration_required' : 'unavailable',
          version: schemaResponse.data?.version || null,
          expectedVersion: EXPECTED_SCHEMA_VERSION
        }
      },
      ...(!ready && {
        error: { code: 'DATASTORE_UNAVAILABLE', message: 'One or more issue-management services are unavailable.' }
      })
    });
  } catch (error) {
    const normalized = normalizeIssueboardDatastoreError(error);
    return res.status(normalized.status).json({
      ok: false,
      requestId,
      checkedAt: new Date().toISOString(),
      status: 'unavailable',
      components: { database: unavailableComponent, storage: unavailableComponent, schema: unavailableComponent },
      error: { code: normalized.code, message: normalized.message }
    });
  }
}
