-- V1.4J.3 — Per-market fixed delivery price + automatic basket/order total
-- Additive only: ALTER TABLE ADD COLUMN IF NOT EXISTS. No DROP, no destructive
-- rename, no changes to existing columns, no delivery methods/carriers/zones.
-- DO NOT apply to production without explicit approval.

-- ─── Extend `site_settings` with a market-configurable delivery price ───────
-- NET / excluding VAT. One row per domain already exists, so this is
-- naturally independent per market (monocool.sk / monocool.at / monocool.cz /
-- monocool.eu each get their own value). Existing rows default to 0.00
-- (free delivery) until an admin sets a real value.

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "deliveryPrice" numeric(12, 2) NOT NULL DEFAULT 0.00;

-- ─── Extend `order` with a frozen delivery snapshot ─────────────────────────
-- Captured at order-creation time from site_settings.deliveryPrice — never
-- recalculated from current settings later. Existing historical orders
-- default to 0/0, which does not change their historical grand totals.

ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "deliveryPrice" numeric(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "deliveryVatAmount" numeric(12, 2) NOT NULL DEFAULT 0.00;
