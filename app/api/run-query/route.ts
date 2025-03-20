import { NextResponse } from 'next/server';
import snowflake from 'snowflake-sdk';

// Function to transform query results for line chart visualization
function transformForLineChart(results: any[]): any {
  if (!results || results.length === 0) return { data: [], xKey: '', yKeys: [] };

  const columns = Object.keys(results[0]);
  
  // Find time-based column for x-axis
  const timeColumn = columns.find(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('month') ||
    col.toLowerCase().includes('day') ||
    col.toLowerCase().includes('week')
  ) || columns[0]; // Default to first column if no time column found
  
  // Find numeric columns for y-axis
  const numericColumns = columns.filter(col => {
    const value = results[0][col];
    return typeof value === 'number' && col !== timeColumn;
  });
  
  // Format the data for the chart
  const data = results.map(row => {
    const formattedRow: Record<string, any> = {};
    
    // Process the time column
    const timeValue = row[timeColumn];
    formattedRow[timeColumn] = typeof timeValue === 'string' && timeValue.includes('T') 
      ? timeValue.split('T')[0] // Simple date extraction from ISO string
      : timeValue;
    
    // Add all numeric values
    numericColumns.forEach(col => {
      formattedRow[col] = row[col];
    });
    
    return formattedRow;
  });
  
  return {
    data,
    xKey: timeColumn,
    yKeys: numericColumns
  };
}

// Function to transform query results for bar chart visualization
function transformForBarChart(results: any[]): any {
  if (!results || results.length === 0) return { data: [], xKey: '', yKeys: [] };
  
  const columns = Object.keys(results[0]);
  
  // Find numeric columns for measures
  const numericColumns = columns.filter(col => {
    const value = results[0][col];
    return typeof value === 'number';
  });
  
  // Find non-numeric column for categories (prefer the first non-numeric column)
  const categoricalColumns = columns.filter(col => !numericColumns.includes(col));
  const categoryColumn = categoricalColumns[0] || columns[0];
  
  // Format the data for the chart
  const data = results.map(row => {
    const formattedRow: Record<string, any> = {};
    
    // Add category
    formattedRow[categoryColumn] = row[categoryColumn];
    
    // Add all numeric values
    numericColumns.forEach(col => {
      formattedRow[col] = row[col];
    });
    
    return formattedRow;
  });
  
  return {
    data,
    xKey: categoryColumn,
    yKeys: numericColumns
  };
}

// Helper function to suggest visualization type based on data structure
function suggestVisualizationType(results: any[]): string {
  if (!results || results.length === 0) return 'table';
  
  const columns = Object.keys(results[0]);
  
  // Find time-based columns
  const timeColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('month') ||
    col.toLowerCase().includes('day') ||
    col.toLowerCase().includes('week')
  );
  
  // Find numeric columns
  const numericColumns = columns.filter(col => {
    const value = results[0][col];
    return typeof value === 'number';
  });
  
  // For a single row with a single value, suggest highlight
  if (results.length === 1 && columns.length === 1) {
    return 'highlight';
  }
  
  // For a single row with a few columns, suggest highlight for the most significant metric
  if (results.length === 1 && numericColumns.length > 0) {
    return 'highlight';
  }
  
  // If there are time columns and numeric columns, suggest line chart
  if (timeColumns.length > 0 && numericColumns.length > 0) {
    return 'line-chart';
  }
  
  // If there are categorical columns with numeric values, suggest bar chart
  if (columns.length >= 2 && numericColumns.length > 0) {
    return 'bar-chart';
  }
  
  // Default to table
  return 'table';
}

// Transform the data to the appropriate format based on visualization type
function transformQueryResults(results: any[]): any {
  if (!results || results.length === 0) return results;
  
  // Determine the visualization type based on the result structure
  const visualizationType = suggestVisualizationType(results);
  
  // Transform data based on the visualization type
  switch (visualizationType) {
    case 'line-chart':
      return transformForLineChart(results);
    case 'bar-chart':
      return transformForBarChart(results);
    case 'highlight':
      // For highlight cards, return the raw data array
      return results;
    default:
      return results;
  }
}

export async function POST(req: Request) {
  let connection: snowflake.Connection | null = null;
  const startTime = Date.now();
  
  try {
    const { sqlQuery } = await req.json();
    console.log(`[API] Received query request: ${sqlQuery.substring(0, 100)}...`);

    if (!sqlQuery) {
      return NextResponse.json(
        { error: 'Missing SQL query' },
        { status: 400 }
      );
    }

    // Create Snowflake connection
    const account = process.env.SNOWFLAKE_ACCOUNT;
    const username = process.env.SNOWFLAKE_USERNAME;
    const password = process.env.SNOWFLAKE_PASSWORD;
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
    const database = process.env.SNOWFLAKE_DATABASE;

    if (!account || !username || !password || !warehouse || !database) {
      console.error('[API] Missing required Snowflake environment variables');
      return NextResponse.json(
        { error: 'Missing required Snowflake environment variables' },
        { status: 500 }
      );
    }

    console.log(`[API] Creating Snowflake connection to ${account}/${database}`);
    connection = snowflake.createConnection({
      account,
      username,
      password,
      warehouse,
      database,
    });

    // Connect to Snowflake
    console.log('[API] Connecting to Snowflake...');
    const connectStart = Date.now();
    await new Promise<snowflake.Connection>((resolve, reject) => {
      connection!.connect((err, conn) => {
        if (err) {
          console.error('[API] Unable to connect to Snowflake:', err);
          reject(new Error(`Failed to connect to Snowflake: ${err.message}`));
        } else {
          console.log(`[API] Successfully connected to Snowflake in ${Date.now() - connectStart}ms`);
          resolve(conn);
        }
      });
    });

    // Execute the query
    console.log('[API] Executing SQL query...');
    const queryStart = Date.now();
    const results = await new Promise<any[]>((resolve, reject) => {
      connection!.execute({
        sqlText: sqlQuery,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('[API] Error executing SQL query:', err);
            reject(new Error(`SQL execution error: ${err.message}`));
          } else {
            const queryTime = Date.now() - queryStart;
            console.log(`[API] Query executed successfully in ${queryTime}ms, returned ${rows?.length || 0} rows`);
            resolve(rows || []);
          }
        },
      });
    });

    // Transform the results - for dashboard, keep the original array format
    // The frontend components will handle both formats
    console.log('[API] Query results:', results);
    
    const totalTime = Date.now() - startTime;
    console.log(`[API] Total execution time: ${totalTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      query: sqlQuery,
      executionTime: totalTime,
      results: results  // Return the raw results array for the dashboard
    });
  } catch (error: any) {
    console.error('[API] Error executing query:', error);
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred while executing the query',
        query: error.sqlQuery || 'Unknown query'
      },
      { status: 500 }
    );
  } finally {
    // Clean up connection in finally block to ensure it always runs
    if (connection) {
      try {
        console.log('[API] Closing Snowflake connection...');
        const closeStart = Date.now();
        await new Promise<void>((resolve) => {
          connection!.destroy(function() {
            console.log(`[API] Snowflake connection destroyed in ${Date.now() - closeStart}ms`);
            resolve();
          });
        });
      } catch (cleanupError) {
        console.error('[API] Error cleaning up Snowflake connection:', cleanupError);
      }
    }
  }
}
