import { tool } from 'ai';
import { z } from 'zod';
import { visualizeData } from '@/lib/actions/data-tools';
import { UIArtifact } from '@/lib/ai';

export const visualizeDataTool = tool({
  name: 'visualize_data',
  description: 'Create visualizations from data sets. This will generate charts or graphs from the provided data.',
  parameters: z.object({
    data: z.array(z.record(z.any())).describe('The data to visualize, as an array of objects'),
    visualization: z.enum(['bar', 'line', 'pie', 'scatter', 'table']).describe('The type of visualization to create'),
    title: z.string().optional().describe('Title for the visualization'),
    description: z.string().optional().describe('Description of what the visualization shows'),
    xAxis: z.string().optional().describe('The field to use for the x-axis (for appropriate chart types)'),
  }),
  execute: async ({ data, visualization, title, description, xAxis }) => {
    // Validate data structure
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data structure for visualization');
    }

    // Set defaults
    const vizTitle = title || `${visualization.charAt(0).toUpperCase() + visualization.slice(1)} Chart`;
    
    // Create visualization via server action
    const result = await visualizeData({
      data,
      visualization,
      title: vizTitle,
      description,
      settings: {
        xAxis,
        showGrid: true,
        showLabels: true,
        showLegend: true
      }
    });

    // Return result for display
    return {
      title: vizTitle,
      type: 'visualization',
      visualization,
      id: result.id,
      url: `/artifacts/${result.id}`,
      metadata: {
        recordCount: data.length,
        fields: Object.keys(data[0]),
        description
      }
    };
  }
}); 