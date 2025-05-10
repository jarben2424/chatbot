import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    // Test simple query
    const { data, error } = await supabase.rpc('run_warehouse_query_json', {
      sql: `
        SELECT json_build_object(
          'count', COUNT(*)
        ) 
        FROM products
      `
    });

    if (error) {
      console.error('Database test failed:', error.message);
      return;
    }

    console.log('Database connection successful!');
    console.log('Raw response:', data);
    console.log('Number of products:', data?.json_build_object?.count || 'No data found');

    // Test a more complex query
    const { data: salesData, error: salesError } = await supabase.rpc('run_warehouse_query_json', {
      sql: `
        SELECT json_build_object(
          'sales', json_agg(
            json_build_object(
              'category', category,
              'total_sales', total_sales
            )
          )
        )
        FROM (
          SELECT 
            p.category,
            SUM(s.total_amount) as total_sales
          FROM sales s
          JOIN products p ON s.product_id = p.id
          GROUP BY p.category
        ) t
      `
    });

    if (salesError) {
      console.error('Sales query failed:', salesError.message);
      return;
    }

    console.log('\nRaw sales data:', JSON.stringify(salesData, null, 2));
    console.log('\nSales by category:', salesData?.json_build_object?.sales || 'No sales data found');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabaseConnection(); 