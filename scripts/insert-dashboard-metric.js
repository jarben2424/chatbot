// Script to manually insert a sales metric into the UserDashboardMetrics table

import { createClient } from '@supabase/supabase-js';

// Create Supabase client
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
    const { data: dashboardMetrics, error: metricsError } = await supabase
      .from('DashboardMetrics')
      .select('*')
      .eq('category', 'sales')
      .limit(1);
      
    if (metricsError || !dashboardMetrics || dashboardMetrics.length === 0) {
      console.error('Error getting sales metrics or no metrics found', metricsError);
      process.exit(1);
    }
    
    const sampleMetric = dashboardMetrics[0];
    console.log('Selected sample metric:', sampleMetric.title, '(ID:', sampleMetric.id, ')');
    
    // 3. Check if this metric is already in the user's dashboard
    const { data: existingMetrics, error: existingError } = await supabase
      .from('UserDashboardMetrics')
      .select('*')
      .eq('userId', user.id)
      .eq('sourceType', 'dashboard_metric')
      .eq('sourceId', sampleMetric.id);
      
    if (existingError) {
      console.error('Error checking existing metrics', existingError);
      process.exit(1);
    }
    
    if (existingMetrics && existingMetrics.length > 0) {
      console.log('This metric is already in your dashboard. Skipping insertion.');
      process.exit(0);
    }
    
    // 4. Get current highest display order
    const { data: displayOrderData, error: displayOrderError } = await supabase
      .from('UserDashboardMetrics')
      .select('displayOrder')
      .eq('userId', user.id)
      .order('displayOrder', { ascending: false })
      .limit(1);
      
    const newDisplayOrder = (displayOrderData && displayOrderData.length > 0)
      ? (displayOrderData[0].displayOrder + 1)
      : 0;
    
    // 5. Insert the metric into UserDashboardMetrics
    const { data: insertResult, error: insertError } = await supabase
      .from('UserDashboardMetrics')
      .insert([
        {
          userId: user.id,
          sourceType: 'dashboard_metric',
          sourceId: sampleMetric.id,
          displayOrder: newDisplayOrder,
          category: sampleMetric.category,
          isActive: true,
          parameters: {}
        }
      ])
      .select();
      
    if (insertError) {
      console.error('Error inserting metric', insertError);
      process.exit(1);
    }
    
    console.log('Successfully added metric to dashboard!', insertResult);
    
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

main();
