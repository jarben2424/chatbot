import { tool } from 'ai';
import { z } from 'zod';
import snowflake from 'snowflake-sdk';
import { OpenAI } from 'openai';

// Define types for Snowflake results and connections
type SnowflakeConnection = snowflake.Connection;
type SnowflakeRow = Record<string, any>;
type QueryResult = {
  query: string;
  results: SnowflakeRow[] | { data: SnowflakeRow[]; note: string };
};
type ErrorResult = {
  error: string;
  details: string;
};

/**
 * Business database query tool using Vercel AI SDK
 * Allows natural language queries against business data
 */
export const businessDbQuery = tool({
  description: 'Generate and execute SQL queries against business data based on natural language questions',
  parameters: z.object({
    question: z.string().describe('The natural language question about business data to convert to SQL'),
  }),
  execute: async ({ question }): Promise<QueryResult | ErrorResult> => {
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
      
      // Format and return results
      return {
        query: sqlQuery,
        results: formatResults(results),
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

/**
 * Generates a SQL query from a natural language question using AI
 */
async function generateSqlQuery(question: string): Promise<string> {
  try {
    // Create OpenAI client directly
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // System prompt that guides SQL generation with extensive context and examples
    const systemPrompt = `
You are a SQL query generator for a business database. Generate a SQL query for the user's question.

DATABASE DETAILS:
You have access to a database with these tables:
- hang_loyalty_public.transactions (columns: id, location, amount, transaction_timestamp, transaction_type, program_id, user_id, detailed_source, value, total_deferred_items, etc)
- hang_loyalty_public.users (columns: id, email, name, etc)
- hang_loyalty_public.earning_redemptions (columns: id, transaction_id, etc)
- hang_loyalty_public.transaction_line_items (columns: transaction_id, quantity, item_name, etc)
- hang_loyalty_public.menu_items (columns: id, name, price, category, description, etc)

IMPORTANT QUERY REQUIREMENTS:
1. Queries will run on Snowflake
2. Filter out records with _FIVETRAN_DELETED = true in ALL queries
3. Timestamps are stored in UTC; convert them using CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) when filtering by date
4. ALWAYS filter for program_id = 1614 when querying hang_loyalty_public.transactions
5. Use clear column aliases for better readability
6. Limit result sets to a reasonable number of rows (e.g., LIMIT 1000)
7. For time-based queries, ensure proper timestamp conversion and timezone handling
8. When calculating aggregates, include appropriate GROUP BY clauses
9. For financial calculations, use ROUND() for currency values
10. Add appropriate ORDER BY clauses for ranked or sorted data
11. Handle NULL values appropriately using COALESCE() or IS NULL/IS NOT NULL conditions
12. Output clean, well-formatted SQL with consistent indentation

EXAMPLE QUERIES:

1. How many transactions did we have in November 2024 at our Nashville Midtown location?
\`\`\`sql
SELECT COUNT(*) AS transaction_count
FROM hang_loyalty_public.transactions
WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transactions.transaction_timestamp) >= '2024-11-01'
  AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transactions.transaction_timestamp) < '2024-12-01'
  AND transactions.location = 'Nashville - Midtown'
  AND transactions.program_id = 1614
  AND transactions._FIVETRAN_DELETED = false
\`\`\`

2. What was our most popular location last week based on transaction count?
\`\`\`sql
SELECT location, COUNT(*) AS transaction_count
FROM hang_loyalty_public.transactions
WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATEADD(DAY, -7, CURRENT_DATE)
  AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < CURRENT_DATE
  AND transactions.program_id = 1614
  AND transactions._FIVETRAN_DELETED = false
GROUP BY location
ORDER BY transaction_count DESC
LIMIT 1
\`\`\`

3. How many orders did we have today?
\`\`\`sql
SELECT COUNT(DISTINCT id) AS num_orders 
FROM hang_loyalty_public.transactions 
WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp)::date = CURRENT_DATE
  AND program_id = 1614
  AND _FIVETRAN_DELETED = false
\`\`\`

4. What are some unique item names?
\`\`\`sql
SELECT DISTINCT name AS item_name
FROM hang_loyalty_public.menu_items
WHERE _FIVETRAN_DELETED = false
ORDER BY item_name
LIMIT 50
\`\`\`

5. What's our total revenue by location?
\`\`\`sql
SELECT location, SUM(amount) AS total_revenue
FROM hang_loyalty_public.transactions
WHERE program_id = 1614
  AND _FIVETRAN_DELETED = false
GROUP BY location
ORDER BY total_revenue DESC
\`\`\`
`;

    // Use OpenAI API directly
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
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
