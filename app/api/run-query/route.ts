import { NextResponse } from 'next/server';
import snowflake from 'snowflake-sdk';

export async function POST(req: Request) {
  try {
    const { sqlQuery } = await req.json();

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
      return NextResponse.json(
        { error: 'Missing required Snowflake environment variables' },
        { status: 500 }
      );
    }

    const connection = snowflake.createConnection({
      account,
      username,
      password,
      warehouse,
      database,
    });

    // Connect to Snowflake
    await new Promise<snowflake.Connection>((resolve, reject) => {
      connection.connect((err, conn) => {
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
    const results = await new Promise<any[]>((resolve, reject) => {
      connection.execute({
        sqlText: sqlQuery,
        complete: (err, stmt, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        },
      });
    });

    // Clean up connection
    await new Promise<void>((resolve) => {
      connection.destroy(function() {
        resolve();
      });
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while executing the query' },
      { status: 500 }
    );
  }
}
