-- V1.4G.1 — B2B Order Foundation
-- Additive only: ALTER TABLE ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS,
-- CREATE INDEX IF NOT EXISTS. No DROP, no destructive rename.
-- DO NOT apply to production without explicit approval.

-- ─── A. Extend existing `order` table ────────────────────────────────────────
-- Preserve every existing column (id, orderNumber, userId, status, items,
-- subtotal, tax, total, shippingAddress, billingAddress, notes,
-- createdAt, updatedAt). All new columns are nullable / have defaults so that
-- existing rows remain readable after the migration.

ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "market"          text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "currency"        text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paymentStatus"   text NOT NULL DEFAULT 'unpaid';
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customerPoNumber" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customerNote"    text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "adminNote"       text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "discountTotal"   numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "vatTotal"        numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "grandTotal"      numeric(12,2);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "proformaNumber"  text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceNumber"   text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "confirmedAt"     timestamp;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paidAt"         timestamp;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "shippedAt"      timestamp;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "completedAt"    timestamp;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "cancelledAt"    timestamp;

CREATE INDEX IF NOT EXISTS "order_market_idx"         ON "order" ("market");
CREATE INDEX IF NOT EXISTS "order_status_idx"         ON "order" ("status");
CREATE INDEX IF NOT EXISTS "order_paymentStatus_idx"  ON "order" ("paymentStatus");
CREATE INDEX IF NOT EXISTS "order_userId_idx"         ON "order" ("userId");

-- ─── B. New `order_item` table ────────────────────────────────────────────────
-- Immutable price + product snapshots. productId / variantId are nullable so
-- that historical rows remain valid if the referenced product is later deleted.

CREATE TABLE IF NOT EXISTS "order_item" (
  "id"              serial PRIMARY KEY,
  "orderId"         integer NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "productId"       integer REFERENCES "product"("id") ON DELETE SET NULL,
  "variantId"       integer REFERENCES "product_variant"("id") ON DELETE SET NULL,
  "productName"     text NOT NULL,
  "variantName"     text,
  "sku"             text,
  "quantity"        integer NOT NULL,
  "baseUnitPrice"   numeric(12,2) NOT NULL,
  "discountPercent" numeric(5,2)  NOT NULL,
  "finalUnitPrice"  numeric(12,2) NOT NULL,
  "vatRate"         numeric(5,2)  NOT NULL,
  "vatAmount"       numeric(12,2) NOT NULL,
  "lineSubtotal"    numeric(12,2) NOT NULL,
  "lineTotal"       numeric(12,2) NOT NULL,
  "createdAt"       timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "order_item_orderId_idx" ON "order_item" ("orderId");

-- ─── C. Extend `site_settings` table ─────────────────────────────────────────
-- All nullable — admin must configure before any document generation.

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "iban"               text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bic"                text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bankName"           text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "currency"           text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "vatRate"            numeric(5,2);
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "invoicePrefix"      text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "proformaPrefix"     text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "nextInvoiceNumber"  integer NOT NULL DEFAULT 1;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "nextProformaNumber" integer NOT NULL DEFAULT 1;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "paymentDueDays"     integer;
