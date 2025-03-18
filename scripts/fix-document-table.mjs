// Fix document table migration script using ESM and drizzle
import path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Load environment variables from .env file
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log('Starting document table migration...');
  
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not found, checking POSTGRES_URL');
    if (!process.env.POSTGRES_URL) {
      throw new Error('No database connection string found in environment variables');
    }
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }
  
  const connectionString = process.env.DATABASE_URL;
  console.log('Using connection string:', connectionString);
  
  // Create the postgres client
  const sql = postgres(connectionString, { ssl: process.env.NODE_ENV === 'production' });
  const db = drizzle(sql);
  
  try {
    console.log('Connected to database. Applying migrations...');
    
    // Execute raw SQL for the migration
    await sql.unsafe(`
      -- Add missing columns
      ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "previousVersion" uuid;
      ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "chatId" uuid;
      
      -- Fix the kind column
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'Document' AND column_name = 'kind') THEN
          ALTER TABLE "Document" 
            ALTER COLUMN "kind" TYPE varchar,
            ALTER COLUMN "kind" SET NOT NULL,
            ALTER COLUMN "kind" SET DEFAULT 'text';
        ELSE
          IF EXISTS (SELECT FROM information_schema.columns 
                    WHERE table_name = 'Document' AND column_name = 'text') THEN
            ALTER TABLE "Document" RENAME COLUMN "text" TO "kind";
            ALTER TABLE "Document" 
              ALTER COLUMN "kind" TYPE varchar,
              ALTER COLUMN "kind" SET NOT NULL,
              ALTER COLUMN "kind" SET DEFAULT 'text';
          ELSE
            ALTER TABLE "Document" ADD COLUMN "kind" varchar NOT NULL DEFAULT 'text';
          END IF;
        END IF;
      END
      $$;
      
      -- Update visualization documents
      UPDATE "Document" 
      SET "kind" = 'visualization' 
      WHERE "kind" = 'text' AND "content" LIKE '%"visualization":%';
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error in migration:', error);
  } finally {
    await sql.end();
    console.log('Database connection closed');
  }
}

main().catch(console.error); 