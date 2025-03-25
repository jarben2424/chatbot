import { tool } from 'ai';
import { z } from 'zod';
import snowflake from 'snowflake-sdk';
import { OpenAI } from 'openai';

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

// Connection pool for Snowflake
const connectionPool: { [key: string]: snowflake.Connection } = {};
const connectionUsage: { [key: string]: number } = {}; // Track last usage timestamp
const MAX_POOL_SIZE = 10; // Maximum number of connections to keep in the pool
const MAX_RETRIES = 2;
const CONNECTION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Periodic cleanup of idle connections (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    try {
      await cleanupIdleConnections();
    } catch (error) {
      console.error('Error during idle connection cleanup:', error);
    }
  }, 5 * 60 * 1000);
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

    // Initialize connection variable to ensure it's defined
    let connection: SnowflakeConnection | undefined = undefined;
    const connectionKey = `${username}@${account}`;
    
    try {
      // Try to get an existing connection from the pool or create a new one
      for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
        try {
          // Try to get an existing connection from the pool
          if (connectionPool[connectionKey] && await isConnectionValid(connectionPool[connectionKey])) {
            console.log('Using existing Snowflake connection from pool');
            connection = connectionPool[connectionKey];
            updateConnectionUsage(connectionKey);
          } else {
            // Create a new connection
            console.log('Creating new Snowflake connection');
            // Remove any stale connection from pool if exists
            if (connectionPool[connectionKey]) {
              try {
                await destroyConnection(connectionPool[connectionKey]);
              } catch (err) {
                console.error('Error destroying stale connection:', err);
              }
              delete connectionPool[connectionKey];
            }
            
            connection = snowflake.createConnection({
              account,
              username,
              password,
              warehouse,
              database,
            });
            
            // Connect with retry logic
            await connectWithRetry(connection);
            
            // Store in connection pool
            addToPool(connectionKey, connection);
          }
          
          // If we reach here, we have a valid connection
          break;
        } catch (err) {
          console.error(`Connection attempt ${attempt + 1} failed:`, err);
          if (attempt === MAX_RETRIES) {
            throw err; // Re-throw on last attempt
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
      
      // Generate SQL query from natural language question
      const sqlQuery = await generateSqlQuery(question);
      
      // Validate the generated query
      if (!validateQuery(sqlQuery)) {
        throw new Error('Generated query failed security validation');
      }
      
      // Execute the query with a timeout
      const results = await executeQuery(connection as SnowflakeConnection, sqlQuery);
      
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
    } catch (error: any) {
      console.error('Error in business DB query execution:', error);
      
      // Clean up connection only if we have a connection error
      if (connection && (
          error.code === 407002 || 
          (error.message && (
            error.message.includes('terminated connection') || 
            error.message.includes('Unable to perform operation')
          ))
      )) {
        try {
          console.log('Destroying failed connection due to connection error');
          if (connection) {
            await destroyConnection(connection);
          }
          // Connection is already removed from pool in executeQuery
        } catch (destroyError) {
          console.error('Error destroying Snowflake connection:', destroyError);
        }
      }
      
      return {
        error: 'Failed to execute query',
        details: error.message || 'Unknown error',
      };
    } finally {
      // Only remove connections from the pool if they're invalid
      // Valid connections should remain in the pool for reuse
      if (connection && !await isConnectionValid(connection)) {
        try {
          console.log('Cleaning up invalid connection from pool');
          const connectionKey = Object.keys(connectionPool).find(
            key => connectionPool[key] === connection
          );
          
          if (connectionKey) {
            await destroyConnection(connection);
            delete connectionPool[connectionKey];
            delete connectionUsage[connectionKey];
          }
        } catch (err) {
          console.error('Error cleaning up invalid connection:', err);
        }
      }
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
  'ALWAYS filter for program_id = 1614 in ALL queries',
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
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transactions.transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -4, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transactions.transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
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
    question: "What's our total revenue by location?",
    sql: `SELECT location, SUM(value - total_deferred_items) AS total_revenue
          FROM hang_loyalty_public.transactions
          WHERE program_id = 1614
            AND _FIVETRAN_DELETED = false
          GROUP BY location
          ORDER BY total_revenue DESC`
  },
  {
    question: "How many total transactions do we have?",
    sql: `SELECT COUNT(*) AS total_transactions
          FROM hang_loyalty_public.transactions
          WHERE program_id = 1614
            AND _FIVETRAN_DELETED = false`
  },
  {
    question: "What were my daily sales totals in December 2024?",
    sql: `SELECT CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp)::date AS transaction_date,
                  SUM(value - total_deferred_items) AS total_sales
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false
          GROUP BY transaction_date
          ORDER BY transaction_date`
  },
  {
    question: "What were my total discounts for Nashville - Midtown in November 2024?",
    sql: `SELECT SUM(total_discount) AS total_discount_amount
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -4, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND location = 'Nashville - Midtown'
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false`
  },
  {
    question: "What were my total Doordash sales for December 2024 at Atlanta - West?",
    sql: `SELECT SUM(value - total_deferred_items) AS doordash_sales
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND location = 'Atlanta - West'
            AND detailed_source ILIKE '%doordash%'
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false`
  },
  {
    question: "What was my AOV on Doordash in December 2024?",
    sql: `SELECT AVG(value - total_deferred_items) AS avg_order_value
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND detailed_source ILIKE '%doordash%'
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false`
  },
  {
    question: "How many orders did the average customer make in December 2024?",
    sql: `SELECT COUNT(DISTINCT t.id) / NULLIF(COUNT(DISTINCT ct.customer_id), 0) AS avg_orders_per_customer
          FROM hang_loyalty_public.transactions t
          JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
            AND ct._FIVETRAN_DELETED = false`
  },
  {
    question: "What was my AOV for December 2024?",
    sql: `SELECT AVG(value - total_deferred_items) AS average_order_value
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false`
  },
  {
    question: "Can you show me the number of daily orders in December 2024?",
    sql: `SELECT CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp)::date AS transaction_date,
                  COUNT(DISTINCT id) AS num_orders
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false
          GROUP BY transaction_date
          ORDER BY transaction_date`
  },
  {
    question: "What was the item count per order each day in December 2024?",
    sql: `SELECT CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)::date AS transaction_date,
                  SUM(tli.quantity) / COUNT(DISTINCT t.id) AS avg_items_per_order
          FROM hang_loyalty_public.transactions t
          LEFT JOIN hang_loyalty_public.transaction_line_items tli ON tli.transaction_id = t.id
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
          GROUP BY transaction_date
          ORDER BY transaction_date`
  },
  {
    question: "What were my total sales for Fried Jumbo Tenders Plate in January 2025?",
    sql: `WITH filtered_line_items AS (
            SELECT transaction_id, value AS line_item_total
            FROM hang_loyalty_public.transaction_line_items
            WHERE display_name = 'Fried Jumbo Tenders Plate'
              AND _FIVETRAN_DELETED = false
          )
          SELECT SUM(fli.line_item_total) AS total_sales
          FROM filtered_line_items fli
          JOIN hang_loyalty_public.transactions t ON t.id = fli.transaction_id
          WHERE DATE_TRUNC('month', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) = DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false`
  },
  {
    question: "What were my weekly sales by channel for 2024?",
    sql: `SELECT DATE_TRUNC('week', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) AS week,
                  t.detailed_source AS channel,
                  SUM(t.value - t.total_deferred_items) AS total_sales
          FROM hang_loyalty_public.transactions t
          JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= DATE_TRUNC('year', DATEADD(YEAR, -1, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) < DATE_TRUNC('year', CURRENT_DATE)
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
            AND ct._FIVETRAN_DELETED = false
          GROUP BY week, channel
          ORDER BY week, channel`
  },
  {
    question: "What were my weekly discounts by location for 2024?",
    sql: `SELECT DATE_TRUNC('week', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp)) AS week,
                  location,
                  SUM(total_discount) AS total_discounts
          FROM hang_loyalty_public.transactions
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) >= DATE_TRUNC('year', DATEADD(YEAR, -1, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', transaction_timestamp) < DATE_TRUNC('year', CURRENT_DATE)
            AND program_id = 1614
            AND _FIVETRAN_DELETED = false
          GROUP BY week, location
          ORDER BY week, location`
  },
  {
    question: "What were my daily Fried Jumbo Tenders Plate sales by location in January 2025?",
    sql: `WITH filtered_line_items AS (
            SELECT transaction_id, value AS line_item_total
            FROM hang_loyalty_public.transaction_line_items
            WHERE display_name = 'Fried Jumbo Tenders Plate'
              AND _FIVETRAN_DELETED = false
          )
          SELECT DATE_TRUNC('day', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) AS transaction_date,
                  t.location,
                  SUM(fli.line_item_total) AS total_sales
          FROM filtered_line_items fli
          JOIN hang_loyalty_public.transactions t ON t.id = fli.transaction_id
          WHERE DATE_TRUNC('month', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) = DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
          GROUP BY transaction_date, t.location
          ORDER BY transaction_date, t.location`
  },
  {
    question: "Show me overall sales performance by channel in 2024",
    sql: `SELECT t.detailed_source AS channel,
                  SUM(t.value - t.total_deferred_items) AS total_sales,
                  COUNT(DISTINCT t.id) / NULLIF(COUNT(DISTINCT ct.customer_id), 0) AS purchases_per_customer,
                  SUM(t.total_discount) AS total_discount
          FROM hang_loyalty_public.transactions t
          JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
          WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= DATE_TRUNC('year', DATEADD(YEAR, -1, CURRENT_DATE))
            AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) < DATE_TRUNC('year', CURRENT_DATE)
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
            AND ct._FIVETRAN_DELETED = false
          GROUP BY t.detailed_source
          ORDER BY t.detailed_source`
  },
  {
    question: "What was the 7-day return rate for customers each day in December 2024?",
    sql: `WITH primary_transactions AS (
            SELECT CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)::DATE AS transaction_date,
                    ct.customer_id
            FROM hang_loyalty_public.transactions t
            JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
            WHERE t._FIVETRAN_DELETED = false AND ct._FIVETRAN_DELETED = false
              AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
              AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
              AND t.program_id = 1614
          ),
          daily_customers AS (
            SELECT transaction_date AS day, customer_id
            FROM primary_transactions
            GROUP BY transaction_date, customer_id
          ),
          customer_returns AS (
            SELECT dc.day, dc.customer_id,
                    CASE WHEN EXISTS (
                      SELECT 1 FROM hang_loyalty_public.transactions t
                      JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
                      WHERE ct.customer_id = dc.customer_id
                        AND t._FIVETRAN_DELETED = false AND ct._FIVETRAN_DELETED = false
                        AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)::DATE > dc.day
                        AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)::DATE <= dc.day + INTERVAL '7 day'
                        AND t.program_id = 1614
                    ) THEN 1 ELSE 0 END AS returned_within_7d
            FROM daily_customers dc
          )
          SELECT day, AVG(returned_within_7d::FLOAT) AS return_rate_7d
          FROM customer_returns
          GROUP BY day
          ORDER BY day`
  },
  {
    question: "What were my daily sales by channel for Plates in January 2025?",
    sql: `WITH filtered_line_items AS (
            SELECT transaction_id, value AS line_item_total
            FROM hang_loyalty_public.transaction_line_items
            WHERE group_display_name = 'Plates'
              AND _FIVETRAN_DELETED = false
          )
          SELECT DATE_TRUNC('day', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) AS transaction_date,
                  t.detailed_source AS channel,
                  SUM(fli.line_item_total) AS total_sales
          FROM filtered_line_items fli
          JOIN hang_loyalty_public.transactions t ON t.id = fli.transaction_id
          WHERE DATE_TRUNC('month', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) = DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
          GROUP BY transaction_date, channel
          ORDER BY transaction_date, channel`
  },
  {
    question: "Show me daily sales of the Fried Jumbo Tenders Plate compared to the Fried 3 Tenders Plate in January 2025",
    sql: `WITH filtered_line_items AS (
            SELECT transaction_id, value AS line_item_total, display_name
            FROM hang_loyalty_public.transaction_line_items
            WHERE display_name IN ('Fried Jumbo Tenders Plate', 'Fried 3 Tenders Plate')
              AND _FIVETRAN_DELETED = false
          )
          SELECT DATE_TRUNC('day', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) AS day,
                  MAX(CASE WHEN fli.display_name = 'Fried Jumbo Tenders Plate' THEN fli.line_item_total END) AS jumbo_plate_sales,
                  MAX(CASE WHEN fli.display_name = 'Fried 3 Tenders Plate' THEN fli.line_item_total END) AS regular_plate_sales
          FROM filtered_line_items fli
          JOIN hang_loyalty_public.transactions t ON t.id = fli.transaction_id
          WHERE DATE_TRUNC('month', CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) = DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
            AND t.program_id = 1614
            AND t._FIVETRAN_DELETED = false
          GROUP BY day
          ORDER BY day`
  },
  {
    question: "Which items did people most often buy with the Fried Jumbo Tenders Plate in December 2024?",
    sql: `WITH initial_purchases AS (
            SELECT ct.customer_id, t.id AS transaction_id, t.transaction_timestamp, tli.display_name AS initial_line_item
            FROM hang_loyalty_public.transactions t
            JOIN hang_loyalty_public.transaction_line_items tli ON tli.transaction_id = t.id
            JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
            WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE))
              AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
              AND tli.display_name = 'Fried Jumbo Tenders Plate'
              AND t.program_id = 1614
              AND t._FIVETRAN_DELETED = false AND tli._FIVETRAN_DELETED = false AND ct._FIVETRAN_DELETED = false
          ),
          accomp_line_items AS (
            SELECT ip.customer_id, ip.initial_line_item, tli.display_name AS accompanying_item
            FROM initial_purchases ip
            JOIN hang_loyalty_public.transaction_line_items tli ON tli.transaction_id = ip.transaction_id
            WHERE tli.display_name <> ip.initial_line_item AND tli._FIVETRAN_DELETED = false
          )
          SELECT initial_line_item AS "Item", accompanying_item AS "Accompanying Item",
                  COUNT(DISTINCT customer_id) AS "Instances"
          FROM accomp_line_items
          GROUP BY initial_line_item, accompanying_item
          HAVING COUNT(DISTINCT customer_id) > 10
          ORDER BY "Instances" DESC`
  },
  {
    question: "Show me the repeat purchase behavior for Plates compared to Extras in December 2024",
    sql: `WITH base_minutes AS (
            SELECT MIN(minute_ts) AS min_ts, MAX(minute_ts) AS max_ts
            FROM precomputes.all_minutes
            WHERE minute_ts >= DATE_TRUNC('month', DATEADD(MONTH, -3, CURRENT_DATE)) 
              AND minute_ts < DATE_TRUNC('month', DATEADD(MONTH, -2, CURRENT_DATE))
          ),
          base_first_purchases AS (
            SELECT ct.customer_id, tli.group_display_name AS category,
                    MIN(CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp)) AS first_purchase_date
            FROM hang_loyalty_public.transactions t
            JOIN hang_loyalty_public.transaction_line_items tli ON tli.transaction_id = t.id
            JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
            WHERE CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) >= (SELECT min_ts FROM base_minutes)
              AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) <= (SELECT max_ts FROM base_minutes)
              AND tli.group_display_name IN ('Plates', 'Extras')
              AND t.program_id = 1614
              AND t._FIVETRAN_DELETED = false AND tli._FIVETRAN_DELETED = false AND ct._FIVETRAN_DELETED = false
            GROUP BY ct.customer_id, tli.group_display_name
          ),
          repeat_purchases AS (
            SELECT fp.customer_id, fp.category,
                    CASE WHEN EXISTS (
                      SELECT 1 FROM hang_loyalty_public.transactions t
                      JOIN hang_loyalty_public.customer_transactions ct ON ct.transaction_id = t.id
                      JOIN hang_loyalty_public.transaction_line_items tli ON tli.transaction_id = t.id
                      WHERE ct.customer_id = fp.customer_id
                        AND t._FIVETRAN_DELETED = false AND ct._FIVETRAN_DELETED = false AND tli._FIVETRAN_DELETED = false
                        AND CONVERT_TIMEZONE('UTC', 'America/Los_Angeles', t.transaction_timestamp) > fp.first_purchase_date
                        AND tli.group_display_name = fp.category
                        AND t.program_id = 1614
                    ) THEN 1 ELSE 0 END AS has_repeat
            FROM base_first_purchases fp
          )
          SELECT fp.category AS "Category", COUNT(DISTINCT fp.customer_id) AS total_customers,
                  SUM(COALESCE(rp.has_repeat, 0)) AS repeat_customers,
                  (SUM(COALESCE(rp.has_repeat, 0)) / NULLIF(COUNT(DISTINCT fp.customer_id), 0))::FLOAT AS repeat_purchase_rate
          FROM base_first_purchases fp
          LEFT JOIN repeat_purchases rp ON fp.customer_id = rp.customer_id AND fp.category = rp.category
          GROUP BY fp.category`
  }
];

// Additional rules (kept as an array for clarity)
const ADDITIONAL_RULES = [
  'When using relative time in a question (e.g., "today"), stick to relative terms rather than absolute dates. These queries are saved and reused later, so they should consistently refer to the same relative time period.',
  'For all time based queries that exceed the current time (e.g. "this year"), only use values on or before the current date',
  'When the query needs to filter strings, always use ILIKE %..% unless exact match explicitly requested',
  'Use \\ as escape character; use \\\\ for literal \\',
  'Use average functions for averages, excluding nulls; avoid SUM()/COUNT()',
  'Subqueries without IN must return one row using MIN/MAX/ANY_VALUE',
  'SAMPLE(10) means 10%; use ROWS for specific row counts',
  'Always sort dates ascending',
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
    
    // Get current date information for context
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
    
    // Add date context to the question
    const questionWithContext = `Today is ${dayOfWeek}, ${monthName} ${currentDay}, ${currentYear} (day: ${currentDay}, month: ${currentMonth}, year: ${currentYear}). Please consider this date context when generating SQL. User question: ${question}`;
    
    // Use OpenAI API directly
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: questionWithContext }
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
 * Validates a SQL query for security, supporting SELECT queries including those with CTEs
 * @param sqlQuery The SQL query string to validate
 * @returns boolean True if the query is safe and valid, false otherwise
 */
function validateQuery(sqlQuery: string): boolean {
  // Remove leading/trailing whitespace and convert to lowercase for case-insensitive checks
  const normalizedQuery = sqlQuery.trim().toLowerCase();
  
  // Check for destructive or administrative commands
  const disallowedCommands = [
    'drop table', 'drop database', 'truncate table', 'delete from',
    'alter table', 'create table', 'grant ', 'revoke ', 
    'insert into', 'update ', 'merge into', 'create user'
  ];
  
  for (const command of disallowedCommands) {
    if (normalizedQuery.includes(command)) {
      console.error(`Query validation failed: contains disallowed command '${command}'`);
      return false;
    }
  }
  
  // Check if the query is a valid SELECT statement (direct or CTE-based)
  if (normalizedQuery.startsWith('select')) {
    // Direct SELECT query, no further checks needed for structure
    return true;
  } else if (normalizedQuery.startsWith('with')) {
    // Handle CTEs: ensure at least one SELECT follows the WITH clause(s)
    // Split into tokens to find the main query after CTE definitions
    const parts = normalizedQuery.split(/\bwith\b|\bselect\b/);
    let foundSelect = false;
    
    for (let i = 1; i < parts.length; i++) { // Start at 1 to skip initial empty part or CTE name
      const part = parts[i].trim();
      if (part.length > 0 && !part.startsWith('as (') && !part.startsWith(',')) {
        // This should be the main query after CTEs
        foundSelect = true;
        break;
      }
    }
    
    if (!foundSelect) {
      console.error('Query validation failed: CTE query lacks a valid SELECT statement');
      return false;
    }
    
    // Additional check: ensure no disallowed commands appear after CTEs
    const postCteSection = normalizedQuery.substring(normalizedQuery.indexOf('select'));
    for (const command of disallowedCommands) {
      if (postCteSection.includes(command)) {
        console.error(`Query validation failed: contains disallowed command '${command}' after CTE`);
        return false;
      }
    }
    
    return true;
  } else {
    console.error('Query validation failed: must start with SELECT or WITH for CTEs');
    return false;
  }
}

/**
 * Executes a SQL query against Snowflake with a timeout
 */
async function executeQuery(connection: SnowflakeConnection, sqlQuery: string): Promise<SnowflakeRow[]> {
  console.log(`[SQL QUERY]: ${sqlQuery}`);  // Log all SQL queries
  
  return new Promise((resolve, reject) => {
    // Check connection status first
    if (!connection.isUp()) {
      console.error('Connection is not active, cannot execute query');
      reject(new Error('Connection is not active or has been terminated'));
      return;
    }
    
    // Create a timeout (120 seconds = 2 minutes)
    const timeout = 120000;
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      timeoutId = null;
      console.error(`[SQL TIMEOUT]: Query execution timed out after ${timeout / 1000} seconds`);
      console.error(`[SQL TIMEOUT QUERY]: ${sqlQuery}`);
      reject(new Error(`Query execution timed out after ${timeout / 1000} seconds`));
    }, timeout);
    
    // Create options object with proper typing
    const options: snowflake.StatementOption = {
      sqlText: sqlQuery,
      complete: (err: any, stmt: any, rows: any) => {
        // Clear the timeout if it's still active
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Get query ID for better logging if available
        const queryId = stmt?.getStatementId ? stmt.getStatementId() : 'unknown';
        
        if (err) {
          // If error indicates connection issue, mark the connection for replacement
          if (err.code === 407002 || 
              (err.message && (
                err.message.includes('terminated connection') || 
                err.message.includes('Unable to perform operation')
              ))
            ) {
            console.error(`[SQL CONNECTION ERROR] Query ${queryId}: Connection error detected`);
            try {
              // Remove from pool so a new connection is created next time
              const connectionKey = Object.keys(connectionPool).find(
                key => connectionPool[key] === connection
              );
              if (connectionKey) {
                console.log(`Removing failed connection from pool: ${connectionKey}`);
                delete connectionPool[connectionKey];
                delete connectionUsage[connectionKey];
              }
            } catch (poolErr) {
              console.error('Error cleaning up connection pool:', poolErr);
            }
          }
          
          console.error(`[SQL ERROR] Query ${queryId}:`, err);
          console.error(`[SQL ERROR QUERY]: ${sqlQuery}`);
          reject(err);
        } else {
          console.log(`[SQL SUCCESS] Query ${queryId}: returned ${rows?.length || 0} rows`);
          resolve(rows || []);
        }
      }
    };
    
    // Execute the query
    connection.execute(options);
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
    formattedData = results.slice(0, 10);
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
    
    // Normalize visualization type - convert bar-chart and others to just 'chart'
    let normalizedVisualizationType = visualizationType || 'table';
    if (normalizedVisualizationType === 'bar-chart' || normalizedVisualizationType === 'line-chart') {
      normalizedVisualizationType = 'chart';
    }
    
    // Insert directly into Supabase with the user's ID explicitly set
    const { data, error } = await supabase
      .from('ChatGeneratedMetrics')
      .insert({
        userid: session.user.id, // Explicitly set the user ID from the session
        title,
        description: question,
        question,
        sqlquery: sqlQuery,
        visualizationtype: normalizedVisualizationType,
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

// Check if a connection is valid with a test query
async function isConnectionValid(connection: SnowflakeConnection): Promise<boolean> {
  try {
    if (!connection.isUp()) {
      return false;
    }
    
    // Perform a lightweight test query to validate the connection
    return new Promise((resolve) => {
      connection.execute({
        sqlText: 'SELECT 1 AS test',
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Connection validation query failed:', err);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      });
    });
  } catch (error) {
    console.error('Error checking connection validity:', error);
    return false;
  }
}

// Add a connection to the pool with LRU management
function addToPool(key: string, connection: SnowflakeConnection): void {
  // If pool is at capacity, evict least recently used connection
  if (Object.keys(connectionPool).length >= MAX_POOL_SIZE) {
    const lruKey = Object.keys(connectionUsage).reduce((a, b) => 
      connectionUsage[a] < connectionUsage[b] ? a : b
    );
    
    console.log(`Pool at capacity, evicting least recently used connection: ${lruKey}`);
    destroyConnection(connectionPool[lruKey]);
    delete connectionPool[lruKey];
    delete connectionUsage[lruKey];
  }
  
  // Add new connection to pool
  connectionPool[key] = connection;
  connectionUsage[key] = Date.now();
  console.log(`Added connection to pool: ${key}`);
}

// Update usage timestamp for a connection
function updateConnectionUsage(key: string): void {
  connectionUsage[key] = Date.now();
}

// Connect to Snowflake with retry logic
async function connectWithRetry(connection: SnowflakeConnection, retryCount = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    
    // Increased timeout from 30 seconds to 2 minutes
    const timeout = 120000;
    connection.connect((err) => {
      if (err) {
        console.error(`Connection attempt ${retryCount + 1} failed:`, err);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying connection, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`);
          setTimeout(() => {
            connectWithRetry(connection, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          console.error('Maximum connection retry attempts reached');
          reject(err);
        }
      } else {
        console.log('Successfully connected to Snowflake');
        resolve();
      }
    });
  });
}

// Helper to safely destroy a connection
async function destroyConnection(connection: SnowflakeConnection): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (connection && typeof connection.destroy === 'function') {
        connection.destroy((err) => {
          if (err) {
            console.error('Error destroying Snowflake connection:', err);
          } else {
            console.log('Successfully destroyed Snowflake connection');
          }
          resolve();
        });
      } else {
        resolve();
      }
    } catch (error) {
      console.error('Error destroying Snowflake connection:', error);
      resolve();
    }
  });
}

// Clean up idle connections
async function cleanupIdleConnections(): Promise<void> {
  const now = Date.now();
  const idleConnections: string[] = [];

  for (const connectionKey in connectionPool) {
    if (connectionUsage[connectionKey] && now - connectionUsage[connectionKey] > CONNECTION_IDLE_TIMEOUT) {
      idleConnections.push(connectionKey);
    }
  }

  for (const connectionKey of idleConnections) {
    try {
      await destroyConnection(connectionPool[connectionKey]);
      delete connectionPool[connectionKey];
      delete connectionUsage[connectionKey];
      console.log(`Cleaned up idle connection: ${connectionKey}`);
    } catch (error) {
      console.error(`Error cleaning up idle connection ${connectionKey}:`, error);
    }
  }
}