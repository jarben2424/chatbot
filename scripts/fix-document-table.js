// Fix document table migration script
const { createClient } = require('@vercel/postgres');

async function main() {
  console.log('Starting document table migration...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const client = createClient({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  try {
    console.log('Connected to database. Applying migrations...');
    
    // Add the missing columns
    await client.sql`
      ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "previousVersion" uuid;
      ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "chatId" uuid;
    `;
    console.log('Added missing columns: previousVersion and chatId');
    
    // Fix the kind column
    await client.sql`
      ALTER TABLE "Document" 
        ALTER COLUMN "kind" TYPE varchar,
        ALTER COLUMN "kind" SET NOT NULL,
        ALTER COLUMN "kind" SET DEFAULT 'text';
    `;
    console.log('Fixed kind column definition');
    
    // Update existing records if needed
    const { rowCount } = await client.sql`
      UPDATE "Document" 
      SET "kind" = 'visualization' 
      WHERE "kind" = 'text' AND "content" LIKE '%"visualization":%';
    `;
    console.log(`Updated ${rowCount} documents to have kind=visualization`);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error in migration:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error); 