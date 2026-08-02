-- V1.4H.1 — Partner impersonation
-- Adds the nullable impersonatedBy column required by Better Auth Admin plugin.
-- Additive only — no existing rows are modified.

ALTER TABLE "session"
  ADD COLUMN IF NOT EXISTS "impersonatedBy" text;
