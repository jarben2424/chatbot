import { createAnthropicProvider, CLAUDE_OPUS_3_5_MODEL_NAME } from '@/lib/ai/providers';
import { streamText } from 'ai';
import { getTableSchemaInfo } from './query-data';

// List of available tables in the database
const AVAILABLE_TABLES = [
  // Only allow these specific tables
  'HANG_LOYALTY_PUBLIC.customer_transactions',
  'HANG_LOYALTY_PUBLIC.transactions',
  'HANG_LOYALTY_PUBLIC.transaction_line_items'
];

// Use Claude Opus 3.5 to generate a valid SQL query
export async function generateSqlQuery(userRequest: string): Promise<string> {
  try {
    // Get schema information for all tables first
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
    let schemaText = 'Available tables in Snowflake and their EXACT column names (use these precise names and case):\n\n';
    
    // Log the raw schema data for debugging
    console.log('RAW SCHEMA DATA FROM SNOWFLAKE:', JSON.stringify(tableSchemas, null, 2));
    
    for (const tableSchema of tableSchemas) {
      if (tableSchema.columns.length === 0) continue;
      
      schemaText += `${tableSchema.tableName}:\n`;
      console.log(`COLUMNS FOR ${tableSchema.tableName}:`, tableSchema.columns.map(c => c.name));
      
      for (const column of tableSchema.columns) {
        // Emphasize that column names are case-sensitive
        schemaText += `- ${column.name} (${column.type}) <-- USE EXACTLY THIS COLUMN NAME WITH CASE PRESERVED\n`;
      }
      
      // Add special notes for each table specifying its primary key
      if (tableSchema.tableName === 'HANG_LOYALTY_PUBLIC.transactions') {
        // Find any ID-like column that might be the primary key
        const idColumn = tableSchema.columns.find(col => col.name === 'ID') || 
                         tableSchema.columns.find(col => col.name.includes('ID')) ||
                         tableSchema.columns[0]; // fallback to first column
        
        if (idColumn) {
          schemaText += `SPECIAL NOTE: In this table, use ${idColumn.name} as the primary key\n`;
        }
      }
      
      schemaText += '\n';
    }
    
    console.log('Using actual schema for SQL generation:', schemaText);

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

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:
1. Only write SQL for Snowflake that queries the tables listed above.
2. ALWAYS use the EXACT column names as shown in the schema with the EXACT SAME CASE. 
   - For example, if schema shows ID, use ID not id or "id"
   - For example, if schema shows TRANSACTION_TIMESTAMP, use TRANSACTION_TIMESTAMP not transaction_timestamp
3. NEVER use tables or columns that aren't in the schema provided.
4. Always write complete, executable SQL statements.
5. ONLY return the SQL query - no explanations or comments.
6. Ensure your query only uses the available columns listed for each table.
7. Limit results to 100 rows maximum unless specifically requested otherwise.
8. Don't include program_id filtering - this will be added automatically by the backend.

FORMATTING RULES:
9. For column names: use the EXACT CASE shown in the schema WITHOUT quotes
   - CORRECT: If schema shows 'ID', use SELECT ID FROM table
   - CORRECT: If schema shows 'NAME', use SELECT NAME FROM table
   - INCORRECT: SELECT "id" FROM table (using quotes)
   - INCORRECT: SELECT id FROM table (wrong case)

10. For table names: do NOT use quotes (e.g., HANG_LOYALTY_PUBLIC.transactions)

11. For column aliases: use uppercase without quotes (e.g., AS MONTHLY_TOTAL)

12. For SQL functions: use function with the EXACT column name as shown in schema
    - CORRECT: If schema shows 'ID', use COUNT(ID) 
    - INCORRECT: Using COUNT("id") or COUNT(id)

CRITICAL: ONLY use column names that are EXPLICITLY listed in the schema above.
If you need to count rows, use COUNT(*) or count a primary key column shown in the schema.`,
      prompt: `Write a Snowflake SQL query that answers this question: "${userRequest}"`,
      temperature: 0.1, // Lower temperature for more deterministic SQL generation
      maxTokens: 500,
    });
    
    // Extract and clean the SQL query
    const sqlText = await response.text;
    const sqlQuery = sqlText.trim().replace(/```sql/g, '').replace(/```/g, '').trim();
    
    console.log('Generated SQL query:', sqlQuery);
    return sqlQuery;
  } catch (error) {
    console.error('Error generating SQL query:', error);
    throw new Error('Failed to generate SQL query');
  }
} 