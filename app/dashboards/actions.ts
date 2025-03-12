'use server';

import snowflake from 'snowflake-sdk';
import { auth } from '@/app/(auth)/auth';
import { deleteDashboardQuery, updateDashboardQuery } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function runDashboardQuery({
  id,
  sqlQuery,
}: {
  id: string;
  sqlQuery: string;
}) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('You must be signed in to run queries');
  }

  // Create Snowflake connection
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
  const database = process.env.SNOWFLAKE_DATABASE;

  if (!account || !username || !password || !warehouse || !database) {
    throw new Error('Missing required Snowflake environment variables');
  }

  const connection = snowflake.createConnection({
    account,
    username,
    password,
    warehouse,
    database,
  });

  try {
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

    // Update the dashboard query last update time
    await updateDashboardQuery({
      id,
    });

    return {
      query: sqlQuery,
      results,
    };
  } catch (error) {
    console.error('Error executing dashboard query:', error);
    throw error;
  } finally {
    connection.destroy(function(err) {
      if (err) {
        console.error('Error destroying connection:', err);
      }
    });
  }
}

export async function removeDashboardQuery(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('You must be signed in to remove dashboard queries');
  }

  await deleteDashboardQuery({ id });
  revalidatePath('/dashboards/my');
}
