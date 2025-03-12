import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'

// Postgres client
const client = postgres(env.POSTGRES_URL)

// Export the database instance
export const db = drizzle(client) 