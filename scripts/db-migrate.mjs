// Applies supabase/migrations/*.sql directly against Postgres, in filename order,
// tracking applied migrations in a schema_migrations table. Use this instead of
// `supabase db push` when the Supabase CLI's Management API is unreachable
// (e.g. corporate TLS-inspecting proxies blocking its Go HTTP client).
//
// Tries a direct Postgres connection first (port 5432, unaffected by HTTP(S)
// TLS inspection). Some corporate networks additionally have no IPv6 route
// (the direct host is IPv6-only) and deep-packet-inspect/reset the Postgres
// wire protocol on 5432 even to the IPv4 session pooler; when the direct
// connection fails with a network-level error, this falls back to the
// Supabase Management API's SQL endpoint (HTTPS/443, already proven
// reachable through the same proxy), executing each migration file as one
// query so it still runs atomically.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const projectRef = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  throw new Error('SUPABASE_DB_PASSWORD is not set in .env.local');
}

const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const caPath = path.join(rootDir, 'supabase', 'certs', 'supabase-root-ca.pem');

const NETWORK_ERROR_CODES = new Set(['ENETUNREACH', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH']);

const managementApiRunner = () => {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) throw new Error('SUPABASE_ACCESS_TOKEN is not set in .env.local (needed for the HTTPS fallback)');

  const query = async (sql) => {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || `Management API request failed (${response.status})`);
    return { rows: Array.isArray(payload) ? payload : [] };
  };

  return {
    kind: 'management-api',
    query,
    applyMigration: (sql) => query(`begin;\n${sql}\ncommit;`),
    end: async () => {},
  };
};

const directClientRunner = (host, user, ssl) => {
  const client = new Client({ host, port: 5432, user, password: dbPassword, database: 'postgres', ssl });
  return {
    kind: 'direct',
    connect: () => client.connect(),
    query: (sql) => client.query(sql),
    applyMigration: async (sql) => {
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw err;
      }
    },
    end: () => client.end(),
  };
};

async function resolveRunner() {
  const directHost = `db.${projectRef}.supabase.co`;
  const candidates = [
    directClientRunner(directHost, 'postgres', { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true }),
  ];
  if (process.env.SUPABASE_DB_POOLER_REGION) {
    candidates.push(
      directClientRunner(
        `aws-0-${process.env.SUPABASE_DB_POOLER_REGION}.pooler.supabase.com`,
        `postgres.${projectRef}`,
        { rejectUnauthorized: true }
      )
    );
  }

  for (const runner of candidates) {
    try {
      await runner.connect();
      return runner;
    } catch (err) {
      if (!NETWORK_ERROR_CODES.has(err.code)) throw err;
      console.log(`  (direct connection to this host unreachable: ${err.code}; trying next option)`);
    }
  }

  console.log('  Falling back to the Supabase Management API over HTTPS.');
  return managementApiRunner();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const redoIndex = process.argv.indexOf('--redo');
  const redoFile = redoIndex !== -1 ? process.argv[redoIndex + 1] : null;

  const runner = await resolveRunner();
  console.log(`Using ${runner.kind} connection.`);

  await runner.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  if (redoFile) {
    // Re-runs one already-applied migration file (e.g. `create or replace
    // function` bodies), for iterating on a migration before it's merged.
    // Unsafe to use once a migration is deployed elsewhere.
    await runner.query(`delete from public.schema_migrations where name = '${redoFile}'`);
    console.log(`Cleared applied record for ${redoFile}; it will be reapplied below.\n`);
  }

  const { rows: appliedRows } = await runner.query('select name from public.schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await runner.end();
    return;
  }

  console.log(`Pending migrations:\n${pending.map((f) => `  - ${f}`).join('\n')}`);

  if (dryRun) {
    console.log('\n--dry-run: not applying.');
    await runner.end();
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`\nApplying ${file} ...`);
    try {
      await runner.applyMigration(`${sql}\ninsert into public.schema_migrations (name) values ('${file}');`);
      console.log(`  OK`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      await runner.end();
      process.exit(1);
    }
  }

  console.log('\nAll pending migrations applied.');
  await runner.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
