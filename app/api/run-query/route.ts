import { NextResponse } from 'next/server';
import snowflake from 'snowflake-sdk';

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

    const totalTime = Date.now() - startTime;
    console.log(`[API] Total execution time: ${totalTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      query: sqlQuery,
      executionTime: totalTime,
      results 
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
