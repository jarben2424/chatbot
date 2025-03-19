import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// GET /api/visualization-image
// Returns a visualization image or placeholder based on the ID
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the visualization ID from query params
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Missing visualization ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Create Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Query the document with the given ID
      const { data: visualizations, error } = await supabase
        .from('Document')
        .select('id, title, content')
        .eq('id', id)
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (visualizations.length === 0) {
        // Return a placeholder image if visualization not found
        return new NextResponse(JSON.stringify({ 
          imageUrl: '/placeholder-chart.png',
          title: 'Visualization Not Found'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const visualization = visualizations[0];
      let imageUrl = '/placeholder-chart.png'; // Default
      let chartData = {};
      
      // Try to extract data from content if available
      try {
        if (visualization.content) {
          const content = JSON.parse(visualization.content);
          
          // If we had actual chart rendering capabilities, we would generate 
          // an image here or return the data needed to render the chart
          chartData = {
            data: content.data || [],
            type: content.visualization || 'bar',
            title: visualization.title,
            description: content.description || ''
          };
          
          // For now, we'll just use a placeholder
          imageUrl = '/placeholder-chart.png';
        }
      } catch (e) {
        console.error('Error parsing visualization content:', e);
      }
      
      // Return the image URL and chart data
      return new NextResponse(JSON.stringify({
        imageUrl,
        chartData,
        title: visualization.title
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error querying database for visualization:', error);
      
      // Return placeholder as fallback
      return new NextResponse(JSON.stringify({ 
        imageUrl: '/placeholder-chart.png',
        title: 'Error Loading Visualization'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error fetching visualization:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to fetch visualization',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 