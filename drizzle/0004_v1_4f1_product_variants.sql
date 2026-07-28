-- V1.4F.1 — Product Variants (backend + admin)
-- Additive, non-destructive migration.
-- NOT YET APPLIED to the live Neon database — awaiting explicit approval.
--
-- Adds a child table "product_variant". A product can have multiple variants /
-- power versions (e.g. "Reverso FS 200", "Reverso FS 400"). Variants belong to
-- the parent product and inherit its market/domain (no domain column here).
-- ON DELETE CASCADE: deleting a product removes its variants automatically.
--
-- Products without variants are unaffected and keep their existing price
-- behavior. The public frontend is NOT changed in this version.

CREATE TABLE IF NOT EXISTS "product_variant" (
  "id" serial PRIMARY KEY NOT NULL,
  "productId" integer NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sku" text,
  "price" numeric(10, 2),
  "coolingOutput" text,
  "heatingOutput" text,
  "technicalData" text,
  "specs" jsonb,
  "isActive" boolean NOT NULL DEFAULT true,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Fast lookup of a product's variants (used by admin + later frontend).
CREATE INDEX IF NOT EXISTS "product_variant_productId_idx"
  ON "product_variant" ("productId");
