import { createStreamableUI, createStreamableValue, createAI } from 'ai/rsc';
import { visualizeDataTool } from '@/lib/ai/tools/visualize-data';
import { queryDataTool } from '@/lib/ai/tools/query-data';
import { sampleData } from './sample-data';

// Helper function to run a single test case
export async function testAIVisualization(query: string) {
  const ui = createStreamableUI();
  const result = createStreamableValue<string>();
  
  // Create AI instance with tools
  const AI = createAI({
    tools: { 
      visualizeDataTool,
      queryDataTool 
    },
    async run({ messages }) {
      const latestMessage = messages[messages.length - 1].content;
      
      // Test different cases based on query
      if (latestMessage.includes('visualization') || 
          latestMessage.includes('chart') || 
          latestMessage.includes('graph')) {
        
        try {
          // Test visualization generation
          const visualizationResult = await visualizeDataTool.runToolAction({
            data: sampleData,
            visualization: latestMessage.includes('bar') ? 'bar' : 
                          latestMessage.includes('line') ? 'line' : 
                          latestMessage.includes('pie') ? 'pie' : 'bar',
            title: `Test ${latestMessage.includes('bar') ? 'Bar' : 
                    latestMessage.includes('line') ? 'Line' : 
                    latestMessage.includes('pie') ? 'Pie' : 'Bar'} Chart`,
            description: `Created from test query: ${latestMessage}`,
            xAxis: Object.keys(sampleData[0])[0]
          });
          
          ui.update(
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium">✅ Visualization Tool Test Successful</p>
              <pre className="mt-2 p-2 bg-white overflow-auto rounded text-xs">
                {JSON.stringify(visualizationResult, null, 2)}
              </pre>
            </div>
          );
          
          result.append('Visualization test successful');
        } catch (error) {
          ui.update(
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium">❌ Visualization Tool Test Failed</p>
              <p className="text-red-600">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          );
          
          result.append('Error: ' + (error instanceof Error ? error.message : String(error)));
        }
      } else if (latestMessage.includes('query') || 
                latestMessage.includes('sql') || 
                latestMessage.includes('data')) {
        
        try {
          // Test query execution
          const queryResult = await queryDataTool.runToolAction({
            query: "SELECT * FROM sample_data LIMIT 10",
            description: `Test query for: ${latestMessage}`
          });
          
          ui.update(
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium">✅ Query Tool Test Successful</p>
              <pre className="mt-2 p-2 bg-white overflow-auto rounded text-xs">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            </div>
          );
          
          result.append('Query test successful');
        } catch (error) {
          ui.update(
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium">❌ Query Tool Test Failed</p>
              <p className="text-red-600">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          );
          
          result.append('Error: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
      
      return { ui, result: result.value };
    }
  });
  
  return AI;
} 