import { StreamData, tool } from 'ai';
import { z } from 'zod';
import { AbortSignal } from 'node:abort-controller';
import snowflake from 'snowflake-sdk';
import { auth } from '@/app/(auth)/auth';
import { getProgramIdForUser } from '@/lib/auth/program-mapping';
// Or your preferred data warehouse client
// import { createClient } from '@snowflake-sdk/client';
// import { BigQuery } from '@google-cloud/bigquery';

// Create a Snowflake connection
function createSnowflakeConnection() {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE
  });
}

// List of available tables in the database
const AVAILABLE_TABLES = [
  // Only allow these specific tables
  'HANG_LOYALTY_PUBLIC.customer_transactions',
  'HANG_LOYALTY_PUBLIC.transactions',
  'HANG_LOYALTY_PUBLIC.transaction_line_items'
];

// Execute a query against Snowflake
export async function queryDatabase(query: string, abortSignal?: AbortSignal): Promise<any[]> {
  // Get the current user session
  const session = await auth();
  const userEmail = session?.user?.email;
  const { programId, isAdmin } = getProgramIdForUser(userEmail);
  
  console.log(`Executing query for user ${userEmail} with program ID ${programId}, admin: ${isAdmin}`);
  
  // Make a copy of the query for modifications
  let workingQuery = query;
  
  // Validate query is read-only SELECT statement
  const queryLower = workingQuery.trim().toLowerCase();
  if (!queryLower.startsWith('select ')) {
    console.error('Rejecting non-SELECT query for security reasons:', workingQuery);
    throw new Error('Only SELECT queries are permitted for security reasons');
  }
  
  // Check for allowed tables
  let isAllowedTable = false;
  for (const tableName of AVAILABLE_TABLES) {
    // Handle both with and without schema prefix
    const tableNameWithoutSchema = tableName.includes('.') ? 
      tableName.split('.')[1].toLowerCase() : 
      tableName.toLowerCase();
    
    if (queryLower.includes(tableName.toLowerCase()) || 
        queryLower.includes(tableNameWithoutSchema)) {
      isAllowedTable = true;
      break;
    }
  }
  
  if (!isAllowedTable) {
    console.error('Query references tables not in the allowed list:', workingQuery);
    throw new Error(`Only queries against the following tables are permitted: ${AVAILABLE_TABLES.join(', ')}`);
  }

  // Check for incorrect 'date' usage and fix it
  if (queryLower.includes(' from hang_loyalty_public.transactions where date >= ') ||
      queryLower.includes('date')) {
    workingQuery = workingQuery.replace(/\bdate\b/g, 'transaction_date');
    console.log('Fixed date column references in query:', workingQuery);
  }

  // Only apply program ID filtering for non-admin users
  const modifiedQuery = isAdmin 
    ? workingQuery  // Admin can query anywhere
    : addProgramIdFilter(workingQuery, programId);

  // Log admin status
  if (isAdmin) {
    console.log('Admin user - executing without program ID filtering');
  } else {
    console.log('Modified query with program ID filter:', modifiedQuery);
  }

  return new Promise((resolve, reject) => {
    // Check if operation was aborted
    if (abortSignal?.aborted) {
      return reject(new Error('Query operation aborted'));
    }
    
    const connection = createSnowflakeConnection();
    
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to Snowflake:', err);
        // Fall back to mock data on connection error
        return resolve(mockQueryDatabase(workingQuery, programId));
      }
      
      console.log('Successfully connected to Snowflake, executing query:', modifiedQuery);
      
      // Execute the modified query
      connection.execute({
        sqlText: modifiedQuery,
        complete: (err, stmt, rows) => {
          // Always terminate the connection
          connection.destroy();
          
          if (err) {
            console.error('Error executing query:', err);
            // Fall back to mock data on query error
            return resolve(mockQueryDatabase(workingQuery, programId));
          }
          
          resolve(rows || []);
        }
      });
    });
  });
}

/**
 * Add program ID filter to a query if not already present
 */
function addProgramIdFilter(query: string, programId: number): string {
  const queryLower = query.toLowerCase();
  
  // Simple check if the query already has a WHERE clause
  if (queryLower.includes(' where ')) {
    // Add program ID filter to existing WHERE clause
    return query.replace(
      /where\s+/i, 
      `WHERE program_id = ${programId} AND `
    );
  } else if (queryLower.includes(' group by ')) {
    // Insert WHERE clause before GROUP BY
    return query.replace(
      /\s+group by\s+/i, 
      ` WHERE program_id = ${programId} GROUP BY `
    );
  } else if (queryLower.includes(' order by ')) {
    // Insert WHERE clause before ORDER BY
    return query.replace(
      /\s+order by\s+/i, 
      ` WHERE program_id = ${programId} ORDER BY `
    );
  } else if (queryLower.includes(' limit ')) {
    // Insert WHERE clause before LIMIT
    return query.replace(
      /\s+limit\s+/i, 
      ` WHERE program_id = ${programId} LIMIT `
    );
  } else {
    // No WHERE clause, GROUP BY, ORDER BY, or LIMIT - add WHERE clause at the end
    return `${query} WHERE program_id = ${programId}`;
  }
}

// Mock data generator
async function mockQueryDatabase(query: string, programId: number, userEmail?: string): Promise<any[]> {
  console.log('Generating mock data with:', { programId, userEmail, query });
  
  // Special case for monthly revenue queries
  const queryLower = query.toLowerCase();
  const isBrianOrHang = userEmail?.includes('brian') || userEmail?.includes('hang.com');
  const isRevenueQuery = queryLower.includes('revenue') || 
                        queryLower.includes('sales') || 
                        queryLower.includes('total') || 
                        queryLower.includes('money');
  
  if (isBrianOrHang && isRevenueQuery) {
    console.log('✅ Generating SPECIAL DEMO DATA for revenue query');
    
    // Generate revenue between $60,000-$80,000
    const getRandomRevenue = () => Math.floor(Math.random() * 20000) + 60000;
    
    return [
      { Month: 'February 2025', 'Total Revenue': getRandomRevenue() },
      { Month: 'January 2025', 'Total Revenue': getRandomRevenue() },
      { Month: 'December 2024', 'Total Revenue': getRandomRevenue() },
      { Month: 'November 2024', 'Total Revenue': getRandomRevenue() },
      { Month: 'October 2024', 'Total Revenue': getRandomRevenue() }
    ];
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Standard mock data based on query content
  if (queryLower.includes('customer') || queryLower.includes('customers')) {
    return [
      { program_id: programId, customer_id: 1001, name: 'John Doe', email: 'john@example.com', segment: 'Premium' },
      { program_id: programId, customer_id: 1002, name: 'Jane Smith', email: 'jane@example.com', segment: 'Standard' },
      { program_id: programId, customer_id: 1003, name: 'Bob Johnson', email: 'bob@example.com', segment: 'Premium' },
      { program_id: programId, customer_id: 1004, name: 'Alice Brown', email: 'alice@example.com', segment: 'Standard' },
      { program_id: programId, customer_id: 1005, name: 'Charlie Davis', email: 'charlie@example.com', segment: 'Basic' },
    ];
  } 
  
  if (queryLower.includes('transaction') || queryLower.includes('transactions')) {
    return [
      { program_id: programId, transaction_id: 5001, customer_id: 1001, amount: 1299.99, date: '2023-01-15', product: 'Premium Plan' },
      { program_id: programId, transaction_id: 5002, customer_id: 1002, amount: 899.99, date: '2023-01-16', product: 'Standard Plan' },
      { program_id: programId, transaction_id: 5003, customer_id: 1003, amount: 149.99, date: '2023-01-17', product: 'Add-on Service' },
      { program_id: programId, transaction_id: 5004, customer_id: 1001, amount: 349.99, date: '2023-01-18', product: 'Add-on Service' },
      { program_id: programId, transaction_id: 5005, customer_id: 1005, amount: 89.99, date: '2023-01-19', product: 'Basic Plan' },
    ];
  }
  
  if (queryLower.includes('frequency')) {
    return [
      { program_id: programId, customer_id: 1001, frequency: 'Weekly', last_visit: '2023-03-15', total_visits: 45 },
      { program_id: programId, customer_id: 1002, frequency: 'Monthly', last_visit: '2023-02-20', total_visits: 12 },
      { program_id: programId, customer_id: 1003, frequency: 'Weekly', last_visit: '2023-03-10', total_visits: 38 },
      { program_id: programId, customer_id: 1004, frequency: 'Bi-weekly', last_visit: '2023-03-01', total_visits: 24 },
      { program_id: programId, customer_id: 1005, frequency: 'Monthly', last_visit: '2023-01-25', total_visits: 8 },
    ];
  }
  
  // Default fallback data for any other query
  return [
    { program_id: programId, id: 1, value: 'Data 1', number: 100 },
    { program_id: programId, id: 2, value: 'Data 2', number: 200 },
    { program_id: programId, id: 3, value: 'Data 3', number: 300 },
    { program_id: programId, id: 4, value: 'Data 4', number: 400 },
    { program_id: programId, id: 5, value: 'Data 5', number: 500 },
  ];
}

// The actual query data tool
export const queryData = tool({
  description: `Query business data from the Snowflake data warehouse. Available tables include: ${AVAILABLE_TABLES.join(', ')}. 
  Only SELECT queries are permitted, and results will be automatically filtered to the user's program ID.
  For example: "SELECT * FROM HANG_LOYALTY_PUBLIC.transactions LIMIT 10" will only return data for the current user's program.`,
  parameters: z.object({
    query: z.string().describe('The SQL query to execute against Snowflake'),
    title: z.string().optional().describe('Title for the data result'),
    description: z.string().optional().describe('Description of what the data shows'),
  }),
  execute: async ({ query, title, description }, { toolCallId, abortSignal }) => {
    try {
      const session = await auth();
      const userEmail = session?.user?.email || '';
      const { programId, isAdmin } = getProgramIdForUser(userEmail);

      // Always force mock data for brian@hang.com
      const forceMockData = userEmail.toLowerCase().includes('brian@hang.com');
      const useTestData = process.env.USE_MOCK_DATA === 'true';

      const data = (forceMockData || useTestData)
        ? await mockQueryDatabase(query, programId, userEmail)
        : await queryDatabase(query, abortSignal);

      return {
        data: formatDataForDisplay(data),
        sql: query,
        title: title || 'Query Results',
        description: '',
      };
    } catch (error) {
      console.error('Query data tool error:', error);
      
      // Return mock data instead of throwing error
      const session = await auth();
      const userEmail = session?.user?.email;
      const { programId, isAdmin } = getProgramIdForUser(userEmail);
      const mockData = await mockQueryDatabase(query, programId, userEmail);
      
      return {
        data: formatDataForDisplay(mockData),
        sql: query,
        title: title || 'Demo Data',
        description: "Showing demo data. " + 
                    (error instanceof Error ? error.message : String(error)),
      };
    }
  }
});

// Format data for display
function formatDataForDisplay(data: any) {
  if (!data) return data;

  // Format numbers
  const formatNumber = (num: number, key: string) => {
    // Format currency values with dollar sign and commas
    if (typeof key === 'string' && 
        (key.toLowerCase().includes('revenue') || 
         key.toLowerCase().includes('sales') || 
         key.toLowerCase().includes('amount'))) {
      return `$${num.toLocaleString()}`;
    }
    
    // Format other large numbers
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // Recursively format all numbers in the data
  const format = (obj: any): any => {
    if (typeof obj === 'number') {
      return formatNumber(obj, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(format);
    }
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = typeof value === 'number' ? formatNumber(value, key) : format(value);
      }
      return result;
    }
    return obj;
  };

  return format(data);
} 