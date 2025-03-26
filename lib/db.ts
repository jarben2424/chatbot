import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Define the connection string for Supabase
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot';

// Create the database client
const client = postgres(connectionString, { max: 1 });

// Create the database instance
export const db = drizzle(client);
