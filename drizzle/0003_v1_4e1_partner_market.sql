-- V1.4E.1 — Partner Market Scope Foundation
-- Additive, non-destructive migration (ADD COLUMN IF NOT EXISTS).
-- Applied to the live Neon production database and mirrored in lib/db/schema.ts.
--
-- Adds a nullable "market" column to the Better Auth user table (public.user).
-- It records which market (domain) a partner/customer account belongs to:
--   monocool.at | monocool.sk | monocool.cz | monocool.eu
--
-- Foundation only: this migration does NOT enforce any access restrictions.
-- Admin accounts keep market = NULL and remain global.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "market" text;
