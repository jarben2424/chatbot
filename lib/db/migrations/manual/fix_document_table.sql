-- Add missing previousVersion and chatId columns to Document table
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "previousVersion" uuid;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "chatId" uuid;

-- Ensure the kind column is set correctly
ALTER TABLE "Document" 
  ALTER COLUMN "kind" TYPE varchar,
  ALTER COLUMN "kind" SET NOT NULL,
  ALTER COLUMN "kind" SET DEFAULT 'text';

-- Add visualization as a valid kind if it doesn't already exist
-- (This is a no-op if text is already 'visualization', but harmless)
UPDATE "Document" 
SET "kind" = 'visualization' 
WHERE "kind" = 'text' AND "content" LIKE '%"visualization":%'; 