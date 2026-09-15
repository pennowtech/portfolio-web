# Issueboard Supabase migrations

This directory contains the versioned database and private-storage foundation for the issueboard. The migration is intentionally closed to `anon` and `authenticated`; the Next.js server validates the NextAuth administrator session and then uses the server-only Supabase service role.

Do not paste production credentials into this repository. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in local ignored environment files and Vercel's encrypted environment settings.

Apply migrations to a dedicated development Supabase project first. Review the generated diff, test rollback/recovery from a backup, and only then promote the same migration to production. The migration creates the private `issueboard-private` bucket but deliberately creates no public object policy.
