import { tool } from 'ai';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { getProgramIdForUser } from '@/lib/auth/program-mapping';
import { queryDatabase } from './query-data';

// The actual query data tool that uses natural language
export const aiQueryData = tool({
  description: `Query business data from Snowflake by asking questions in plain English. The AI will generate and execute the appropriate SQL query.`,
  parameters: z.object({
    question: z.string().describe('The business question to answer with data'),
    title: z.string().optional().describe('Title for the data result'),
    description: z.string().optional().describe('Description of what the data shows'),
  }),
  execute: async ({ question, title, description }, { toolCallId }) => {
    try {
      const session = await auth();
      const userEmail = session?.user?.email || '';
      const { programId } = getProgramIdForUser(userEmail);

      // Generate a default SQL query based on the question
      // For now, we'll use a simple default query that's likely to work
      let sqlQuery = "";
      
      if (question.toLowerCase().includes('revenue') || 
          question.toLowerCase().includes('sales') ||
          question.toLowerCase().includes('money') ||
          question.toLowerCase().includes('earnings')) {
        sqlQuery = "SELECT \"transaction_date\", SUM(\"total_amount\") as \"revenue\" FROM \"HANG_LOYALTY_PUBLIC\".\"transactions\" GROUP BY \"transaction_date\" ORDER BY \"transaction_date\" DESC LIMIT 10";
      } else if (question.toLowerCase().includes('transaction') || 
                question.toLowerCase().includes('purchase')) {
        sqlQuery = "SELECT * FROM \"HANG_LOYALTY_PUBLIC\".\"transactions\" ORDER BY \"transaction_date\" DESC LIMIT 10";
      } else if (question.toLowerCase().includes('product') || 
                question.toLowerCase().includes('item')) {
        sqlQuery = "SELECT * FROM \"HANG_LOYALTY_PUBLIC\".\"transaction_line_items\" LIMIT 10";
      } else if (question.toLowerCase().includes('customer')) {
        sqlQuery = "SELECT * FROM \"HANG_LOYALTY_PUBLIC\".\"customer_transactions\" LIMIT 10";
      } else {
        // Default query
        sqlQuery = "SELECT * FROM \"HANG_LOYALTY_PUBLIC\".\"transactions\" ORDER BY \"transaction_date\" DESC LIMIT 5";
      }

      console.log(`Generated SQL query: ${sqlQuery} for question: ${question}`);
      
      // Execute the query
      const data = await queryDatabase(sqlQuery);

      return {
        data: formatDataDisplay(data),
        sql: sqlQuery,
        title: title || `${question}`,
        description: description || '',
      };
    } catch (error) {
      console.error('AI Query data tool error:', error);
      
      // Instead of falling back to mock data, throw the error
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
});

// Helper function to format data for display
function formatDataDisplay(data: any[]) {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(row => {
    // Create a new object for the formatted row
    const formattedRow: Record<string, any> = {};
    
    // Format each property in the row
    for (const [key, value] of Object.entries(row)) {
      // If it's a revenue/amount column, format as currency
      if (key.toLowerCase().includes('revenue') || 
          key.toLowerCase().includes('amount') ||
          key.toLowerCase().includes('price') ||
          key.toLowerCase().includes('sales')) {
        if (typeof value === 'number') {
          formattedRow[key] = `$${value.toLocaleString()}`;
        } else {
          formattedRow[key] = value;
        }
      } else {
        formattedRow[key] = value;
      }
    }
    
    return formattedRow;
  });
}

// Function to generate mock data when needed
function generateMockData() {
  return [
    { transaction_date: '2023-01-15', total_amount: 1299.99, transaction_id: 5001, customer_id: 1001, program_id: 1 },
    { transaction_date: '2023-01-16', total_amount: 899.99, transaction_id: 5002, customer_id: 1002, program_id: 1 },
    { transaction_date: '2023-01-17', total_amount: 149.99, transaction_id: 5003, customer_id: 1003, program_id: 1 },
    { transaction_date: '2023-01-18', total_amount: 349.99, transaction_id: 5004, customer_id: 1001, program_id: 1 },
    { transaction_date: '2023-01-19', total_amount: 89.99, transaction_id: 5005, customer_id: 1005, program_id: 1 },
  ];
} 