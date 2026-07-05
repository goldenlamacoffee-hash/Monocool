-- V1.4B — B2B Partner Pricing
-- Additive, non-destructive migration (all ADD COLUMN IF NOT EXISTS).
-- Applied to the live Neon production database and mirrored in lib/db/schema.ts.
--
-- Adds per-partner discount fields to the Better Auth user table (public.user).
-- The discount is a percentage (0-100) applied server-side to every product's
-- base price for approved partner accounts. Resolved to 0 when null.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "discountPercent" numeric(5,2) DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "discountNote" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "partnerTier" text;
