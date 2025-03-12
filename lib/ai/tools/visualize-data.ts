import { z } from 'zod';
import { VisualizationSettings } from '@/lib/types/visualization';
import { saveVisualization } from '@/lib/actions/data-tools';

export const VisualizationSchema = z.object({
  data: z.array(z.record(z.any())).describe('The data to visualize.'),
  visualization: z.enum(['bar', 'line', 'pie', 'scatter', 'table']).describe('The type of visualization to create.'),
  title: z.string().describe('The title of the visualization.'),
  description: z.string().optional().describe('A description of what the visualization shows.'),
  xAxis: z.string().optional().describe('The data field to use for the x-axis.'),
});

export const visualizeDataTool = {
  name: 'visualizeData',
  description: 'Create a data visualization from the provided data',
  schema: VisualizationSchema,
  runToolAction: async function(args: z.infer<typeof VisualizationSchema>) {
    try {
      // Create a settings object from the provided arguments
      const settings: VisualizationSettings = {
        type: args.visualization,
        showLegend: true,
        showGrid: true,
        showLabels: true,
        xAxis: args.xAxis || (args.data && args.data.length > 0 ? Object.keys(args.data[0])[0] : undefined),
        colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
      };
      
      // Save the visualization to the database
      const artifact = await saveVisualization({
        title: args.title,
        description: args.description || '',
        data: args.data,
        visualization: args.visualization,
        settings
      });
      
      // Return the artifact ID for reference in the chat
      return {
        artifactId: artifact.id,
        title: args.title,
        description: args.description,
        visualization: args.visualization,
        success: true
      };
    } catch (error) {
      console.error('Error visualizing data:', error);
      return {
        error: error instanceof Error ? error.message : String(error),
        success: false
      };
    }
  }
}; 