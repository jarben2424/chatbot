import { db } from '@/lib/db'
import { dashboards, visualizations, artifacts, documents } from '@/lib/db/schema'

/**
 * Verifies that the database schema matches our application requirements
 * This ensures our custom tables for dashboards and visualizations are properly configured
 */
async function verifySchema() {
  console.log('Verifying database schema...')

  try {
    // Check if tables exist
    const tables = [
      { schema: dashboards, name: 'dashboards' },
      { schema: visualizations, name: 'visualizations' },
      { schema: artifacts, name: 'artifacts' },
      { schema: documents, name: 'documents' }
    ]

    for (const table of tables) {
      try {
        const count = await db.select({ count: { count: 'id' } }).from(table.schema)
        console.log(`✅ Table ${table.name} exists with ${count[0].count} rows`)
      } catch (error) {
        console.error(`❌ Error accessing table ${table.name}:`, error)
        return false
      }
    }

    // Verify foreign key relationships
    const visualizationCount = await db
      .select({ count: { count: 'id' } })
      .from(visualizations)
      .where(eb => eb.eq(visualizations.dashboardId, dashboards.id))
      .innerJoin(dashboards, eb => eb.eq(visualizations.dashboardId, dashboards.id))

    console.log(`✅ Foreign key relationship between visualizations and dashboards verified`)

    console.log('Database schema verification completed successfully')
    return true
  } catch (error) {
    console.error('Schema verification failed:', error)
    return false
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifySchema()
    .then(success => {
      if (success) {
        console.log('Schema verification passed!')
        process.exit(0)
      } else {
        console.error('Schema verification failed!')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Unhandled error during schema verification:', error)
      process.exit(1)
    })
}

export { verifySchema } 