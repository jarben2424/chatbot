import { tool } from 'ai';
import { z } from 'zod';
import snowflake from 'snowflake-sdk';
import { OpenAI } from 'openai';
import { createClient } from '@/utils/supabase/server';

// Define types for Snowflake results and connections
type SnowflakeConnection = snowflake.Connection;
type SnowflakeRow = Record<string, any>;
type QueryResult = {
  query: string;
  results: SnowflakeRow[] | { data: SnowflakeRow[]; note: string } | any;
  visualizationType?: string;
};
type ErrorResult = {
  error: string;
  details: string;
}

/**
 * Business database query tool using Vercel AI SDK
 * Allows natural language queries against business data
 */
export const businessDbQuery = tool({
  description: 'Generate and execute SQL queries against business data based on natural language questions',
  parameters: z.object({
    question: z.string().describe('The natural language question about business data to convert to SQL'),
    conversationId: z.string().optional().describe('The ID of the conversation this query is part of'),
  }),
  execute: async ({ question, conversationId }): Promise<QueryResult | ErrorResult> => {
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

      // Generate SQL query from natural language question
      const sqlQuery = await generateSqlQuery(question);
      
      // Validate the generated query
      if (!validateQuery(sqlQuery)) {
        throw new Error('Generated query failed security validation');
      }
      
      // Execute the query with a timeout
      const results = await executeQuery(connection, sqlQuery);
      
      // Determine the visualization type based on the result structure
      const visualizationType = suggestVisualizationType(results);
      
      // Transform the results based on the visualization type
      const transformedResults = transformQueryResults(results, visualizationType);
      
      // Save the query and results to ChatGeneratedMetrics
      await saveChatGeneratedMetric({
        question,
        sqlQuery,
        conversationId,
        category: detectQueryCategory(question, sqlQuery),
        visualizationType,
      });
      
      // Return the query, results and visualization type
      return {
        query: sqlQuery,
        results: transformedResults,
        visualizationType,
      };
    } catch (error) {
      console.error('Error in business DB query execution:', error);
      return {
        error: `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.toString() : String(error)
      };
    } finally {
      // Always destroy the connection when done
      connection.destroy(function(err) {
        if (err) {
          console.error('Error destroying Snowflake connection:', err);
        }
      });
    }
  },
});

// Database schema definitions
const DATABASE_SCHEMA = {
  schema: 'HANG_LOYALTY_PUBLIC',
  tables: {
    CUSTOMERS: {
      columns: {
        ID: 'TEXT',
        PROGRAM_MEMBERSHIP_ID: 'TEXT',
        CREATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        PROGRAM_ID: 'NUMBER',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ',
        IS_ANONYMOUS_THIRD_PARTY: 'BOOLEAN'
      }
    },
    CUSTOMER_IDENTIFIERS: {
      columns: {
        ID: 'TEXT',
        CUSTOMER_ID: 'TEXT',
        IDENTIFIER_ID: 'TEXT',
        CREATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ'
      }
    },
    CUSTOMER_TRANSACTIONS: {
      columns: {
        ID: 'TEXT',
        CUSTOMER_ID: 'TEXT',
        TRANSACTION_ID: 'TEXT',
        CREATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ'
      }
    },
    PROGRAM_MEMBERSHIPS: {
      columns: {
        ID: 'TEXT',
        WALLET_ADDRESS: 'TEXT',
        NFT_LOYALTY_PROGRAM_ID: 'NUMBER',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        NFT_USER_ID: 'TEXT',
        ON_CHAIN_TOKEN_ID: 'NUMBER',
        CREATED_AT: 'TIMESTAMP_NTZ',
        EXTERNAL_USER_ID: 'TEXT',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ',
        DYNAMIC_ATTRIBUTES: 'VARIANT',
        SIGNUP_SOURCE: 'NUMBER',
        VERIFIED: 'BOOLEAN',
        VERIFIED_AT: 'TIMESTAMP_NTZ',
        EMAIL: 'TEXT',
        STRIPE_CUSTOMER_ID: 'TEXT',
        EMAIL_VERIFIED_AT: 'TIMESTAMP_NTZ',
        DELETED_AT: 'TIMESTAMP_NTZ'
      }
    },
    PROMOTED_REWARDS: {
      columns: {
        ID: 'NUMBER',
        END_DATE: 'TIMESTAMP_NTZ',
        IMAGE_SMALL_FILE_SIZE: 'NUMBER',
        IMAGE_HERO_FILE_SIZE: 'NUMBER',
        LOYALTY_REWARD_ID: 'NUMBER',
        IMAGE_HERO_UPDATED_AT: 'TIMESTAMP_NTZ',
        CREATED_AT: 'TIMESTAMP_NTZ',
        TITLE: 'TEXT',
        TITLE_SHORT: 'TEXT',
        DESCRIPTION_MD: 'TEXT',
        IMAGE_HERO_FILE_NAME: 'TEXT',
        IMAGE_SMALL_UPDATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        IMAGE_SMALL_FILE_NAME: 'TEXT',
        IMAGE_HERO_CONTENT_TYPE: 'TEXT',
        START_DATE: 'TIMESTAMP_NTZ',
        IMAGE_SMALL_CONTENT_TYPE: 'TEXT',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ',
        DYNAMIC_ATTRIBUTES: 'VARIANT',
        DELETED_AT: 'TIMESTAMP_NTZ'
      }
    },
    TRANSACTIONS: {
      columns: {
        ID: 'TEXT',
        EXTERNAL_ID: 'TEXT',
        EXTERNAL_ORDER_ID: 'TEXT',
        EXTERNAL_LOCATION_ID: 'TEXT',
        PROVIDER: 'NUMBER',
        TRANSACTION_TYPE: 'NUMBER',
        TOTAL_DISCOUNT: 'FLOAT',
        SOURCE: 'TEXT',
        VALUE: 'FLOAT',
        PROGRAM_ID: 'NUMBER',
        TRANSACTION_TIMESTAMP: 'TIMESTAMP_NTZ',
        CREATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        PROGRAM_MEMBERSHIP_ID: 'TEXT',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ',
        CLOSED_DATE: 'TIMESTAMP_NTZ',
        MODIFIED_TIME: 'TIMESTAMP_NTZ',
        TOTAL_REFUND: 'FLOAT',
        DETAILED_SOURCE: 'TEXT',
        LOCATION: 'TEXT',
        VOIDED: 'BOOLEAN',
        TOTAL_DEFERRED_SALES: 'FLOAT',
        PROMISED_DATE: 'TIMESTAMP_NTZ',
        TOTAL_DEFERRED_ITEMS: 'FLOAT',
        TOTAL_NON_GRATUITY_SERVICE_CHARGE: 'FLOAT'
      }
    },
    TRANSACTION_IDENTIFIERS: {
      columns: {
        ID: 'TEXT',
        TRANSACTION_ID: 'TEXT',
        IDENTIFIER_ID: 'TEXT',
        CREATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ'
      }
    },
    TRANSACTION_LINE_ITEMS: {
      columns: {
        ID: 'TEXT',
        TRANSACTION_ID: 'TEXT',
        VALUE: 'FLOAT',
        QUANTITY: 'NUMBER',
        EXTERNAL_ID: 'TEXT',
        EXTERNAL_ITEM_ID: 'TEXT',
        EXTERNAL_GROUP_ID: 'TEXT',
        EXTERNAL_MULTI_LOCATION_ITEM_ID: 'TEXT',
        EXTERNAL_MULTI_LOCATION_GROUP_ID: 'TEXT',
        CREATED_AT: 'TIMESTAMP_NTZ',
        UPDATED_AT: 'TIMESTAMP_NTZ',
        _FIVETRAN_DELETED: 'BOOLEAN',
        _FIVETRAN_SYNCED: 'TIMESTAMP_TZ',
        DISPLAY_NAME: 'TEXT',
        UNIT_PRICE: 'FLOAT',
        GROUP_DISPLAY_NAME: 'TEXT'
      }
    }
  }
};

// SQL generation requirements
const QUERY_REQUIREMENTS = [
  'Queries will run on Snowflake',
  'Filter out records with _FIVETRAN_DELETED = true in ALL queries',
  'Timestamps are stored in UTC; convert them using CONVERT_TIMEZONE(\'UTC\', \'America/Los_Angeles\', transaction_timestamp) when filtering by date',
  'ALWAYS filter for program_id = 1614 when querying hang_loyalty_public.transactions',
  'Use clear column aliases for better readability',
  'Limit result sets to a reasonable number of rows (e.g., LIMIT 1000)',
  'For time-based queries, ensure proper timestamp conversion and timezone handling',
  'When calculating aggregates, include appropriate GROUP BY clauses',
  'For financial calculations, use ROUND() for currency values',
  'Add appropriate ORDER BY clauses for ranked or sorted data',
  'Handle NULL values appropriately using COALESCE() or IS NULL/IS NOT NULL conditions',
  'Output clean, well-formatted SQL with consistent indentation'
];

// Example queries
const EXAMPLE_QUERIES = [
  {
    question: 'How many transactions did we have in November 2024 at our Nashville Midtown location?',
    sql: `SELECT COUNT(*) AS transaction_count
FROM hang_loyalty_public.transactions
WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transactions.transaction_timestamp) >= '2024-11-01'
  AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transactions.transaction_timestamp) < '2024-12-01'
  AND transactions.location = 'Nashville - Midtown'
  AND transactions.program_id = 1614
  AND transactions._FIVETRAN_DELETED = false`
  },
  {
    question: 'What was our most popular location last week based on transaction count?',
    sql: `SELECT location, COUNT(*) AS transaction_count
FROM hang_loyalty_public.transactions
WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATEADD(DAY, -7, CURRENT_DATE)
  AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < CURRENT_DATE
  AND transactions.program_id = 1614
  AND transactions._FIVETRAN_DELETED = false
GROUP BY location
ORDER BY transaction_count DESC
LIMIT 1`
  },
  {
    question: 'How many orders did we have today?',
    sql: `SELECT COUNT(DISTINCT id) AS num_orders 
FROM hang_loyalty_public.transactions 
WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp)::date = CURRENT_DATE
  AND program_id = 1614
  AND _FIVETRAN_DELETED = false`
  },
  {
    question: 'What are some unique item names?',
    sql: `SELECT DISTINCT name AS item_name
FROM hang_loyalty_public.menu_items
WHERE _FIVETRAN_DELETED = false
ORDER BY item_name
LIMIT 50`
  },
  {
    question: 'What\'s our total revenue by location?',
    sql: `SELECT location, SUM(amount) AS total_revenue
FROM hang_loyalty_public.transactions
WHERE program_id = 1614
  AND _FIVETRAN_DELETED = false
GROUP BY location
ORDER BY total_revenue DESC`
  }
];

// Additional rules (kept as an array for clarity)
const ADDITIONAL_RULES = [
  'When the query needs to filter strings, always use ILIKE %..% unless exact match explicitly requested',
  'Use \\ as escape character; use \\\\ for literal \\',
  'Use average functions for averages, excluding nulls; avoid SUM()/COUNT()',
  'Subqueries without IN must return one row using MIN/MAX/ANY_VALUE',
  'SAMPLE(10) means 10%; use ROWS for specific row counts',
  'For simple arrays after flattening, use value directly',
  'Flatten JSON arrays with CROSS JOIN LATERAL FLATTEN; use <alias>.value',
  'Extract JSON object values with c[\'key1\'] or c:key2',
  'Avoid JSON functions unless requested',
  'Check ARRAY/VARIANT for strings with LATERAL FLATTEN and ILIKE',
  'Use MEDIAN(col) for medians',
  'Never use subqueries in SELECT clause',
  'For "last <unit>", use DATE_TRUNC(\'<unit>\', CURRENT_DATE - INTERVAL \'1 <unit>\')',
  'Interpret seasonal terms relative to current date',
  'Use TRANSACTION_TIMESTAMP for transaction timing',
  'Use meaningful aliases',
  'Sum transaction_line_item.value for line item sales',
  '"Program" means program_id',
  'First purchase uses earliest TRANSACTION_TIMESTAMP',
  'Always filter date ranges by year and month',
  'Use transactions.detailed_source for "channel" or "source"',
  'Convert UTC to PST with CONVERT_TIMEZONE',
  'For ROI: link redemptions to transactions via program_membership_id within 1-minute window',
  'Exclude customer IDs: \'1661bbcf-d1ee-495e-a915-d78a0ae6cae2\', \'d33d8333-90bb-4bb2-949d-585e20a168c2\'',
  'Aggregate for trends; detail for specific transactions',
  'Group MoM figures by month and year',
  'Repeat customer = 2+ distinct transactions',
  'AOV = AVG(value - total_deferred_items)',
  'Map "in-store" to transactions.detailed_source',
  'DATE_TRUNC returns full timestamps; handle appropriately',
  'Label duration outputs with units',
  'Join customer_transactions for customer-level data',
  'UPDATED_AT is redeem time',
  'Use 30-day window for frequency',
  '"Return rate" is 7-day following return rate',
  'Return rate = (Returning customers) / (Total initial customers)',
  'Use display_name for item reports',
  'Retention: 30-day (1–30), 60-day (31–60), 90-day (61–90)',
  'Use DATE_TRUNC for time-based aggregates',
  'First purchase date for customer acquisition',
  'Total sales = SUM(value - total_deferred_items)',
  'Visits/month buckets: <1, 1-5, >5',
  'Order modifiers in TOAST_RESTAURANT_ORDERS.transaction_payload'
];

// Construct system prompt
const getSystemPrompt = () => `
You are a SQL query generator for a business database. Generate a SQL query for the user's question.

DATABASE DETAILS:
${JSON.stringify(DATABASE_SCHEMA, null, 2)}

IMPORTANT QUERY REQUIREMENTS:
${QUERY_REQUIREMENTS.join('\n')}

EXAMPLE QUERIES:
${EXAMPLE_QUERIES.map((ex, i) => `${i + 1}. ${ex.question}\n\`\`\`sql\n${ex.sql}\n\`\`\``).join('\n\n')}

ADDITIONAL CONTEXT AND IMPORTANT RULES:
${ADDITIONAL_RULES.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}
`;

/**
 * Generates a SQL query from a natural language question using AI
 */
async function generateSqlQuery(question: string): Promise<string> {
  try {
    // Create OpenAI client directly
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Use OpenAI API directly
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: question }
      ],
      temperature: 0.1, // Low temperature for more deterministic responses
      max_tokens: 1000, // Adjust as needed for longer queries
    });

    // Extract and clean up the SQL query from the response
    let sqlQuery = response.choices[0]?.message?.content?.trim() || '';
    
    // If query is wrapped in markdown code blocks, extract just the SQL
    if (sqlQuery.includes('```sql')) {
      sqlQuery = sqlQuery.split('```sql')[1].split('```')[0].trim();
    } else if (sqlQuery.includes('```')) {
      sqlQuery = sqlQuery.split('```')[1].split('```')[0].trim();
    }

    return sqlQuery;
  } catch (error) {
    console.error('Failed to generate SQL query:', error);
    throw new Error(`Unable to generate SQL from your question: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates a SQL query for security 
 */
function validateQuery(sqlQuery: string): boolean {
  // Convert to lowercase for case-insensitive checks
  const lowerCaseQuery = sqlQuery.toLowerCase();
  
  // Check for destructive or administrative commands
  const disallowedCommands = [
    'drop table', 'drop database', 'truncate table', 'delete from',
    'alter table', 'create table', 'grant ', 'revoke ', 
    'insert into', 'update ', 'merge into', 'create user'
  ];
  
  for (const command of disallowedCommands) {
    if (lowerCaseQuery.includes(command)) {
      console.error(`Query validation failed: contains disallowed command '${command}'`);
      return false;
    }
  }
  
  // Ensure the query is a SELECT statement
  if (!lowerCaseQuery.trim().startsWith('select')) {
    console.error('Query validation failed: not a SELECT statement');
    return false;
  }
  
  // Additional validation rules can be added here based on specific requirements
  return true;
}

/**
 * Executes a SQL query against Snowflake with a timeout
 */
async function executeQuery(connection: SnowflakeConnection, sqlQuery: string): Promise<SnowflakeRow[]> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    
    // Set a timeout for query execution (30 seconds)
    const timeout = 30000;
    timeoutId = setTimeout(() => {
      reject(new Error(`Query execution timed out after ${timeout / 1000} seconds`));
    }, timeout);
    
    connection.execute({
      sqlText: sqlQuery,
      complete: (err, stmt, rows) => {
        clearTimeout(timeoutId);
        
        if (err) {
          console.error('Error executing SQL query:', err);
          reject(err);
        } else {
          console.log(`Query executed successfully, returned ${rows?.length || 0} rows`);
          resolve(rows || []);
        }
      }
    });
  });
}

/**
 * Format query results for presentation
 */
function formatResults(results: SnowflakeRow[]): SnowflakeRow[] | { data: SnowflakeRow[]; note: string } {
  if (results.length === 0) {
    return { data: [], note: 'No results found for your query.' };
  }
  
  // If too many results, return a subset with a note
  const maxRowsToReturn = 100;
  if (results.length > maxRowsToReturn) {
    return {
      data: results.slice(0, maxRowsToReturn),
      note: `Showing first ${maxRowsToReturn} of ${results.length} results.`
    };
  }
  
  return results;
}

/**
 * Determines the category for a query (sales, customers, skus, or general)
 */
function detectQueryCategory(question: string, sqlQuery: string): string {
  const lowerQuestion = question.toLowerCase();
  const lowerQuery = sqlQuery.toLowerCase();
  
  // Check for sales/revenue related terms
  if (
    lowerQuestion.includes('sales') || 
    lowerQuestion.includes('revenue') || 
    lowerQuestion.includes('transaction') ||
    lowerQuery.includes('sum(amount)')
  ) {
    return 'sales';
  }
  
  // Check for customer related terms
  if (
    lowerQuestion.includes('customer') || 
    lowerQuestion.includes('user') || 
    lowerQuestion.includes('client') ||
    lowerQuery.includes('hang_loyalty_public.users')
  ) {
    return 'customers';
  }
  
  // Check for product/SKU related terms
  if (
    lowerQuestion.includes('product') || 
    lowerQuestion.includes('item') || 
    lowerQuestion.includes('sku') ||
    lowerQuestion.includes('menu item') ||
    lowerQuery.includes('menu_items')
  ) {
    return 'skus';
  }
  
  // Default to general
  return 'general';
}

/**
 * Suggests a visualization type based on the query results
 */
function suggestVisualizationType(results: SnowflakeRow[]): string {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return 'table';
  }
  
  // If there's only one row with one or two values, suggest highlight
  if (results.length === 1 && Object.keys(results[0]).length <= 2) {
    return 'highlight';
  }
  
  // Check for date/time columns for time series data
  const firstRow = results[0];
  const columns = Object.keys(firstRow);
  
  // Look for time-based columns
  const timeColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('month') ||
    col.toLowerCase().includes('day') ||
    col.toLowerCase().includes('week')
  );
  
  // Look for numeric columns
  const numericColumns = columns.filter(col => {
    const value = firstRow[col];
    return typeof value === 'number';
  });
  
  // If there's a date column and numeric column, suggest line chart for time series
  if (timeColumns.length > 0 && numericColumns.length > 0) {
    return 'line-chart';
  }
  
  // If there are categorical columns with numeric values, suggest bar chart
  if (columns.length >= 2 && numericColumns.length > 0) {
    return 'bar-chart';
  }
  
  // Default to table view
  return 'table';
}

/**
 * Transforms query results into the appropriate format for visualization
 */
function transformQueryResults(results: SnowflakeRow[], visualizationType: string): any {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return results;
  }

  // Transform based on the visualization type
  switch (visualizationType) {
    case 'line-chart':
      return transformForLineChart(results);
    case 'bar-chart':
      return transformForBarChart(results);
    case 'highlight':
      return transformForHighlight(results);
    default:
      return results;
  }
}

/**
 * Transforms query results for line chart visualization
 * Identifies time dimension and numeric measures
 */
function transformForLineChart(results: SnowflakeRow[]): any {
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

/**
 * Transforms query results for bar chart visualization
 * Identifies categorical dimension and numeric measures
 */
function transformForBarChart(results: SnowflakeRow[]): any {
  if (!results || results.length === 0) return { data: [], xKey: '', yKeys: [] };
  
  const columns = Object.keys(results[0]);
  
  // Find numeric columns for measures
  const numericColumns = columns.filter(col => {
    const value = results[0][col];
    return typeof value === 'number';
  });
  
  // Find non-numeric column for categories
  const categoricalColumns = columns.filter(col => {
    const value = results[0][col];
    return typeof value !== 'number';
  });
  
  const categoryColumn = categoricalColumns[0] || columns[0];
  
  // Limit the number of categories to prevent overcrowding
  let formattedData = results;
  if (results.length > 10) {
    // Sort by the first numeric column in descending order and take top 10
    const sortColumn = numericColumns[0];
    if (sortColumn) {
      formattedData = [...results]
        .sort((a, b) => (b[sortColumn] as number) - (a[sortColumn] as number))
        .slice(0, 10);
    } else {
      formattedData = results.slice(0, 10);
    }
  }
  
  return {
    data: formattedData,
    xKey: categoryColumn,
    yKeys: numericColumns
  };
}

/**
 * Transforms query results for a highlight (KPI) visualization
 */
function transformForHighlight(results: any[]): any {
  if (!results || results.length === 0) {
    return { value: 'No data', label: 'No results found' };
  }

  const row = results[0];
  const keys = Object.keys(row);
  
  if (keys.length === 1) {
    // Single value with no header
    const key = keys[0];
    return { 
      value: formatValue(row[key]), 
      label: key.replace(/_/g, ' '),
      rawValue: row[key]
    };
  } else if (keys.length === 2) {
    // Assume first column is label, second is value
    const [labelKey, valueKey] = keys;
    return { 
      value: formatValue(row[valueKey]), 
      label: row[labelKey] || valueKey.replace(/_/g, ' '),
      rawValue: row[valueKey]
    };
  } else {
    // Take the first numeric column as the value
    const numericKey = keys.find(key => typeof row[key] === 'number');
    const labelKey = keys.find(key => key !== numericKey && typeof row[key] === 'string');
    
    return { 
      value: numericKey ? formatValue(row[numericKey]) : 'N/A', 
      label: labelKey ? row[labelKey] : numericKey?.replace(/_/g, ' ') || 'Value',
      rawValue: numericKey ? row[numericKey] : null
    };
  }
}

/**
 * Helper function to format values nicely
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  
  if (typeof value === 'number') {
    // Add commas for thousands and format decimals consistently
    if (value % 1 === 0) {
      return value.toLocaleString();
    } else {
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  }
  
  return String(value);
}

/**
 * Saves a chat-generated metric to the database
 */
async function saveChatGeneratedMetric({
  question,
  sqlQuery,
  conversationId,
  category,
  visualizationType,
}: {
  question: string;
  sqlQuery: string;
  conversationId?: string;
  category: string;
  visualizationType: string;
}): Promise<void> {
  try {
    console.log('Starting to save chat generated metric directly to database...');
    
    // Import the createClient function and auth at runtime
    const { createClient } = await import('@/utils/supabase/server');
    const { auth } = await import('@/app/(auth)/auth');
    
    // Get the authenticated user's session - using exact approach from chat route
    console.log('Getting authentication session...');
    const session = await auth();
    
    // Use the same check pattern as the chat route
    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated user found when trying to save chat generated metric');
      return;
    }
    
    console.log('Found authenticated user ID:', session.user.id);
    
    // Create Supabase client directly (like the chat route does)
    const supabase = await createClient();
    
    // Generate a title from the question
    const title = question.length > 50 
      ? question.substring(0, 47) + '...' 
      : question;
    
    console.log('Inserting metric into database with user ID:', session.user.id);
    
    // Insert directly into Supabase with the user's ID explicitly set
    const { data, error } = await supabase
      .from('ChatGeneratedMetrics')
      .insert({
        userid: session.user.id, // Explicitly set the user ID from the session
        title,
        description: question,
        question,
        sqlquery: sqlQuery,
        visualizationtype: visualizationType || 'table',
        category: category || 'general',
        conversationid: conversationId || null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to save chat generated metric:', error);
    } else {
      console.log('Successfully saved chat generated metric with ID:', data?.id);
    }
  } catch (error) {
    console.error('Error in saveChatGeneratedMetric:', error);
  }
}