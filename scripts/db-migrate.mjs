// Applies supabase/migrations/*.sql directly against Postgres, in filename order,
// tracking applied migrations in a schema_migrations table. Use this instead of
// `supabase db push` when the Supabase CLI's Management API is unreachable
// (e.g. corporate TLS-inspecting proxies blocking its Go HTTP client) — this
// script connects straight to Postgres on port 5432, which is unaffected.
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

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password: dbPassword,
  database: 'postgres',
  ssl: { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true },
});

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  await client.connect();
  await client.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const { rows: appliedRows } = await client.query('select name from public.schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await client.end();
    return;
  }

  console.log(`Pending migrations:\n${pending.map((f) => `  - ${f}`).join('\n')}`);

  if (dryRun) {
    console.log('\n--dry-run: not applying.');
    await client.end();
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`\nApplying ${file} ...`);
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into public.schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log(`  OK`);
    } catch (err) {
      await client.query('rollback');
      console.error(`  FAILED: ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log('\nAll pending migrations applied.');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
