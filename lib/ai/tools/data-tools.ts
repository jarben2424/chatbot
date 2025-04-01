import { StreamData, tool } from 'ai';
import { z } from 'zod';
import { queryDatabase } from '@/lib/ai/tools/query-data';
import { generateDataVisualization } from '@/lib/data-visualization/generate';
import { queryData } from './query-data';
import { visualizeData } from './visualize-data';
import { aiQueryData } from './ai-query-data';
import { directQueryTool } from './direct-query';
import { qsrQueryTool } from './qsr-query';

export const queryDataTool = tool({
  description: 'Execute SQL queries against the database to fetch data for analytics questions',
  parameters: z.object({
    query: z.string().describe('The SQL query to execute'),
    title: z.string().optional().describe('Title for the data result'),
    description: z.string().optional().describe('Description of what the data shows'),
  }),
  execute: async ({ query, title, description }, { toolCallId, abortSignal, dataStream }) => {
    try {
      // If dataStream is provided, send status updates
      if (dataStream instanceof StreamData) {
        dataStream.append({ 
          type: 'tool-status',
          toolCallId,
          status: 'running',
          message: 'Executing query...'
        });
      }

      // Execute the query
      const data = await queryDatabase(query, abortSignal);
      
      // Return structured result
      return {
        data,
        sql: query,
        title: title || 'Query Results',
        description: description || 'Data fetched from database',
      };
    } catch (error) {
      console.error('Query data tool error:', error);
      throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

export const visualizeDataTool = tool({
  description: 'Create visualizations from query results. IMPORTANT: You must first get data using the queryData tool, then pass that data to this tool.',
  parameters: z.object({
    data: z.array(z.record(z.any())).describe('The data array from a previous queryData result'),
    type: z.enum(['table', 'bar', 'line', 'pie', 'scatter', 'auto']).default('auto').describe('Type of visualization'),
    title: z.string().describe('Title for the visualization'),
    description: z.string().optional().describe('Description of what the visualization shows'),
    options: z.record(z.any()).optional().describe('Additional visualization options'),
  }),
  execute: async ({ data, type, title, description, options }, { toolCallId, dataStream }) => {
    try {
      // Validation with detailed error message
      if (!data) {
        throw new Error('No data provided. You must include the data from queryData in this request.');
      }
      
      if (!Array.isArray(data)) {
        throw new Error(`Data must be an array. Received: ${typeof data}`);
      }
      
      if (data.length === 0) {
        throw new Error('Data array is empty. Please provide data from a queryData result.');
      }

      // If dataStream is provided, send status updates
      if (dataStream instanceof StreamData) {
        dataStream.append({ 
          type: 'tool-status',
          toolCallId,
          status: 'running',
          message: 'Generating visualization...'
        });
      }

      // Generate the visualization
      const visualization = await generateDataVisualization(data, type, options);
      
      // Return structured result with artifact ID for split screen view
      return {
        data,
        visualization: type === 'auto' ? visualization.type : type,
        title,
        description: description || '',
        artifactId: visualization.id, // ID to reference in split screen
      };
    } catch (error) {
      console.error('Visualization tool error:', error);
      throw new Error(`Failed to create visualization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

export const dataTools = {
  queryData,
  visualizeData,
  aiQueryData,
  directQuery: directQueryTool,
  qsrQuery: qsrQueryTool,
}; 