import { createClient } from '@supabase/supabase-js';

let adminClient;

export const isIssueboardSupabaseConfigured = () =>
  Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

const requiredServerVariable = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
};

// Vercel functions are killed after 10 s, and a reused connection that went stale while the function instance was
// frozen makes a query hang until that limit (a 504 with no useful error). Data requests therefore get a short
// deadline, and reads -- which are safe to repeat -- get one retry on a fresh connection. Storage transfers can
// legitimately take longer, so they are left alone.
const DATA_REQUEST_TIMEOUT_MS = 4000;

const fetchWithDeadline = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || String(input);
  if (url.includes('/storage/v1/')) return fetch(input, init);

  const method = String(init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();
  const attempts = method === 'GET' || method === 'HEAD' ? 2 : 1;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DATA_REQUEST_TIMEOUT_MS);
    // Keep any signal the caller passed working too.
    init.signal?.addEventListener?.('abort', () => controller.abort(), { once: true });
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      lastError = error;
      if (init.signal?.aborted) throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
};

export const getIssueboardSupabaseAdmin = () => {
  if (typeof window !== 'undefined') throw new Error('The Supabase admin client is server-only.');
  if (adminClient) return adminClient;

  const url = requiredServerVariable('SUPABASE_URL');
  const serviceRoleKey = requiredServerVariable('SUPABASE_SERVICE_ROLE_KEY');
  adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { fetch: fetchWithDeadline, headers: { 'X-Client-Info': 'portfolio-web-issueboard-server' } }
  });
  return adminClient;
};

export const normalizeIssueboardDatastoreError = (error) => {
  const unavailableCodes = new Set([
    '08000',
    '08001',
    '08003',
    '08006',
    '08007',
    '08P01',
    '53300',
    '57P01',
    '57P02',
    '57P03'
  ]);
  // postgrest-js reports a failed or aborted fetch as { message: 'AbortError: ...' } rather than throwing it.
  const unavailable =
    unavailableCodes.has(error?.code) ||
    error?.name === 'TypeError' ||
    error?.name === 'AbortError' ||
    /AbortError|fetch failed/i.test(String(error?.message || ''));
  return {
    status: unavailable ? 503 : 500,
    code: unavailable ? 'DATASTORE_UNAVAILABLE' : 'DATASTORE_ERROR',
    message: unavailable
      ? 'Issue management is temporarily unavailable. Your changes have not been discarded.'
      : 'The issue-management request could not be completed.'
  };
};
