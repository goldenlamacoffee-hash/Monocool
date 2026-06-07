-- V1.3B — CMS Technical Foundation + Admin Hardening
-- Additive, non-destructive migration (all ADD COLUMN IF NOT EXISTS).
-- Applied to the live Neon production database and mirrored in lib/db/schema.ts.

-- 1. Better Auth admin plugin fields (were declared in Drizzle but missing in live DB)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;

-- 2. SEO foundation fields
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "seoTitle" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "seoDescription" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "ogImage" text;

ALTER TABLE "cms_content" ADD COLUMN IF NOT EXISTS "seoTitle" text;
ALTER TABLE "cms_content" ADD COLUMN IF NOT EXISTS "seoDescription" text;
ALTER TABLE "cms_content" ADD COLUMN IF NOT EXISTS "ogImage" text;

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seoTitle" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seoDescription" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "ogImage" text;
