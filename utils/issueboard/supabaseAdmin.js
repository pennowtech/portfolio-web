import { createClient } from '@supabase/supabase-js';

let adminClient;

export const isIssueboardSupabaseConfigured = () =>
  Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

const requiredServerVariable = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
};

export const getIssueboardSupabaseAdmin = () => {
  if (typeof window !== 'undefined') throw new Error('The Supabase admin client is server-only.');
  if (adminClient) return adminClient;

  const url = requiredServerVariable('SUPABASE_URL');
  const serviceRoleKey = requiredServerVariable('SUPABASE_SERVICE_ROLE_KEY');
  adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'portfolio-web-issueboard-server' } }
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
  const unavailable = unavailableCodes.has(error?.code) || error?.name === 'TypeError';
  return {
    status: unavailable ? 503 : 500,
    code: unavailable ? 'DATASTORE_UNAVAILABLE' : 'DATASTORE_ERROR',
    message: unavailable
      ? 'Issue management is temporarily unavailable. Your changes have not been discarded.'
      : 'The issue-management request could not be completed.'
  };
};
