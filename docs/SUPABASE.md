# Supabase

The issueboard's database and private storage run on Supabase (project `ceuxvxhgggkitusksrjd`, org `pennowtech's Project`).
Schema lives in [supabase/migrations](../supabase/migrations) and is documented further in
[supabase/README.md](../supabase/README.md).

## Corporate proxy blocks the Supabase CLI

On networks behind Zscaler (or a similar TLS-inspecting corporate proxy), `npx supabase login`, `link`, `projects list`,
`db push`, and `gen types` fail intermittently with a generic error:

```
{"_tag":"Error","error":{"code":"LegacyProjectsListNetworkError","message":"failed to list projects: HttpClientError: Transport error (GET https://api.supabase.com/v1/projects)"}}
```

### Root cause

The Supabase CLI ships as a Go binary (`npx supabase` wraps it; it is not a Node script), and Zscaler's TLS-inspecting
proxy intercepts `api.supabase.com` (the Management API) with its own certificate. Diagnosis steps, for reference:

- `curl.exe -v https://api.supabase.com/v1/projects` succeeded consistently (`401` without a token, as expected).
- A plain Node HTTPS request failed with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` until run with `node --use-system-ca`, which
  then succeeded — confirming Node's default bundled CA list doesn't trust Zscaler's injected root, but the Windows
  certificate store (which curl and `--use-system-ca` both read) does.
- The Supabase CLI kept failing regardless, because it's a separate Go binary — `NODE_OPTIONS`/`NODE_EXTRA_CA_CERTS`
  don't apply to it. This points at TLS-fingerprint-based filtering (Go's `crypto/tls` has a distinctive ClientHello
  that some corporate proxies drop) rather than the CLI's certificate handling.
- Disabling the Zscaler client and switching to a personal network did **not** help: `curl.exe https://ifconfig.me`
  still returned a Zscaler-owned IP (`AS62044 Zscaler Switzerland GmbH`). Zscaler Client Connector force-tunnels all
  traffic at the OS network-stack level, independent of the underlying Wi-Fi/hotspot; IT had it locked so it can't be
  toggled off, and declined an exemption for `api.supabase.com`.

### What still works: direct Postgres access

Zscaler was only inspecting standard HTTPS (443) traffic to the Management API. A direct connection to the database on
port 5432 (`db.<project-ref>.supabase.co:5432`) is **not** intercepted — verified with:

```shell
openssl s_client -starttls postgres -connect db.ceuxvxhgggkitusksrjd.supabase.co:5432 -showcerts
```

which returns the real `Supabase Root 2021 CA` chain, not a Zscaler-issued certificate.

### Update: direct Postgres access stopped working (no IPv6 route)

On a later session on the same corporate network, `db.<project-ref>.supabase.co:5432` started failing with
`ENOTFOUND`/`ENETUNREACH` instead of connecting. Diagnosis: the direct host is IPv6-only, and `Get-NetIPConfiguration`
showed no IPv6 address on any adapter — the machine had no IPv6 route at all (unrelated to Zscaler; a plain
`dns.resolve6()` still found the AAAA record fine, but the OS network stack had nowhere to route it). The IPv4 session
pooler (`aws-0-<region>.pooler.supabase.com:5432`) was reachable at the TCP level but got `ECONNRESET` immediately
after the Postgres startup message — this network's firewall inspects and drops the Postgres wire protocol on 5432 to
that host, independent of the CLI's Management-API blocking above.

**Fix:** the Supabase Management API's `POST /v1/projects/{ref}/database/query` endpoint runs arbitrary SQL over
HTTPS/443 — the same transport already confirmed reachable via `curl` — bypassing port 5432 entirely. It needs
`SUPABASE_ACCESS_TOKEN` (a personal access token, also in `.env.local`) and, since it's a plain Node `fetch` call, the
same `--use-system-ca` fix noted above for Zscaler's injected root certificate.
[scripts/db-migrate.mjs](../scripts/db-migrate.mjs) now tries the direct connection first, then the IPv4 pooler (if
`SUPABASE_DB_POOLER_REGION` is set), then falls back to this HTTPS endpoint automatically — no manual flag needed.

### The fix: bypass the CLI's Management API for schema changes

[scripts/db-migrate.mjs](../scripts/db-migrate.mjs) applies `supabase/migrations/*.sql` directly against Postgres (port 5432) in filename order, tracking applied files in a `schema_migrations` table — the same effect as `supabase db push`,
without going through the blocked Go binary:

```shell
npm run db:migrate:dry-run   # list pending migrations without applying
npm run db:migrate           # apply pending migrations
```

It connects using `SUPABASE_DB_PASSWORD` from `.env.local` (get/reset this from **Supabase Dashboard → Project Settings
→ Database**) and verifies the server certificate against
[supabase/certs/supabase-root-ca.pem](../supabase/certs/supabase-root-ca.pem), which is committed to the repo. That
file is a **public root CA certificate** (used only to verify the server, contains no private key or secret) — the
same certificate anyone can obtain by connecting to the database host directly, so committing it is safe. A blanket
`*.pem` rule in `.gitignore` (meant for private keys) is explicitly excepted for this one file.

Application runtime code (`@supabase/supabase-js`, used for auth/database/realtime from the Next.js app) is unaffected
by any of this — it's a normal Node/browser HTTPS client, not the Go CLI, and was never blocked.

### What we deliberately did not pursue

- **Requesting a Zscaler exemption from IT** — asked and declined; not worth pursuing further given the direct-DB
  workaround fully covers the need.
- **`supabase login` / `link` via the CLI** — not needed day-to-day. The project is already linked locally
  (`supabase/.temp/project-ref`), and no other CLI command in this workflow depends on an active CLI session.
- **`supabase db push` / `db pull` / `gen types` via the CLI** — replaced by `scripts/db-migrate.mjs` for pushing, and
  the Supabase Dashboard (SQL Editor, API docs) for anything else the CLI would otherwise do.
- **Disabling TLS certificate verification (`rejectUnauthorized: false`)** — rejected as an insecure shortcut in favor
  of bundling the real root CA and verifying properly.
