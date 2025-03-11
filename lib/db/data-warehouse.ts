import { createPool } from '@vercel/postgres';
// Or your preferred data warehouse client

export const db = createPool({
  connectionString: process.env.DATA_WAREHOUSE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Add any necessary connection pooling or security measures 