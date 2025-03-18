// Script to manually insert a sales metric into the UserDashboardMetrics table
import { createClient } from '@supabase/supabase-js';
import { addMetricToDashboard, getSystemDashboardMetricsByCategory } from '../lib/dashboard-metrics';

// Create Supabase client (for direct operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // 1. Get current user ID (you'll need to be logged in to run this)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user or no user is authenticated', userError);
      process.exit(1);
    }
    
    console.log('Using user ID:', user.id);
    
    // 2. Find a sales dashboard metric to use as an example
    const salesMetrics = await getSystemDashboardMetricsByCategory('sales');
      
    if (!salesMetrics || salesMetrics.length === 0) {
      console.error('No sales metrics found');
      process.exit(1);
    }
    
    const sampleMetric = salesMetrics[0];
    console.log('Selected sample metric:', sampleMetric.title, '(ID:', sampleMetric.id, ')');
    
    // 3. Insert the metric using our existing function
    const result = await addMetricToDashboard({
      sourceType: 'dashboard_metric',
      sourceId: sampleMetric.id,
      category: 'sales',
    });
    
    if (!result) {
      console.error('Failed to add metric to dashboard');
      process.exit(1);
    }
    
    console.log('Successfully added metric to dashboard!', result);
    
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

main();
