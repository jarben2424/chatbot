import { visualizeDataTool } from './tools/visualize-data'
import { queryDataTool } from './tools/query-data'
import { sampleData } from '@/lib/testing/sample-data'

/**
 * Utility to test AI data tools in isolation
 */
export async function testAIDataTools() {
  const results = {
    visualizeTool: { success: false, result: null as any, error: null as string | null },
    queryTool: { success: false, result: null as any, error: null as string | null }
  }

  // Test visualization tool
  try {
    const visualizeResult = await visualizeDataTool.runToolAction({
      data: sampleData,
      visualization: 'bar',
      title: 'Test Visualization',
      description: 'Created for tool testing',
      xAxis: 'month'
    })
    
    results.visualizeTool.success = visualizeResult.success
    results.visualizeTool.result = visualizeResult
  } catch (error) {
    results.visualizeTool.error = error instanceof Error ? error.message : String(error)
    console.error('Visualization tool test error:', error)
  }

  // Test query tool
  try {
    const queryResult = await queryDataTool.runToolAction({
      query: 'SELECT * FROM sample_data LIMIT 5',
      description: 'Test query execution'
    })
    
    results.queryTool.success = !!queryResult.data
    results.queryTool.result = queryResult
  } catch (error) {
    results.queryTool.error = error instanceof Error ? error.message : String(error)
    console.error('Query tool test error:', error)
  }

  return results
} 