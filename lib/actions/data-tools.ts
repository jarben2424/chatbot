'use server';

import { auth } from '@/auth';
import { executeQuery } from '@/lib/snowflake';
import { saveArtifact } from '@/lib/db/artifacts';
import { ArtifactKind } from '@/lib/db/schema';
import { z } from 'zod';

// Schema validation for query data
const QuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  description: z.string().optional()
});

// Schema validation for visualization data
const VisualizationSchema = z.object({
  data: z.array(z.any()).min(1, "Data is required"),
  visualization: z.enum(['bar', 'line', 'pie', 'scatter', 'table']),
  title: z.string().optional(),
  description: z.string().optional()
});

/**
 * Execute a SQL query against Snowflake and save the result
 */
export async function queryData(input: z.infer<typeof QuerySchema>) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  try {
    // Validate the input
    const { query, description } = QuerySchema.parse(input);
    
    // Check for dangerous queries
    if (query.toLowerCase().includes('drop table') || 
        query.toLowerCase().includes('delete from') ||
        query.toLowerCase().includes('truncate table')) {
      throw new Error('Dangerous operations (DROP, DELETE, TRUNCATE) are not allowed');
    }
    
    // Execute the query
    const result = await executeQuery(query);
    
    // Save the query as an artifact
    const artifact = await saveArtifact({
      type: 'query',
      title: description || 'SQL Query',
      content: {
        query,
        result,
        description,
        executedAt: new Date().toISOString()
      },
      userId: session.user.id
    });
    
    return {
      id: artifact.id,
      data: result,
      query,
      description,
      success: true
    };
  } catch (error) {
    console.error('Error executing query:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error executing query'
    };
  }
}

/**
 * Create a visualization from data and save it
 */
export async function visualizeData(input: z.infer<typeof VisualizationSchema>) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  try {
    // Validate the input
    const { data, visualization, title, description } = VisualizationSchema.parse(input);
    
    // Generate default title if not provided
    const vizTitle = title || `${visualization.charAt(0).toUpperCase() + visualization.slice(1)} Chart`;
    
    // Save the visualization as an artifact
    const artifact = await saveArtifact({
      type: 'visualization',
      title: vizTitle,
      content: {
        data,
        visualization,
        description,
        createdAt: new Date().toISOString(),
        settings: {
          type: visualization,
          colors: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'],
          showLegend: true,
          showLabels: true,
          showGrid: true,
          xAxis: data[0] ? Object.keys(data[0])[0] : undefined
        }
      },
      userId: session.user.id
    });
    
    return {
      id: artifact.id,
      title: vizTitle,
      visualization,
      description,
      success: true
    };
  } catch (error) {
    console.error('Error creating visualization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating visualization'
    };
  }
}

/**
 * Add a visualization to a dashboard
 */
export async function addToDashboard({
  artifactId,
  dashboardId,
  position = { x: 0, y: 0, w: 6, h: 4 }
}: {
  artifactId: string;
  dashboardId: string;
  position?: { x: number; y: number; w: number; h: number };
}) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  try {
    // Implementation of adding to dashboard
    // This would connect to your database to add the artifact to a dashboard
    
    return {
      success: true,
      dashboardId,
      artifactId
    };
  } catch (error) {
    console.error('Error adding to dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 