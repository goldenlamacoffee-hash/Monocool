-- V1.4J.1 — Per-market sequential order numbering
-- Additive only: ALTER TABLE ADD COLUMN IF NOT EXISTS. No DROP, no destructive
-- rename, no changes to nextInvoiceNumber / nextProformaNumber.
-- DO NOT apply to production without explicit approval.

-- ─── Extend `site_settings` with an independent order-number counter ────────
-- One row per domain already exists, so this counter is naturally
-- market-specific (monocool.sk / monocool.at / monocool.cz / monocool.eu each
-- get their own value). Existing rows receive the default of 115.

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "nextOrderNumber" integer NOT NULL DEFAULT 115;
