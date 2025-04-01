import { tool } from 'ai';
import { z } from 'zod';
import snowflake from 'snowflake-sdk';
import { auth } from '@/app/(auth)/auth';
import { getProgramIdForUser } from '@/lib/auth/program-mapping';

// Create a Snowflake connection
function createSnowflakeConnection() {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT || '',
    username: process.env.SNOWFLAKE_USERNAME || '',
    password: process.env.SNOWFLAKE_PASSWORD || '',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || '',
    database: process.env.SNOWFLAKE_DATABASE || ''
  });
}

// List of available tables in the database
const AVAILABLE_TABLES = [
  // Only allow these specific tables
  'HANG_LOYALTY_PUBLIC.customer_transactions',
  'HANG_LOYALTY_PUBLIC.transactions',
  'HANG_LOYALTY_PUBLIC.transaction_line_items'
];

// Function to get table schema from Snowflake
async function getTableSchema(tableName: string): Promise<{
  success: boolean;
  columns: { name: string; type: string }[];
  error?: string;
}> {
  // Create a Snowflake connection
  const connection = createSnowflakeConnection();
  
  return new Promise((resolve) => {
    try {
      connection.connect((err) => {
        if (err) {
          console.error('Error connecting to Snowflake for schema check:', err);
          resolve({ 
            success: false, 
            columns: [],
            error: `Snowflake connection error: ${err.message}` 
          });
          return;
        }
        
        // Get the schema and table name
        const parts = tableName.split('.');
        const schema = parts[0];
        const table = parts[1];
        
        // Query for column information
        const schemaQuery = `
          SELECT 
            COLUMN_NAME as "name", 
            DATA_TYPE as "type"
          FROM 
            INFORMATION_SCHEMA.COLUMNS
          WHERE 
            TABLE_SCHEMA = '${schema}' 
            AND TABLE_NAME = '${table}'
          ORDER BY 
            ORDINAL_POSITION
        `;
        
        console.log(`Executing schema query for ${tableName}:`, schemaQuery);
        
        connection.execute({
          sqlText: schemaQuery,
          complete: (err, stmt, rows) => {
            // Always terminate the connection
            try {
              connection.destroy(function(destroyErr) {
                if (destroyErr) {
                  console.error('Error destroying schema connection:', destroyErr);
                }
              });
            } catch (destroyError) {
              console.error('Error while attempting to destroy schema connection:', destroyError);
            }
            
            if (err) {
              console.error('Error fetching schema:', err);
              resolve({ 
                success: false, 
                columns: [],
                error: `Schema query error: ${err.message}` 
              });
              return;
            }
            
            if (!rows || rows.length === 0) {
              console.warn(`No columns found for table ${tableName}`);
              resolve({ 
                success: false, 
                columns: [],
                error: `No columns found for table ${tableName}` 
              });
              return;
            }
            
            console.log(`Found ${rows.length} columns for ${tableName}:`, rows);
            resolve({ 
              success: true, 
              columns: rows 
            });
          }
        });
      });
    } catch (error) {
      console.error('Unexpected error getting schema:', error);
      resolve({ 
        success: false, 
        columns: [],
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  });
}

// Execute a query against Snowflake - without any mock data fallbacks
export async function executeQuery(query: string): Promise<any[]> {
  // Get the current user session
  const session = await auth();
  const userEmail = session?.user?.email || '';
  const { isAdmin, programId } = getProgramIdForUser(userEmail);
  
  console.log(`Executing query for user ${userEmail} with program ID ${programId}, admin: ${isAdmin}`);
  
  // Make a copy of the query for modifications
  let workingQuery = query;
  
  // Log the original query for debugging
  console.log('Original query for QSR data:', workingQuery);
  
  // Validate query is read-only SELECT statement
  const queryLower = workingQuery.trim().toLowerCase();
  if (!queryLower.startsWith('select ')) {
    console.error('Rejecting non-SELECT query for security reasons:', workingQuery);
    throw new Error('Only SELECT queries are permitted for security reasons');
  }
  
  // Check for allowed tables and get their schemas
  let targetTable = '';
  for (const tableName of AVAILABLE_TABLES) {
    // Handle both with and without schema prefix
    const tableNameWithoutSchema = tableName.includes('.') ? 
      tableName.split('.')[1].toLowerCase() : 
      tableName.toLowerCase();
    
    if (queryLower.includes(tableName.toLowerCase()) || 
        queryLower.includes(tableNameWithoutSchema)) {
      targetTable = tableName;
      break;
    }
  }
  
  if (!targetTable) {
    console.error('Query references tables not in the allowed list:', workingQuery);
    throw new Error(`Only queries against the following tables are permitted: ${AVAILABLE_TABLES.join(', ')}`);
  }
  
  // Get schema for ALL queries to fix column names
  try {
    // Get the schema to correctly handle all column references
    const { success, columns } = await getTableSchema(targetTable);
    
    if (success && columns && columns.length > 0) {
      console.log('Full schema for table:', targetTable);
      
      // First, handle all column names to ensure proper quoting and case
      for (const column of columns) {
        // Skip any system columns that start with underscore
        if (column.name.startsWith('_')) continue;
        
        // Create a regex that would match the column name as a whole word, case-insensitive
        // But avoid replacing if it's already properly quoted
        const unquotedRegex = new RegExp(`\\b${column.name}\\b(?!")`, 'gi');
        
        // Check if this column appears unquoted in the query
        if (unquotedRegex.test(workingQuery)) {
          // Replace unquoted column references with properly quoted ones
          workingQuery = workingQuery.replace(unquotedRegex, `"${column.name}"`);
          console.log(`Fixed column reference: ${column.name}`);
        }
      }
      
      // Then, special handling for date columns
      if (queryLower.includes('date')) {
        const dateColumns = columns.filter(col => 
          col.type.includes('DATE') || col.type.includes('TIMESTAMP')
        );
        
        if (dateColumns.length > 0) {
          // Use the first date column as the primary one
          const primaryDateColumn = dateColumns[0].name;
          console.log(`Using primary date column from schema: ${primaryDateColumn}`);
          
          // Replace all references to 'date' with the actual column name
          // IMPORTANT: In Snowflake, quoted identifiers are case-sensitive
          workingQuery = workingQuery.replace(/\bdate\b/gi, `"${primaryDateColumn}"`);
          console.log('Query after date column preprocessing:', workingQuery);
        }
      }
      
      // For unquoted identifiers, Snowflake is usually case-insensitive
      // But we need to handle common column naming patterns and ensure proper quoting
      
      // First, print the exact column names we have in the schema
      console.log(`Full schema for ${targetTable}: ${columns.map(col => col.name).join(', ')}`);
      
      // Handle transaction_id specifically - a common column that might not exist with that exact name
      if (workingQuery.toLowerCase().includes('transaction_id')) {
        // Try to find the best match for transaction_id in the schema
        // Look for ID, id, TRANSACTION_ID, or any column with "id" in the name
        const idColumn = columns.find(col => 
          col.name.toLowerCase() === 'id' || 
          col.name.toLowerCase() === 'transaction_id' ||
          col.name.toLowerCase().includes('id')
        );
        
        if (idColumn) {
          const exactName = idColumn.name;
          console.log(`Fixing transaction_id reference to use ${exactName}`);
          // Replace all variations with the correct column name with proper quoting
          workingQuery = workingQuery.replace(/\btransaction_id\b/gi, `"${exactName}"`);
        } else {
          console.warn('Could not find a suitable ID column in the schema');
        }
      }
      
      // Special case for any other potential column issues
      // This ensures all column references are properly quoted with the exact case from the schema
      columns.forEach(column => {
        const lcName = column.name.toLowerCase();
        const exactName = column.name;
        
        // Check for unquoted lowercase versions of this column name
        const lcRegex = new RegExp(`\\b${lcName}\\b(?!")`, 'gi');
        if (lcRegex.test(workingQuery.toLowerCase())) {
          console.log(`Fixing lowercase reference to ${lcName} to use exact case: ${exactName}`);
          // Use a regex that's case-insensitive but preserves the original query's case structure
          const replaceRegex = new RegExp(`\\b${lcName}\\b`, 'gi');
          workingQuery = workingQuery.replace(replaceRegex, `"${exactName}"`);
        }
      });
    }
  } catch (error) {
    console.error('Error fixing column names with schema:', error);
    // Continue with the query as is, but log the error
  }

  // Use the query as-is without adding program_id filtering for admin users
  const modifiedQuery = isAdmin
    ? workingQuery  // Admin users can query all data without filtering
    : addProgramIdFilter(workingQuery, programId);

  // Log the final query that will be executed
  console.log('Final QSR data query to execute:', modifiedQuery);

  return new Promise((resolve, reject) => {
    try {
      const connection = createSnowflakeConnection();
      
      // Log Snowflake connection details (without sensitive info)
      console.log('Creating Snowflake connection with account:', 
        process.env.SNOWFLAKE_ACCOUNT ? `${process.env.SNOWFLAKE_ACCOUNT.substring(0, 3)}...` : 'undefined',
        'username:', process.env.SNOWFLAKE_USERNAME ? `${process.env.SNOWFLAKE_USERNAME.substring(0, 3)}...` : 'undefined',
        'warehouse:', process.env.SNOWFLAKE_WAREHOUSE,
        'database:', process.env.SNOWFLAKE_DATABASE
      );
      
      connection.connect((err) => {
        if (err) {
          console.error('Error connecting to Snowflake:', err);
          reject(new Error(`Snowflake connection error: ${err.message}`));
          return;
        }
        
        console.log('Successfully connected to Snowflake, executing QSR data query:', modifiedQuery);
        
        // Execute the modified query
        connection.execute({
          sqlText: modifiedQuery,
          complete: (err, stmt, rows) => {
            // Always terminate the connection
            try {
              connection.destroy(function(destroyErr) {
                if (destroyErr) {
                  console.error('Error destroying connection:', destroyErr);
                }
              });
            } catch (destroyError) {
              console.error('Error while attempting to destroy connection:', destroyError);
            }
            
            if (err) {
              console.error('Error executing QSR data query:', err);
              reject(new Error(`Snowflake query error: ${err.message}`));
              return;
            }
            
            // Log the result for debugging
            const rowCount = rows ? rows.length : 0;
            console.log('QSR data query executed successfully. Result rows:', rowCount);
            if (rows && rows.length > 0) {
              console.log('First row sample:', JSON.stringify(rows[0]).substring(0, 200));
            }
            
            resolve(rows || []);
          }
        });
      });
    } catch (error) {
      console.error('Unexpected error in executeQuery for QSR data:', error);
      reject(new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`));
    }
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

// The direct query data tool - no fallbacks to mock data
export const directQueryTool = tool({
  description: `Query real QSR (Quick Service Restaurant) business data directly from Snowflake. Available tables include: ${AVAILABLE_TABLES.join(', ')}. 
  
  The data comes from point-of-sale systems for multiple restaurant chains and includes:
  - Transaction records (transactions table) - information about customer purchases, amounts, and dates
  - Line items (transaction_line_items table) - detailed information about products purchased in each transaction
  - Customer transactions (customer_transactions table) - links customers to their transactions
  
  Only SELECT queries are permitted, and queries will return data from ALL restaurant programs/brands.
  
  Example: "SELECT * FROM \"HANG_LOYALTY_PUBLIC\".\"transactions\" ORDER BY \"transaction_date\" DESC LIMIT 10"`,
  parameters: z.object({
    query: z.string().describe('The SQL query to execute against Snowflake for QSR data'),
    title: z.string().optional().describe('Title for the data result'),
    description: z.string().optional().describe('Description of what the data shows'),
  }),
  execute: async ({ query, title, description }, { toolCallId }) => {
    try {
      // Execute the query against Snowflake - will throw errors if connection fails
      const data = await executeQuery(query);

      return {
        data: formatDataForDisplay(data),
        sql: query,
        title: title || 'QSR Data Results',
        description: description || '',
      };
    } catch (error) {
      // Don't catch and fall back - let the error propagate
      console.error('Direct query tool error for QSR data:', error);
      throw error;
    }
  }
}); 