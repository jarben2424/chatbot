import { auth } from '@/auth'
import { queryDataTool } from '@/lib/ai/tools/query-data'
import { visualizeDataTool } from '@/lib/ai/tools/visualize-data'

export async function POST(req: Request) {
  // Check authentication
  const userId = (await auth())?.user.id
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Parse the request
  const { tool, args } = await req.json()

  // Execute the appropriate tool
  try {
    let result
    
    switch (tool) {
      case 'visualizeData':
        result = await visualizeDataTool.runToolAction(args)
        break
      case 'queryData':
        result = await queryDataTool.runToolAction(args)
        break
      default:
        return Response.json(
          { error: `Unknown tool: ${tool}` },
          { status: 400 }
        )
    }
    
    return Response.json(result)
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error)
    return Response.json(
      { error: error.message || 'Tool execution failed' },
      { status: 500 }
    )
  }
} 