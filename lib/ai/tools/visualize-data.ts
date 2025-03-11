import { StreamData, tool } from 'ai';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';

interface VisualizationResult {
  id: string;
  type: string;
  data: any[];
  title: string;
  description?: string;
  createdAt: Date;
}

export const visualizeDataTool = tool({
  description: 'Create data visualizations from query results. You must provide the data array from a previous queryData result.',
  parameters: z.object({
    data: z.array(z.record(z.any())).describe('The data array from a previous queryData result'),
    type: z.enum(['bar', 'line', 'pie', 'scatter', 'table', 'auto']).default('auto').describe('Type of visualization'),
    title: z.string().describe('Title for the visualization'),
    description: z.string().optional().describe('Description of what the visualization shows'),
  }),
  execute: async ({ data, type, title, description }, { toolCallId, dataStream }) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Cannot create visualization: No data provided or empty data array');
      }

      // For debugging purposes
      console.log('Creating visualization with:', { 
        dataLength: data.length, 
        type, 
        title 
      });

      // If dataStream is provided, send status updates
      if (dataStream instanceof StreamData) {
        dataStream.append({ 
          type: 'visualization-status',
          toolCallId,
          status: 'running',
          message: 'Creating visualization...'
        });
      }

      // Determine best visualization type if 'auto' is selected
      const determinedType = type === 'auto' ? determineVisualizationType(data) : type;
      
      // Create a unique ID for the visualization
      const vizId = generateUUID();

      // Return the visualization result
      const result: VisualizationResult = {
        id: vizId,
        type: determinedType,
        data,
        title,
        description,
        createdAt: new Date()
      };

      return {
        visualization: determinedType,
        data: data,
        title: title,
        description: description || '',
        artifactId: vizId,
      };
    } catch (error) {
      console.error('Visualization tool error:', error);
      throw new Error(`Failed to create visualization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

/**
 * Determines the best visualization type based on data characteristics
 */
function determineVisualizationType(data: any[]): string {
  if (!data || data.length === 0) return 'table';
  
  const sample = data[0];
  const numericKeys = Object.keys(sample).filter(key => typeof sample[key] === 'number');
  const dateKeys = Object.keys(sample).filter(key => 
    typeof sample[key] === 'string' && 
    !isNaN(Date.parse(sample[key]))
  );
  
  // If we have date and numeric fields, suggest a line chart
  if (dateKeys.length > 0 && numericKeys.length > 0) {
    return 'line';
  }
  
  // If we have 2+ numeric fields, suggest a bar chart
  if (numericKeys.length >= 2) {
    return 'bar';
  }
  
  // If we have few rows with 1 numeric field, suggest a pie chart
  if (numericKeys.length === 1 && data.length <= 8) {
    return 'pie';
  }
  
  // Default to a bar chart for most data
  if (numericKeys.length > 0) {
    return 'bar';
  }
  
  // Default to table for everything else
  return 'table';
}

export const visualizeData = visualizeDataTool; 