-- V1.4F.2 — Product Documents & Downloads
-- Additive migration; does NOT touch any existing table or row.
-- NOT applied to production until manually approved.

CREATE TABLE IF NOT EXISTS "product_document" (
  "id"         serial PRIMARY KEY,
  "productId"  integer NOT NULL
               REFERENCES "product"("id") ON DELETE CASCADE,
  "title"      text NOT NULL,
  "type"       text NOT NULL,
  "language"   text NOT NULL,
  "fileUrl"    text NOT NULL,
  "pathname"   text NOT NULL,
  "fileName"   text,
  "fileSize"   integer,
  "isActive"   boolean NOT NULL DEFAULT true,
  "sortOrder"  integer NOT NULL DEFAULT 0,
  "createdAt"  timestamp NOT NULL DEFAULT now(),
  "updatedAt"  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "product_document_productId_idx"
  ON "product_document" ("productId");

CREATE INDEX IF NOT EXISTS "product_document_language_idx"
  ON "product_document" ("productId", "language", "isActive");
