import { StreamData, tool } from 'ai';
import { z } from 'zod';
import snowflake from 'snowflake-sdk';
import { auth } from '@/app/(auth)/auth';
import { getProgramIdForUser } from '@/lib/auth/program-mapping';
import { streamText } from 'ai';
import { createAnthropicProvider, CLAUDE_OPUS_3_5_MODEL_NAME } from '@/lib/ai/providers';
// Or your preferred data warehouse client
// import { createClient } from '@snowflake-sdk/client';
// import { BigQuery } from '@google-cloud/bigquery';

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

// Use Claude Opus 3.5 to generate a valid SQL query
async function generateSqlQuery(userRequest: string): Promise<string> {
  try {
    // Get schema information for all tables first
    console.log('Getting schema information for all tables before generating SQL query');
    const tableSchemas = await Promise.all(
      AVAILABLE_TABLES.map(async (tableName) => {
        try {
          const schemaInfo = await getTableSchemaInfo(tableName);
          return {
            tableName,
            columns: schemaInfo.columns || []
          };
        } catch (error) {
          console.error(`Error getting schema for ${tableName}:`, error);
          return {
            tableName,
            columns: []
          };
        }
      })
    );

    // Format schema info for the LLM
    let schemaText = 'Available tables in Snowflake:\n\n';
    
    for (const tableSchema of tableSchemas) {
      if (tableSchema.columns.length === 0) continue;
      
      schemaText += `${tableSchema.tableName}:\n`;
      for (const column of tableSchema.columns) {
        schemaText += `- ${column.name} (${column.type})\n`;
      }
      schemaText += '\n';
    }
    
    console.log('Using detailed schema for SQL generation:', schemaText);

    const anthropicProvider = createAnthropicProvider(CLAUDE_OPUS_3_5_MODEL_NAME);
    
    if (!anthropicProvider) {
      console.error('Failed to create Anthropic provider for SQL generation');
      throw new Error('Could not initialize query generation service');
    }
    
    // Generate the SQL query using Claude Opus 3.5 with the actual schema
    const response = await streamText({
      model: anthropicProvider,
      system: `You are an expert SQL developer specializing in Snowflake SQL. Your job is to write precise, efficient SQL queries based on user requests.

${schemaText}

IMPORTANT RULES:
1. Only write SQL for Snowflake that queries the tables listed above.
2. Always use the exact case-sensitive column names as shown in the schema.
3. NEVER use tables or columns that aren't in the schema provided.
4. ALWAYS enclose ALL column names in double quotes and USE LOWERCASE inside quotes (e.g., "column_name" NOT column_name and NOT "COLUMN_NAME").
5. For table names and database names, preserve their case with quotes (e.g., "HANG_LOYALTY_PUBLIC"."transactions"."transaction_id").
6. When using aliases, also quote them and use lowercase (e.g., SELECT "column_name" AS "my_alias").
7. NEVER use generic column names like 'date' - only use the exact column names from the schema in lowercase with quotes.
8. Always write complete, executable SQL statements.
9. ONLY return the SQL query - no explanations or comments.
10. Ensure your query only uses the available columns listed for each table.
11. Limit results to 100 rows maximum unless specifically requested otherwise.
12. Don't include program_id filtering - this will be added automatically by the backend.
13. For aggregate functions or computed columns, properly quote the inputs (e.g., SUM("total_price")).
14. Be extremely careful about column names - NEVER invent column names that don't exist in the schema.
15. If you're not 100% sure about a column name, DO NOT use it - only use columns that are explicitly shown in the schema above.
16. Reminder: Check the schema above for EXACT column names before writing your query.`,
      prompt: `Write a Snowflake SQL query that answers this question: "${userRequest}"

Before you write the query, think about which tables and exact column names you need based on the schema. Be extremely careful to ONLY use column names that are explicitly listed in the schema.`,
      temperature: 0.1, // Lower temperature for more deterministic SQL generation
      maxTokens: 500,
    });
    
    // Extract and clean the SQL query
    const sqlText = await response.text;
    const sqlQuery = sqlText.trim().replace(/```sql/g, '').replace(/```/g, '').trim();
    
    console.log('Generated SQL query:', sqlQuery);

    // Perform a final validation to ensure no generic 'DATE' columns are used
    const validatedQuery = validateQueryColumnNames(sqlQuery, tableSchemas);
    console.log('Validated SQL query:', validatedQuery);
    
    return validatedQuery;
  } catch (error) {
    console.error('Error generating SQL query:', error);
    throw new Error('Failed to generate SQL query');
  }
}

// Function to validate and fix any remaining column name issues
function validateQueryColumnNames(query: string, tableSchemas: Array<{tableName: string, columns: Array<{name: string, type: string}>}>): string {
  let validatedQuery = query;
  
  // Check for any unquoted 'DATE' references
  if (validatedQuery.toLowerCase().includes(' date ') || 
      validatedQuery.toLowerCase().includes('(date)') || 
      validatedQuery.toLowerCase().includes('date,') || 
      validatedQuery.toLowerCase().includes('date=') || 
      validatedQuery.toLowerCase().includes('date>') || 
      validatedQuery.toLowerCase().includes('date<')) {
    
    console.log('Found potential incorrect DATE reference in query, attempting to fix');
    
    // Create a map of table names to date columns
    const dateColumnsByTable = tableSchemas.reduce((acc, tableSchema) => {
      // Find date columns in this table
      const dateColumns = tableSchema.columns
        .filter(col => col.type.includes('DATE') || col.type.includes('TIMESTAMP'))
        .map(col => col.name);
      
      if (dateColumns.length > 0) {
        acc[tableSchema.tableName] = dateColumns;
      }
      
      return acc;
    }, {} as Record<string, string[]>);
    
    console.log('Available date columns by table:', dateColumnsByTable);
    
    // Find which table is being queried
    for (const tableName of Object.keys(dateColumnsByTable)) {
      if (validatedQuery.includes(tableName)) {
        const dateColumns = dateColumnsByTable[tableName];
        if (dateColumns.length > 0) {
          // Use the first date column as replacement
          const primaryDateColumn = dateColumns[0];
          console.log(`Using "${primaryDateColumn}" from ${tableName} to replace unquoted DATE references`);
          
          // Replace any unquoted 'date' references (case-insensitive)
          validatedQuery = validatedQuery.replace(/\bdate\b/gi, `"${primaryDateColumn}"`);
        }
        break;
      }
    }
  }
  
  return validatedQuery;
}

// Get schema information for a table
export async function getTableSchemaInfo(tableName: string): Promise<{
  success: boolean;
  columns?: { name: string; type: string }[];
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
            TABLE_SCHEMA = UPPER('${schema}') 
            AND TABLE_NAME = UPPER('${table}')
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
                error: `Schema query error: ${err.message}` 
              });
              return;
            }
            
            if (!rows || rows.length === 0) {
              console.warn(`No columns found for table ${tableName}`);
              resolve({ 
                success: false, 
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
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  });
}

// Execute a query against Snowflake
export async function queryDatabase(query: string): Promise<any[]> {
  // Get the current user session
  const session = await auth();
  const userEmail = session?.user?.email || '';
  const { programId, isAdmin } = getProgramIdForUser(userEmail);
  
  console.log(`Executing query for user ${userEmail} with program ID ${programId}, admin: ${isAdmin}`);
  
  // Make a copy of the query for modifications
  let workingQuery = query;
  
  // Log the original query for debugging
  console.log('Original query:', workingQuery);
  
  // Validate query is read-only SELECT statement
  const queryLower = workingQuery.trim().toLowerCase();
  if (!queryLower.startsWith('select ')) {
    console.error('Rejecting non-SELECT query for security reasons:', workingQuery);
    throw new Error('Only SELECT queries are permitted for security reasons');
  }
  
  // Check for allowed tables
  let isAllowedTable = false;
  let targetTable = '';
  for (const tableName of AVAILABLE_TABLES) {
    // Handle both with and without schema prefix
    const tableNameWithoutSchema = tableName.includes('.') ? 
      tableName.split('.')[1].toLowerCase() : 
      tableName.toLowerCase();
    
    if (queryLower.includes(tableName.toLowerCase()) || 
        queryLower.includes(tableNameWithoutSchema)) {
      isAllowedTable = true;
      targetTable = tableName;
      break;
    }
  }
  
  if (!isAllowedTable) {
    console.error('Query references tables not in the allowed list:', workingQuery);
    throw new Error(`Only queries against the following tables are permitted: ${AVAILABLE_TABLES.join(', ')}`);
  }

  // Always apply schema preprocessing to fix column references
  console.log('BEFORE fixing query:', workingQuery);
  try {
    workingQuery = await preprocessQueryWithSchema(workingQuery, targetTable);
    console.log('AFTER all mappings and fixes:', workingQuery);
  } catch (error) {
    console.error('Error preprocessing query with schema:', error);
  }
  
  // Additional direct fix for any remaining DATE references if needed
  if (queryLower.includes(' date ') || 
      queryLower.includes('(date)') || 
      queryLower.includes('date,') || 
      queryLower.includes('date=') || 
      queryLower.includes('date>') || 
      queryLower.includes('date<')) {
    
    if (targetTable.toLowerCase().includes('transactions')) {
      // Hard-code the known solution for transactions table
      console.log('Direct fix for DATE column in transactions table');
      workingQuery = workingQuery.replace(/\bdate\b/gi, '"TRANSACTION_DATE"');
      
      // Apply a more comprehensive fix for common field names
      console.log('Applying comprehensive field name fixes for transactions table');
      
      // Common transaction fields mapped to their correct form
      // Using lowercase without quotes as a simpler approach
      const fieldMappings = {
        'TRANSACTION_ID': 'transaction_id',
        '"transaction_id"': 'transaction_id',
        '"TRANSACTION_ID"': 'transaction_id',
        'TRANSACTION_TIMESTAMP': 'transaction_timestamp',
        '"transaction_timestamp"': 'transaction_timestamp',
        '"TRANSACTION_TIMESTAMP"': 'transaction_timestamp',
        'TOTAL_AMOUNT': 'total_amount',
        '"total_amount"': 'total_amount',
        '"TOTAL_AMOUNT"': 'total_amount',
        'CUSTOMER_ID': 'customer_id',
        '"customer_id"': 'customer_id',
        '"CUSTOMER_ID"': 'customer_id',
        'PROGRAM_ID': 'program_id',
        '"program_id"': 'program_id',
        '"PROGRAM_ID"': 'program_id',
      };
      
      // Check if the field is already properly quoted to avoid double-quoting
      function isAlreadyQuoted(query: string, fieldName: string): boolean {
        // Check for "fieldname" pattern
        const quotedPattern = new RegExp(`"${fieldName}"`, 'i');
        return quotedPattern.test(query);
      }

      // Apply all field mappings, but only if they're not already properly quoted
      for (const [original, quoted] of Object.entries(fieldMappings)) {
        // Skip if this field is already properly quoted
        if (isAlreadyQuoted(workingQuery, original)) {
          console.log(`Field ${original} is already quoted, skipping...`);
          continue;
        }
        
        const regex = new RegExp(`\\b${original}\\b`, 'g');
        workingQuery = workingQuery.replace(regex, quoted);
      }
    }
  }

  // Use the query as-is without adding program_id filtering for admin users
  let modifiedQuery = isAdmin
    ? workingQuery  // Admin users can query all data without filtering
    : addProgramIdFilter(workingQuery, programId);

  // Fix any double-quoted fields and convert to simple lowercase identifiers
  const fixDoubleQuotes = (query: string): string => {
    // First fix any double quotes
    let fixedQuery = query.replace(/""([^"]+)""/g, '"$1"');
    
    console.log('QUERY BEFORE FINAL PROCESSING:', fixedQuery);
    
    // Define common field names that we want to convert to lowercase without quotes
    // IMPORTANT: We've removed transaction_id from this list because it doesn't exist in the transactions table
    // Instead, the correct field name is ID
    const commonFields = [
      /* 'transaction_id' removed because it causes errors */
      'transaction_timestamp', 'total_amount', 'customer_id', 'program_id',
      'date', 'total_price', 'quantity', 'unit_price', 'amount', 'transaction_date', 'store_id'
    ];
    
    // Convert all uppercase versions to lowercase
    for (const field of commonFields) {
      // Match uppercase version without quotes
      const uppercaseRegex = new RegExp(`\\b${field.toUpperCase()}\\b`, 'g');
      fixedQuery = fixedQuery.replace(uppercaseRegex, field);
      
      // Match uppercase version with quotes
      const quotedUppercaseRegex = new RegExp(`"${field.toUpperCase()}"`, 'g');
      fixedQuery = fixedQuery.replace(quotedUppercaseRegex, field);
      
      // Match mixed case with quotes (e.g., "Transaction_Id")
      const quotedMixedCaseRegex = new RegExp(`"[a-zA-Z0-9_]*${field.replace(/_/g, '[_]')}[a-zA-Z0-9_]*"`, 'gi');
      fixedQuery = fixedQuery.replace(quotedMixedCaseRegex, field);
    }
    
    // Remove quotes from all field references that match our common fields
    const quotedFieldsRegex = /"([a-zA-Z0-9_]+)"/g;
    fixedQuery = fixedQuery.replace(quotedFieldsRegex, (match, fieldName) => {
      // Check if it's a common field (case-insensitive)
      if (commonFields.includes(fieldName.toLowerCase())) {
        return fieldName.toLowerCase(); // Return unquoted lowercase
      }
      return match; // Keep other quoted fields as they are
    });
    
    return fixedQuery;
  };
  
  // Apply the double-quote fix
  modifiedQuery = fixDoubleQuotes(modifiedQuery);
  
  // Add detailed logging to diagnose the issue
  console.log('BEFORE fixing query:', workingQuery);
  console.log('AFTER all mappings and fixes:', modifiedQuery);
  
  // One more safety check for uppercase fields
  const commonFieldNames = ['transaction_id', 'transaction_timestamp', 'total_amount', 'customer_id', 'program_id'];
  for (const field of commonFieldNames) {
    // Try both uppercase without quotes and uppercase with quotes
    const uppercaseRegex = new RegExp(`\\b${field.toUpperCase()}\\b`, 'g');
    modifiedQuery = modifiedQuery.replace(uppercaseRegex, field);
    
    const quotedUppercaseRegex = new RegExp(`"${field.toUpperCase()}"`, 'g');
    modifiedQuery = modifiedQuery.replace(quotedUppercaseRegex, field);
    
    // Try removing any remaining quotes
    const quotedRegex = new RegExp(`"${field}"`, 'g');
    modifiedQuery = modifiedQuery.replace(quotedRegex, field);
  }
  
  // Log the query before final processing
  console.log('QUERY BEFORE FINAL PROCESSING:', modifiedQuery);
  
  // Let's try the simplest approach - we'll remove ALL quotes from field names
  // and ensure they are lowercase
  
  // Log the query we're about to process
  console.log('Processing query with new approach:', modifiedQuery);
  
  // First, handle quoted identifiers (both uppercase and lowercase)
  const quotedIdentifierRegex = /"([^"]+)"/g;
  modifiedQuery = modifiedQuery.replace(quotedIdentifierRegex, (match, identifier) => {
    // Convert the identifier to lowercase and remove quotes
    // Skip table names (which contain a dot)
    if (identifier.includes('.')) return match;
    // Skip SQL functions
    if (['TO_CHAR', 'DATEADD', 'CURRENT_DATE'].some(func => identifier.toUpperCase() === func)) return match;
    return identifier.toLowerCase();
  });
  
  // Handle uppercase unquoted identifiers
  const commonFields = [
    'TRANSACTION_ID', 'CUSTOMER_ID', 'TRANSACTION_TIMESTAMP', 'TRANSACTION_DATE',
    'TOTAL_AMOUNT', 'AMOUNT', 'STORE_ID', 'PROGRAM_ID', 'PRODUCT_ID', 'QUANTITY',
    'UNIT_PRICE', 'TOTAL_PRICE', 'LINE_ITEM_ID'
  ];
  
  for (const field of commonFields) {
    // Create a regex that matches whole-word occurrences of the uppercase field
    const uppercaseRegex = new RegExp(`\\b${field}\\b`, 'g');
    // Replace with lowercase
    modifiedQuery = modifiedQuery.replace(uppercaseRegex, field.toLowerCase());
  }
  
  // Also specifically handle aggregate functions like COUNT()
  const functionRegex = /\b(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*([^\)]+)\)/gi;
  modifiedQuery = modifiedQuery.replace(functionRegex, (match, funcName, param) => {
    // Apply the same replacements to the parameter
    let processedParam = param;
    
    // First, handle quoted identifiers in function parameters
    const quotedParamRegex = /"([^"]+)"/g;
    processedParam = processedParam.replace(quotedParamRegex, (paramMatch: string, paramIdentifier: string) => {
      // Convert to lowercase and remove quotes
      if (paramIdentifier.includes('.')) return paramMatch;
      if (['TO_CHAR', 'DATEADD', 'CURRENT_DATE'].some(func => paramIdentifier.toUpperCase() === func)) return paramMatch;
      return paramIdentifier.toLowerCase();
    });
    
    // Then handle uppercase unquoted in function parameters
    for (const field of commonFields) {
      const uppercaseParamRegex = new RegExp(`\\b${field}\\b`, 'g');
      processedParam = processedParam.replace(uppercaseParamRegex, field.toLowerCase());
    }
    
    return `${funcName}(${processedParam})`;
  });
  
  // FINAL FIX: Direct replacement of invalid column names with their correct counterparts
  // This is a critical fix that must happen after all other processing
  if (targetTable.toLowerCase().includes('transactions')) {
    const before = modifiedQuery;
    
    // Fix transaction_id -> ID mapping
    modifiedQuery = modifiedQuery.replace(/\btransaction_id\b/gi, '"ID"');
    
    // Fix customer_id -> PROGRAM_MEMBERSHIP_ID mapping
    modifiedQuery = modifiedQuery.replace(/\bcustomer_id\b/gi, '"PROGRAM_MEMBERSHIP_ID"');
    
    if (before !== modifiedQuery) {
      console.log('Applied CRITICAL FIX: Replaced invalid column names with their correct counterparts');
    }
  }
  
  console.log('ABSOLUTE FINAL QUERY:', modifiedQuery);

  // Create a connection to Snowflake
  const connection = createSnowflakeConnection();

  return new Promise((resolve, reject) => {
    try {
      connection.connect((err) => {
        if (err) {
          const errorDetails = err.message || String(err);
          console.error('Error connecting to Snowflake:', errorDetails);
          console.error('Connection error details:', err);
          
          // Don't fall back to mock data on connection error
          reject(new Error(`Snowflake connection error: ${err.message}`));
          return;
        }

        connection.execute({
          sqlText: modifiedQuery,
          complete: (err, stmt, rows) => {
            // Always terminate the connection
            try {
              connection.destroy((destroyErr) => {
                if (destroyErr) {
                  console.error('Error destroying connection:', destroyErr);
                }
              });
            } catch (destroyError) {
              console.error('Error while attempting to destroy connection:', destroyError);
            }

            if (err) {
              console.error('Error executing query:', err);
              console.error('Query that caused error:', modifiedQuery);
              
              // Don't fall back to mock data on query error
              reject(new Error(`Snowflake query error: ${err.message}`));
              return;
            }

            if (!rows) {
              resolve([]);
              return;
            }

            console.log(`Query executed successfully. ${rows.length} rows returned.`);
            resolve(rows);
          },
        });
      });
    } catch (error) {
      console.error('Unexpected error during query execution:', error);
      reject(new Error(`Unexpected error during query execution: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

// Preprocesses a query using schema information to fix column references
async function preprocessQueryWithSchema(query: string, tableName: string): Promise<string> {
  console.log(`Preprocessing query with schema for table ${tableName}`);
  
  // Get the schema information for the table
  const schemaInfo = await getTableSchemaInfo(tableName);
  
  if (!schemaInfo.success || !schemaInfo.columns || schemaInfo.columns.length === 0) {
    console.warn(`Could not get schema for ${tableName}, using query as is`);
    return query;
  }

  // Log the full schema to help with debugging
  console.log(`Full schema for ${tableName}:`, schemaInfo.columns.map(c => `${c.name} (${c.type})`).join(', '));
  
  let fixedQuery = query;
  
  // Find all date columns in the schema
  const dateColumns = schemaInfo.columns.filter(col => 
    col.type.includes('DATE') || col.type.includes('TIMESTAMP')
  );
  
  if (dateColumns.length > 0) {
    console.log(`Found date columns in ${tableName}:`, dateColumns.map(c => c.name).join(', '));
    
    // Get the primary date column - the first one
    const primaryDateColumn = dateColumns[0].name;
    console.log(`Using primary date column: ${primaryDateColumn}`);
    
    // Replace all references to 'date' with the actual column name
    // IMPORTANT: In Snowflake, quoted identifiers are case-sensitive
    const datePattern = /\bdate\b/gi;
    
    // Wrap the column name in double quotes to preserve case
    fixedQuery = fixedQuery.replace(datePattern, `"${primaryDateColumn}"`);
    console.log('Query after date column preprocessing:', fixedQuery);
    console.log('Direct fix for DATE column in transactions table');
  }

  // TABLE-SPECIFIC FIXES
  if (tableName.toLowerCase().includes('transactions')) {
    console.log('Applying comprehensive field name fixes for transactions table');
    
    // Create an exact map of column names to their proper case from the schema
    const columnMap = new Map(
      schemaInfo.columns.map(col => [col.name.toLowerCase(), col.name])
    );
    
    // Map transaction_id to ID for this specific table since we know transaction_id is invalid
    // but commonly used in generated queries
    if (tableName.toLowerCase().includes('transactions') && 
        columnMap.has('id') && !columnMap.has('transaction_id')) {
      // Find and replace transaction_id with the proper ID column
      const transactionIdPattern = /\btransaction_id\b/gi;
      const before = fixedQuery;
      fixedQuery = fixedQuery.replace(transactionIdPattern, columnMap.get('id') || 'ID');
      
      if (before !== fixedQuery) {
        console.log(`Direct fix: Replaced 'transaction_id' with '${columnMap.get('id') || 'ID'}' in transactions table query`);
      }
    }
    
    // Replace all column references with their proper case
    // This regex finds all identifiers that might be column names
    const identifierPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;
    
    // Clone fixedQuery to temp variable to avoid modifying while iterating
    const tempQuery = fixedQuery;
    
    // Collect all potential column names
    const potentialColumns = [];
    while ((match = identifierPattern.exec(tempQuery)) !== null) {
      const columnName = match[1].toLowerCase();
      if (columnName !== 'select' && columnName !== 'from' && columnName !== 'where' && 
          columnName !== 'and' && columnName !== 'or' && columnName !== 'as' &&
          columnName !== 'count' && columnName !== 'sum' && columnName !== 'min' &&
          columnName !== 'max' && columnName !== 'avg' && columnName !== 'group' &&
          columnName !== 'by' && columnName !== 'order' && columnName !== 'limit' &&
          columnName !== 'having' && columnName !== 'join' && columnName !== 'on' &&
          columnName !== 'is' && columnName !== 'not' && columnName !== 'null' &&
          columnName !== 'in' && columnName !== 'between' && columnName !== 'like' &&
          columnName !== 'case' && columnName !== 'when' && columnName !== 'then' &&
          columnName !== 'else' && columnName !== 'end' && columnName !== 'distinct' &&
          !columnName.match(/^\d+$/) && // exclude numeric literals
          !columnName.match(/^'.*'$/) && // exclude string literals
          !columnName.startsWith('date_trunc') && // exclude functions
          columnName !== 'month' && columnName !== 'year' && columnName !== 'day') {
        potentialColumns.push({
          name: match[1],
          start: match.index,
          end: match.index + match[1].length
        });
      }
    }
    
    // Check if each potential column exists in the schema and fix if necessary
    for (const colInfo of potentialColumns) {
      const lowerColName = colInfo.name.toLowerCase();
      
      // Skip if it's already quoted
      if (colInfo.start > 0 && tempQuery[colInfo.start - 1] === '"' && 
          colInfo.end < tempQuery.length && tempQuery[colInfo.end] === '"') {
        console.log(`Field ${colInfo.name} is already quoted, skipping...`);
        continue;
      }
      
      // If this column name doesn't exist in the schema
      if (!columnMap.has(lowerColName)) {
        // Special case for transactions table, replace transaction_id with ID
        if (lowerColName === 'transaction_id' && columnMap.has('id')) {
          // Replace with the correct column name using regular expression for word boundaries
          const regex = new RegExp(`\\b${colInfo.name}\\b`, 'g');
          fixedQuery = fixedQuery.replace(regex, columnMap.get('id') || 'ID');
        }
      }
    }
  }
  
  // Create a map of potential generic column names to actual schema column names
  const commonColumnMappings: Record<string, string> = {
    'id': 'ID',
    'customer': 'CUSTOMER_ID',
    'product': 'PRODUCT_ID',
    // Remove this problematic mapping
    // 'transaction': 'TRANSACTION_ID',
    'store': 'STORE_ID',
    'price': 'UNIT_PRICE',
    'amount': 'TOTAL_AMOUNT',
    'revenue': 'TOTAL_AMOUNT',
    'sales': 'TOTAL_AMOUNT',
    'quantity': 'QUANTITY'
  };

  // Fix other generic column name references based on schema
  for (const [genericName, likelyName] of Object.entries(commonColumnMappings)) {
    // Find a matching column in the schema (ignoring case)
    const matchingColumn = schemaInfo.columns.find(
      col => col.name.toLowerCase() === likelyName.toLowerCase()
    );
    
    if (matchingColumn) {
      // Create a regex that matches the generic name but not if it's already in quotes
      const genericPattern = new RegExp(`\\b${genericName}\\b(?!["'])`, 'gi');
      
      // Replace with the proper case-sensitive column name in quotes
      const before = fixedQuery;
      fixedQuery = fixedQuery.replace(genericPattern, `"${matchingColumn.name}"`);
      
      if (before !== fixedQuery) {
        console.log(`Replaced generic column "${genericName}" with "${matchingColumn.name}"`);
      }
    }
  }
  
  console.log('Final preprocessed query:', fixedQuery);
  return fixedQuery;
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
  description: `Query business data directly from Snowflake data warehouse. Available tables include: ${AVAILABLE_TABLES.join(', ')}. 
  Only SELECT queries are permitted, and results will be automatically filtered to the user's program ID.
  For example: "SELECT * FROM \"HANG_LOYALTY_PUBLIC\".\"transactions\" LIMIT 10" will only return data for the current user's program.`,
  parameters: z.object({
    query: z.string().describe('The SQL query to execute against Snowflake'),
    title: z.string().optional().describe('Title for the data result'),
    description: z.string().optional().describe('Description of what the data shows'),
  }),
  execute: async ({ query, title, description }, { toolCallId, abortSignal }) => {
    try {
      // For natural language queries, first get schema information to ensure SQL is generated correctly
      let sqlQuery = query;
      
      // If query doesn't start with SELECT, assume it's a natural language query
      if (!query.trim().toLowerCase().startsWith('select')) {
        console.log('Natural language query detected, generating SQL with schema awareness');
        try {
          sqlQuery = await generateSqlQuery(query);
          console.log('Successfully generated SQL from natural language:', sqlQuery);
        } catch (error) {
          console.error('Error generating SQL from natural language:', error);
          throw new Error(`Could not generate SQL for your query: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Get the current user session
      const session = await auth();
      const userEmail = session?.user?.email || '';
      const { programId, isAdmin } = getProgramIdForUser(userEmail);

      try {
        // Execute the query against Snowflake directly using the schema-aware query
        const data = await queryDatabase(sqlQuery);
        
        return {
          data: formatDataForDisplay(data),
          sql: sqlQuery,
          title: title || 'Query Results',
          description: description || '',
        };
      } catch (queryError) {
        // Log the error for debugging
        console.error('Query execution error:', queryError);
        
        // Type guard for queryError to handle unknown type
        const errorObj = queryError as Error;
        const errorMessage = errorObj.message || String(queryError);
        
        // If error is about DATE column, retry with a direct fix
        if (errorMessage.toLowerCase().includes('date')) {
          console.log('Query failed with DATE error, attempting direct fix');
          
          // First, get the actual schema to find the exact column name and case
          try {
            // Extract the table name from the query
            const tableMatch = sqlQuery.match(/FROM\s+([A-Za-z0-9_."]+)/i);
            if (!tableMatch || !tableMatch[1]) {
              throw new Error('Could not determine table name from query');
            }
            
            // Clean up table name by removing quotes and handling dot notation properly
            let tableName = tableMatch[1].replace(/"/g, '');
            console.log(`Raw table name extracted: ${tableName}`);
            
            // Handle different formats of table names (with/without database, schema)
            let tableNameForSchema = tableName;
            // If it has a dot, it might be in format schema.table or db.schema.table
            if (tableName.includes('.')) {
              const parts = tableName.split('.');
              if (parts.length === 2) {
                // Format: schema.table
                tableNameForSchema = tableName;
              } else if (parts.length === 3) {
                // Format: db.schema.table - we only need schema.table
                tableNameForSchema = `${parts[1]}.${parts[2]}`;
              }
            }
            
            console.log(`Attempting to get schema for ${tableNameForSchema} to fix date column`);
            
            // Get the actual schema
            let schemaInfo;
            try {
              schemaInfo = await getTableSchemaInfo(tableNameForSchema);
            } catch (schemaError) {
              console.error(`Error getting schema for ${tableNameForSchema}:`, schemaError);
              console.log('Trying fallback with just the table name...');
              
              // Try fallback to just the last part of the table name
              const lastPart = tableName.split('.').pop() || '';
              if (lastPart) {
                try {
                  schemaInfo = await getTableSchemaInfo(lastPart);
                } catch (fallbackError) {
                  console.error(`Fallback schema lookup failed for ${lastPart}:`, fallbackError);
                  throw new Error(`Could not retrieve schema for ${tableName}`);
                }
              } else {
                throw new Error(`Invalid table name: ${tableName}`);
              }
            }
            
            if (!schemaInfo || !schemaInfo.success || !schemaInfo.columns || schemaInfo.columns.length === 0) {
              throw new Error(`Could not retrieve valid schema for ${tableName}`);
            }
            
            // Find the date columns with their proper case
            const dateColumns = schemaInfo.columns.filter(col => 
              col.type.toLowerCase().includes('date') || col.type.toLowerCase().includes('timestamp')
            );
            
            if (dateColumns.length === 0) {
              throw new Error(`No date columns found in ${tableName}`);
            }
            
            // Get the exact case of the transaction_date column if it exists
            const transactionDateCol = dateColumns.find(col => 
              col.name.toLowerCase() === 'transaction_date'
            );
            
            // Use either the transaction_date column or the first date column with its proper case
            const dateColName = transactionDateCol ? transactionDateCol.name : dateColumns[0].name;
            console.log(`Using date column with proper case: "${dateColName}"`);
            
            // Replace all variations of date references with the properly cased column name
            let fixedQuery = sqlQuery;
            
            // 1. Replace generic 'date' keyword
            fixedQuery = fixedQuery.replace(/\bdate\b/gi, `"${dateColName}"`);
            
            // 2. Also fix any lowercase or uppercase variations of transaction_date that aren't properly quoted
            fixedQuery = fixedQuery.replace(/\btransaction_date\b/gi, `"${dateColName}"`);
            fixedQuery = fixedQuery.replace(/\bTRANSACTION_DATE\b/g, `"${dateColName}"`);
            
            // 3. Fix any variations that might be quoted incorrectly
            fixedQuery = fixedQuery.replace(/"transaction_date"/gi, `"${dateColName}"`);
            fixedQuery = fixedQuery.replace(/"TRANSACTION_DATE"/g, `"${dateColName}"`);
            
            console.log('Retrying with fixed query:', fixedQuery);
            
            // Try again with the fixed query
            const data = await queryDatabase(fixedQuery);
            
            return {
              data: formatDataForDisplay(data),
              sql: fixedQuery,
              title: title || 'Query Results',
              description: description || '(Query was automatically fixed to use proper column names)',
            };
          } catch (retryError) {
            console.error('Retry failed after DATE fix:', retryError);
            
            // Try one more fallback with a simple date column fix
            try {
              console.log('Attempting last-resort date column fix...');
              // Try with transaction_date (lowercase) as a fallback
              const lastResortQuery = sqlQuery.replace(/\bdate\b/gi, '"transaction_date"');
              
              if (lastResortQuery !== sqlQuery) {
                console.log('Using last resort query:', lastResortQuery);
                const data = await queryDatabase(lastResortQuery);
                
                return {
                  data: formatDataForDisplay(data),
                  sql: lastResortQuery,
                  title: title || 'Query Results',
                  description: description || '(Query was fixed with fallback column names)',
                };
              }
            } catch (lastResortError) {
              console.error('Last resort fix also failed:', lastResortError);
            }
            
            throw new Error(`Error executing query: ${errorMessage}. Additional information: This may be due to incorrect column names.`);
          }
        }
        
        // Otherwise, propagate the error with a helpful message
        throw new Error(`Error executing query: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Query data tool error:', error);
      
      // Don't use mock data, propagate the error instead
      throw error;
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

  // Normalize column names
  const normalizeData = (data: any[]): any[] => {
    if (!Array.isArray(data) || data.length === 0) return data;
    
    return data.map(item => {
      if (typeof item !== 'object' || item === null) return item;
      
      const normalized: any = {};
      for (const [key, value] of Object.entries(item)) {
        // Convert uppercase column names to lowercase with underscores
        // This fixes issues where column names come back as "PROGRAM_ID" and get displayed as "P R O G R A M I D"
        const normalizedKey = key.toLowerCase().replace(/_/g, '_');
        normalized[normalizedKey] = value;
      }
      return normalized;
    });
  };

  // First normalize column names
  const normalizedData = normalizeData(data);

  // Then recursively format all numbers in the data
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

  return format(normalizedData);
} 