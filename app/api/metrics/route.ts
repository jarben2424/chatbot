import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define types for Snowflake results and connections
type SnowflakeConnection = any;
type SnowflakeRow = Record<string, any>;
type QueryResult = {
  success: boolean;
  data?: any; // Can be highlight, chart, or table format
  error?: string;
  metricId?: string;
};

// Get Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Fetch metric details from the database
 */
async function getMetricDetails(metricId: string) {
  const supabase = getSupabaseClient();
  
  // First try DashboardMetrics
  const { data: dashboardMetric, error: dashboardError } = await supabase
    .from('DashboardMetrics')
    .select('*')
    .eq('id', metricId)
    .single();
  
  if (dashboardMetric) {
    return {
      query: dashboardMetric.querytemplate,
      visualizationType: dashboardMetric.visualizationtype,
      title: dashboardMetric.title
    };
  }
  
  // Then try ChatGeneratedMetrics
  const { data: chatMetric, error: chatError } = await supabase
    .from('ChatGeneratedMetrics')
    .select('*')
    .eq('id', metricId)
    .single();
  
  if (chatMetric) {
    return {
      query: chatMetric.sqlQuery,
      visualizationType: chatMetric.visualizationtype,
      title: chatMetric.title
    };
  }
  
  // If we get here, the metric was not found
  throw new Error(`Metric with ID ${metricId} not found`);
}

/**
 * Execute a SQL query against Snowflake
 */
async function executeSnowflakeQuery(sql: string): Promise<SnowflakeRow[]> {
  // Dynamically import Snowflake SDK to avoid client-side bundling issues
  const snowflake = await import('snowflake-sdk').then(module => module.default);
  
  // Validate environment variables
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
  const database = process.env.SNOWFLAKE_DATABASE;

  if (!account || !username || !password || !warehouse || !database) {
    throw new Error('Missing required Snowflake environment variables');
  }

  // Create Snowflake connection
  const connection: SnowflakeConnection = snowflake.createConnection({
    account,
    username,
    password,
    warehouse,
    database,
  });

  // Connect to Snowflake with proper error handling
  try {
    await new Promise<SnowflakeConnection>((resolve, reject) => {
      connection.connect((err: any, conn: SnowflakeConnection) => {
        if (err) {
          console.error('Unable to connect to Snowflake:', err);
          reject(new Error(`Failed to connect to Snowflake: ${err.message}`));
        } else {
          console.log('Successfully connected to Snowflake');
          resolve(conn);
        }
      });
    });

    // Execute the query
    return await new Promise<SnowflakeRow[]>((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        complete: (err: any, stmt: any, rows: SnowflakeRow[]) => {
          if (err) {
            console.error('Failed to execute query:', err);
            reject(new Error(`Failed to execute query: ${err.message}`));
          } else {
            console.log(`Successfully executed query, returned ${rows.length} rows`);
            resolve(rows);
          }
          
          // Disconnect after query completion
          connection.destroy(function(err: any) {
            if (err) {
              console.error('Error disconnecting from Snowflake:', err);
            } else {
              console.log('Disconnected from Snowflake');
            }
          });
        }
      });
    });
  } catch (error) {
    // Ensure connection is destroyed on error
    try {
      connection.destroy();
    } catch (destroyError) {
      console.error('Error destroying connection after failure:', destroyError);
    }
    throw error;
  }
}

/**
 * Format data for different visualization types
 */
function formatData(data: SnowflakeRow[], visualizationType: string) {
  if (!data || data.length === 0) {
    return null;
  }

  switch (visualizationType.toLowerCase()) {
    case 'highlight':
      // For highlight cards, we expect a single value (or first row, first column value)
      // Determine the first numeric field in the result
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      
      // Find first numeric value
      const numericKey = keys.find(key => typeof firstRow[key] === 'number');
      if (numericKey) {
        return {
          value: firstRow[numericKey],
          label: numericKey,
          // If there are two rows with the same structure, treat the second as trend data
          trend: data.length > 1 && typeof data[1][numericKey] === 'number' ? {
            value: data[1][numericKey],
            isPositive: data[1][numericKey] > 0
          } : undefined
        };
      }
      
      // Fallback to first column
      return {
        value: firstRow[keys[0]],
        label: keys[0]
      };
      
    case 'chart':
      // For charts, transform data for chart components
      return {
        data: data,
        categories: Object.keys(data[0]).filter(k => typeof data[0][k] === 'number'),
        index: Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || 'index'
      };
      
    case 'table':
      // For tables, use data as is with column definitions
      return {
        data: data,
        columns: Object.keys(data[0]).map(key => ({
          key: key,
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
        }))
      };
      
    default:
      return data;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { metricId, parameters } = body;
    
    if (!metricId) {
      return NextResponse.json(
        { success: false, error: 'Metric ID is required' },
        { status: 400 }
      );
    }
    
    // Get metric details from the database
    let metricDetails;
    try {
      metricDetails = await getMetricDetails(metricId);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch metric: ${error instanceof Error ? error.message : String(error)}`,
          metricId 
        },
        { status: 404 }
      );
    }
    
    // Process query parameters if needed
    let finalQuery = metricDetails.query;
    if (parameters && typeof parameters === 'object') {
      // Replace parameters in query template
      Object.entries(parameters).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        
        // Format the value based on its type
        let formattedValue = value;
        if (typeof value === 'string') {
          formattedValue = `'${value}'`; // Add quotes for strings
        }
        
        finalQuery = finalQuery.replace(regex, String(formattedValue));
      });
    }
    
    // Execute the query
    let result: QueryResult;
    try {
      const queryResults = await executeSnowflakeQuery(finalQuery);
      const formattedData = formatData(queryResults, metricDetails.visualizationType);
      
      result = {
        success: true,
        data: formattedData,
        metricId
      };
    } catch (error) {
      result = {
        success: false,
        error: `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`,
        metricId
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in metrics API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}
