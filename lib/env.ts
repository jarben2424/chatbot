import { z } from 'zod'

/**
 * Environment variables schema definition for strong typing
 * This follows Vercel's pattern of validating env vars at runtime
 */
const envSchema = z.object({
  // Core app settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Doppler integration
  DOPPLER_TOKEN: z.string().optional(),
  
  // Authentication
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // Database - PostgreSQL (Vercel)
  POSTGRES_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url().optional(),
  
  // Database - Snowflake
  SNOWFLAKE_ACCOUNT: z.string().optional(),
  SNOWFLAKE_USERNAME: z.string().optional(),
  SNOWFLAKE_PASSWORD: z.string().optional(),
  SNOWFLAKE_DATABASE: z.string().optional(),
  SNOWFLAKE_SCHEMA: z.string().optional(),
  SNOWFLAKE_WAREHOUSE: z.string().optional(),
  
  // AI Provider
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  
  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_KEY: z.string().optional(),
  
  // GitHub OAuth (optional)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
})

/**
 * Parse and validate environment variables
 * This will throw an error during build if required env vars are missing
 */
function createEnv() {
  // In server components/server actions, we can access process.env directly
  if (typeof process !== 'undefined') {
    return envSchema.parse(process.env)
  }
  
  // In client components, we should not expose all environment variables
  // This prevents accidentally exposing sensitive info
  throw new Error(
    'Cannot access full environment variables on the client side. Use publicEnv for client-side env vars.'
  )
}

/**
 * Typed environment variables accessible on the server
 */
export const env = createEnv()

/**
 * Schema for public environment variables safe to expose to the client
 */
const publicEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Add any other env vars that are safe for client usage
})

/**
 * Public environment variables safe to use on the client
 */
export const publicEnv = publicEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  // Add any other public env vars here
})

/**
 * Type definitions for environment variables
 */
export type Env = z.infer<typeof envSchema>
export type PublicEnv = z.infer<typeof publicEnvSchema> 