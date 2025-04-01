import { tool } from 'ai';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getProgramIdForUser } from '@/lib/auth/program-mapping';
import { executeQuery } from './direct-query';

// QSR data schema
const QSR_SCHEMA = `
HANG_LOYALTY_PUBLIC.transactions:
- ID (TEXT): Unique identifier for each transaction
- EXTERNAL_ID (TEXT): External identifier for the transaction
- EXTERNAL_ORDER_ID (TEXT): External order identifier
- EXTERNAL_LOCATION_ID (TEXT): External location identifier
- PROVIDER (NUMBER): Provider identifier
- TRANSACTION_TYPE (NUMBER): Type of transaction
- TOTAL_DISCOUNT (FLOAT): Total discount amount
- SOURCE (TEXT): Source of the transaction
- VALUE (FLOAT): Value of the transaction
- PROGRAM_ID (NUMBER): Identifier for the restaurant brand/program
- TRANSACTION_TIMESTAMP (TIMESTAMP_NTZ): When the transaction occurred
- CREATED_AT (TIMESTAMP_NTZ): When the record was created
- UPDATED_AT (TIMESTAMP_NTZ): When the record was last updated
- LOCATION (TEXT): Location information

HANG_LOYALTY_PUBLIC.transaction_line_items:
- ID (TEXT): Unique identifier for each line item
- TRANSACTION_ID (TEXT): References the main transaction
- PRODUCT_ID (TEXT): Identifier for the product/menu item purchased
- QUANTITY (NUMBER): Number of items purchased
- UNIT_PRICE (FLOAT): Price per item
- TOTAL_PRICE (FLOAT): Total price for this line item
- PROGRAM_ID (NUMBER): Identifier for the restaurant brand/program

HANG_LOYALTY_PUBLIC.customer_transactions:
- CUSTOMER_ID (TEXT): Identifier for the customer
- TRANSACTION_ID (TEXT): References the main transaction
- TRANSACTION_DATE (TIMESTAMP_NTZ): Date of transaction
- AMOUNT (FLOAT): Transaction amount
- PROGRAM_ID (NUMBER): Identifier for the restaurant brand/program
`;

// Create a cache for table schemas to avoid repetitive queries
const tableSchemaCache: Record<string, { 
  timestamp: number;
  columns: ColumnSchema[];
}> = {};

// Define enhanced column type that includes metadata for additional properties
type ColumnSchema = {
  name: string;
  type: string;
  originalCase?: string; // Optional to maintain backward compatibility
  metadata?: {
    originalCase?: string;
    [key: string]: any;
  };
};

// Simplified function to get table schema based on the static schema definition
async function getTableSchema(tableName: string): Promise<{
  success: boolean;
  columns: ColumnSchema[];
  error?: string;
}> {
  // Parse the static schema to extract column information
  const schemaLines = QSR_SCHEMA.split('\n');
  const tableSection = tableName + ':';
  let inTargetTable = false;
  const columns: { name: string; type: string }[] = [];

  for (const line of schemaLines) {
    if (line.trim() === tableSection) {
      inTargetTable = true;
      continue;
    }
    
    if (inTargetTable && line.trim() === '') {
      inTargetTable = false;
      break;
    }
    
    if (inTargetTable && line.startsWith('-')) {
      // Parse column definition like "- column_name (TYPE): Description"
      const match = line.match(/- ([a-z_]+) \(([A-Z]+)\)/);
      if (match) {
        // Keep the original input value and store it as the name property
        // But also track uppercase version for compatibility with existing code
        const originalCase = match[1];
        const name = originalCase;
        
        // Define the column with the appropriate fields
        // Only include name and type properties to match the expected type
        columns.push({
          name, // Use original case for name
          type: match[2]
          // Note: We've removed the metadata property that was causing TypeScript errors
          // If we need to track additional metadata, we should update the type definition
        });
        
        // You could keep track of original case in a separate array if needed
        // const columnMetadata = { name, originalCase };
      }
    }
  }
  
  if (columns.length > 0) {
    return {
      success: true,
      columns
    };
  } else {
    return {
      success: false,
      columns: [],
      error: `No schema found for table ${tableName}`
    };
  }
}

// Function to get the schema of a table, using cache when possible
async function getCachedTableSchema(tableName: string): Promise<ColumnSchema[]> {
  // Check if we have this schema cached and it's recent (less than 5 minutes old)
  const now = Date.now();
  const cacheEntry = tableSchemaCache[tableName];
  
  if (cacheEntry && (now - cacheEntry.timestamp) < 5 * 60 * 1000) {
    console.log(`Using cached schema for ${tableName}, age: ${Math.round((now - cacheEntry.timestamp)/1000)}s`);
    return cacheEntry.columns;
  }
  
  // Otherwise, get fresh schema
  try {
    console.log(`Getting fresh schema for ${tableName}`);
    const { success, columns, error } = await getTableSchema(tableName);
    
    if (!success || !columns || columns.length === 0) {
      console.error(`Failed to get schema for ${tableName}: ${error}`);
      return [];
    }
    
    // Cache the result
    tableSchemaCache[tableName] = {
      timestamp: now,
      columns
    };
    
    return columns;
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error);
    return [];
  }
}

// Function to adapt a query based on actual table schema
async function adaptQueryToSchema(query: string): Promise<string> {
  // Extract table name from query
  const tableMatch = query.match(/FROM\s+([A-Za-z0-9_.]+)/i);
  if (!tableMatch || !tableMatch[1]) {
    console.warn('Could not extract table name from query:', query);
    return query;
  }
  
  const tableName = tableMatch[1];
  console.log(`Adapting query for table: ${tableName}`);
  
  // Get the schema
  const columns = await getCachedTableSchema(tableName);
  if (!columns || columns.length === 0) {
    console.warn(`No schema columns found for ${tableName}, using query as-is`);
    return query;
  }
  
  // Get column names with their exact case from schema
  const columnNames = columns.map(col => col.name);
  // Also create a case-insensitive lookup map for checks
  const columnNamesUpper = columns.map(col => col.name.toUpperCase());
  console.log(`Available columns for ${tableName}:`, columnNames.join(', '));
  
  // Find date columns
  const dateColumns = columns
    .filter(col => col.type.includes('DATE') || col.type.includes('TIMESTAMP'))
    .map(col => col.name);
  const dateColumnsUpper = dateColumns.map(col => col.toUpperCase());
  console.log(`Date columns for ${tableName}:`, dateColumns.join(', '));
  
  // Create working copy of query
  let adaptedQuery = query;
  
  // Common column mappings for QSR data
  const columnMappings: Record<string, string> = {
    'PRODUCT': 'PRODUCT_ID',
    'AMOUNT': 'TOTAL_PRICE',
    'SALES': 'TOTAL_PRICE',
    'REVENUE': 'TOTAL_PRICE',
    'DATE': 'TRANSACTION_DATE',
    'STORE': 'STORE_ID',
    'CUSTOMER': 'CUSTOMER_ID',
    'PRICE': 'UNIT_PRICE'
  };
  
  // Replace column names with their correct mappings 
  for (const [incorrectName, correctName] of Object.entries(columnMappings)) {
    // Find the actual column in the schema with correct case
    const actualColumn = columns.find(col => 
      col.name.toUpperCase() === correctName.toUpperCase() || 
      ((col as any).metadata?.originalCase?.toUpperCase() === correctName.toUpperCase())
    );
    
    if (actualColumn) {
      const regex = new RegExp(`\\b${incorrectName}\\b`, 'gi');
      // Use the exact name from the schema with proper quoting
      const exactColumnName = (actualColumn as any).metadata?.originalCase || actualColumn.name;
      adaptedQuery = adaptedQuery.replace(regex, `"${exactColumnName}"`);
      console.log(`Replaced ${incorrectName} with properly quoted "${exactColumnName}"`);
    }
  }
  
  // Replace DATE column if it doesn't exist, but other date columns do
  if (dateColumns.length > 0) {
    const preferredDateColumn = 'TRANSACTION_DATE';
    if (dateColumns.includes(preferredDateColumn)) {
      adaptedQuery = adaptedQuery.replace(/\bDATE\b/gi, `"${preferredDateColumn}"`);
    } else if (dateColumns.length > 0) {
      // Use the first available date column if preferred one isn't found
      adaptedQuery = adaptedQuery.replace(/\bDATE\b/gi, `"${dateColumns[0]}"`);
    }
  }
  
  // Log if query was modified
  if (adaptedQuery !== query) {
    console.log('Adapted query based on schema:', adaptedQuery);
  }
  
  return adaptedQuery;
}

// Convert a natural language question to a SQL query specific to QSR data
function generateQsrSqlQuery(question: string): string {
  // Normalize question to lowercase for matching
  const q = question.toLowerCase();
  
  // Most common query patterns for QSR data
  if (q.includes('recent') && q.includes('transaction')) {
    return `SELECT * FROM HANG_LOYALTY_PUBLIC.transactions ORDER BY "TRANSACTION_TIMESTAMP" DESC LIMIT 10`;
  }
  
  if (q.includes('total') && (q.includes('sales') || q.includes('revenue'))) {
    return `SELECT SUM("TOTAL_PRICE") AS "total_revenue" FROM HANG_LOYALTY_PUBLIC.transaction_line_items`;
  }
  
  if (q.includes('daily') && (q.includes('sales') || q.includes('revenue'))) {
    return `SELECT "TRANSACTION_DATE", SUM("TOTAL_PRICE") as daily_revenue FROM HANG_LOYALTY_PUBLIC.transaction_line_items GROUP BY "TRANSACTION_DATE" ORDER BY "TRANSACTION_DATE" DESC LIMIT 30`;
  }
  
  if (q.includes('monthly') && (q.includes('sales') || q.includes('revenue'))) {
    return `SELECT DATE_TRUNC('month', "TRANSACTION_DATE") as month, SUM("TOTAL_PRICE") as monthly_revenue FROM HANG_LOYALTY_PUBLIC.transaction_line_items GROUP BY month ORDER BY month DESC LIMIT 12`;
  }
  
  if (q.includes('average') && q.includes('transaction')) {
    return `SELECT AVG("TOTAL_PRICE") as average_transaction_value FROM HANG_LOYALTY_PUBLIC.transaction_line_items`;
  }
  
  if (q.includes('popular') && (q.includes('item') || q.includes('product'))) {
    return `SELECT "PRODUCT_ID", SUM("QUANTITY") as total_quantity, SUM("TOTAL_PRICE") as total_revenue FROM HANG_LOYALTY_PUBLIC.transaction_line_items GROUP BY "PRODUCT_ID" ORDER BY total_quantity DESC LIMIT 10`;
  }
  
  if (q.includes('store') && (q.includes('performance') || q.includes('sales'))) {
    return `SELECT "STORE_ID", SUM("TOTAL_AMOUNT") as total_revenue FROM HANG_LOYALTY_PUBLIC.transactions GROUP BY "STORE_ID" ORDER BY total_revenue DESC`;
  }
  
  if (q.includes('customer')) {
    return `SELECT "CUSTOMER_ID", COUNT(*) as visit_count, SUM("AMOUNT") as total_spent FROM HANG_LOYALTY_PUBLIC.customer_transactions GROUP BY "CUSTOMER_ID" ORDER BY total_spent DESC LIMIT 20`;
  }
  
  // Check for specific date range queries
  if (q.includes('2025') || q.includes('next year')) {
    return `SELECT "TRANSACTION_DATE", SUM("TOTAL_AMOUNT") as revenue FROM HANG_LOYALTY_PUBLIC.transactions WHERE "TRANSACTION_DATE" >= '2025-01-01' GROUP BY "TRANSACTION_DATE" ORDER BY "TRANSACTION_DATE"`;
  }
  
  if (q.includes('2024') || q.includes('this year')) {
    return `SELECT "TRANSACTION_DATE", SUM("TOTAL_AMOUNT") as revenue FROM HANG_LOYALTY_PUBLIC.transactions WHERE "TRANSACTION_DATE" >= '2024-01-01' AND "TRANSACTION_DATE" < '2025-01-01' GROUP BY "TRANSACTION_DATE" ORDER BY "TRANSACTION_DATE"`;
  }
  
  if (q.includes('2023') || q.includes('last year')) {
    return `SELECT "TRANSACTION_DATE", SUM("TOTAL_AMOUNT") as revenue FROM HANG_LOYALTY_PUBLIC.transactions WHERE "TRANSACTION_DATE" >= '2023-01-01' AND "TRANSACTION_DATE" < '2024-01-01' GROUP BY "TRANSACTION_DATE" ORDER BY "TRANSACTION_DATE"`;
  }
  
  if (q.includes('program') && q.includes('id')) {
    return `SELECT DISTINCT program_id FROM HANG_LOYALTY_PUBLIC.transactions`;
  }
  
  // Default query if nothing else matches
  return `SELECT * FROM HANG_LOYALTY_PUBLIC.transactions ORDER BY "TRANSACTION_DATE" DESC LIMIT 5`;
}

// Format QSR data results for display
function formatQsrDataForDisplay(data: any[]) {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(row => {
    const formattedRow: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Format markdown text
      if (typeof value === 'string' && value.includes('**')) {
        // Ensure proper spacing around bold markers and normalize line breaks
        formattedRow[key] = value
          .replace(/\*\*(.*?)\*\*/g, '**$1**\n') // Add newline after bold text
          .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to max two
          .trim();
      }
      // Format currency values
      else if ((key.toLowerCase().includes('revenue') || 
           key.toLowerCase().includes('amount') ||
           key.toLowerCase().includes('price') ||
           key.toLowerCase().includes('total') ||
           key.toLowerCase().includes('spent') ||
           key.toLowerCase().includes('sales')) && 
          typeof value === 'number') {
        formattedRow[key] = `$${value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      } 
      // Format dates
      else if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('month')) && 
               value instanceof Date) {
        formattedRow[key] = value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      // Format counts
      else if (key.toLowerCase().includes('count') && typeof value === 'number') {
        formattedRow[key] = value.toLocaleString();
      }
      // Keep other values as is
      else {
        formattedRow[key] = value;
      }
    }
    
    return formattedRow;
  });
}

// QSR Query tool - query data from QSR point-of-sale systems with natural language
export const qsrQueryTool = tool({
  description: `Query QSR (Quick Service Restaurant) data using natural language. This tool allows you to ask questions about:
  - Transaction data from multiple restaurants
  - Sales performance and revenue across restaurant brands
  - Menu item popularity across different locations
  - Customer purchasing patterns
  - Store performance comparisons
  
  The system will generate appropriate SQL based on your question and return real data from all restaurant point-of-sale systems without filtering by program ID.`,
  parameters: z.object({
    question: z.string().describe('Natural language question about QSR data (e.g., "What were our recent transactions?" or "What is our monthly revenue?")'),
    title: z.string().optional().describe('Title for the data result'),
    description: z.string().optional().describe('Description of what the data shows'),
  }),
  execute: async ({ question, title, description }, { toolCallId }) => {
    try {
      console.log(`Generating QSR query for question: "${question}"`);
      
      // Generate SQL query from the natural language question
      let sqlQuery = generateQsrSqlQuery(question);
      console.log(`Generated SQL query: ${sqlQuery}`);
      
      // Adapt the query to match the actual schema
      sqlQuery = await adaptQueryToSchema(sqlQuery);
      console.log(`Adapted SQL query: ${sqlQuery}`);
      
      // Execute the query against Snowflake (no program_id filtering anymore)
      const data = await executeQuery(sqlQuery);
      
      // Format and return the results
      return {
        data: formatQsrDataForDisplay(data),
        sql: sqlQuery,
        title: title || `QSR Data: ${question}`,
        description: description || `Results from QSR point-of-sale systems based on your question: "${question}"`,
      };
    } catch (error) {
      console.error('QSR query tool error:', error);
      throw error;
    }
  }
});