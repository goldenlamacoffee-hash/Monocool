-- V1.4I.1 — Internal product purchase costs (OWNER-ONLY)
-- Additive, non-destructive migration.
-- NOT YET APPLIED to the live Neon database — awaiting explicit approval.
--
-- Confidential Zymbo/supplier purchase costs, for Marek and Lenka (owner
-- admins) only. Deliberately isolated from the "product" and "product_variant"
-- tables so it can NEVER appear inside a `select().from(product)` /
-- `select().from(productVariant)` result. All reads and writes MUST go
-- through app/actions/internal-costs.ts, which calls assertOwnerAdmin() first
-- (see lib/owner-auth.ts). Ordinary admins, partners, and public users must
-- never be able to read this table.
--
-- variantId intentionally has NO foreign key to "product_variant". Migration
-- 0004 (product_variant) has NOT been applied to production yet; a hard FK
-- here would make this table's own creation fail — and take the base-product
-- cost feature down with it — until 0004 is applied. Referential integrity
-- for variantId is instead enforced in application code
-- (app/actions/internal-costs.ts verifies the variant exists and belongs to
-- the given product before every write, mirroring the existing
-- getOwnedVariant() pattern in app/actions/product-variants.ts). Once
-- migration 0004 is applied, variant cost rows work correctly; until then,
-- base-product costs (variantId IS NULL) work fully and variant cost writes
-- are rejected by the application guard with a clear "Variant not found"
-- error (there are simply no variant rows to reference yet).
--
-- One row per cost target:
--   variantId IS NULL  -> the base product's purchase cost
--   variantId = <id>   -> that specific variant's purchase cost
-- Partial unique indexes enforce at most one row per target.

CREATE TABLE IF NOT EXISTS "internal_product_cost" (
  "id" serial PRIMARY KEY NOT NULL,
  "productId" integer NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "variantId" integer,
  "supplier" text NOT NULL DEFAULT 'Zymbo',
  "purchasePrice" numeric(12, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "note" text,
  "updatedBy" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- At most one base-product cost row per product (variantId IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS "internal_product_cost_base_unique"
  ON "internal_product_cost" ("productId") WHERE "variantId" IS NULL;

-- At most one cost row per variant.
CREATE UNIQUE INDEX IF NOT EXISTS "internal_product_cost_variant_unique"
  ON "internal_product_cost" ("variantId") WHERE "variantId" IS NOT NULL;

-- Fast lookup of all cost rows for a product (used by getInternalProductCosts).
CREATE INDEX IF NOT EXISTS "internal_product_cost_productId_idx"
  ON "internal_product_cost" ("productId");
