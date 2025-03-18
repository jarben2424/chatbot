-- Add missing previousVersion and chatId columns to Document table
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "previousVersion" uuid;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "chatId" uuid;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'text' NOT NULL;

-- Rename text column to kind if it exists (if migration 0004 created the wrong column name)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'Document' AND column_name = 'text') THEN
    ALTER TABLE "Document" RENAME COLUMN "text" TO "kind";
  END IF;
END
$$; 