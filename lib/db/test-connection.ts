'use server'

import { createClient } from '@vercel/postgres'
import snowflake from 'snowflake-sdk'
import { env } from '@/lib/env'

/**
 * Tests connections to both Postgres and Snowflake databases
 * This helps verify our data integration is working correctly
 */
export async function testDatabaseConnections() {
  const results = {
    postgres: { success: false, error: null as string | null },
    snowflake: { success: false, error: null as string | null }
  }

  // Test Postgres connection
  try {
    const client = createClient()
    await client.connect()
    const { rows } = await client.sql`SELECT NOW()`
    await client.end()
    results.postgres.success = true
  } catch (error) {
    results.postgres.error = error instanceof Error ? error.message : String(error)
    console.error('PostgreSQL connection error:', error)
  }

  // Test Snowflake connection
  try {
    if (env.SNOWFLAKE_ACCOUNT && env.SNOWFLAKE_USERNAME && env.SNOWFLAKE_PASSWORD) {
      const connection = snowflake.createConnection({
        account: env.SNOWFLAKE_ACCOUNT,
        username: env.SNOWFLAKE_USERNAME,
        password: env.SNOWFLAKE_PASSWORD,
        database: env.SNOWFLAKE_DATABASE,
        schema: env.SNOWFLAKE_SCHEMA,
        warehouse: env.SNOWFLAKE_WAREHOUSE
      })
      
      // Connect using proper callback pattern
      await new Promise<void>((resolve, reject) => {
        connection.connect((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      
      // Execute query using proper callback pattern
      await new Promise<void>((resolve, reject) => {
        connection.execute({
          sqlText: 'SELECT CURRENT_TIMESTAMP()',
          complete: (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        })
      })
      
      // Properly disconnect
      connection.destroy()
      
      results.snowflake.success = true
    } else {
      results.snowflake.error = 'Snowflake credentials not configured'
    }
  } catch (error) {
    results.snowflake.error = error instanceof Error ? error.message : String(error)
    console.error('Snowflake connection error:', error)
  }

  return results
} 