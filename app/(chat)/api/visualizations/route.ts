import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';

// GET /api/visualizations
// Returns a list of available visualizations
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
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
      
      // Query all documents with kind = 'visualization'
      const { data: visualizations, error } = await supabase
        .from('Document')
        .select('id, title, kind, createdAt, content')
        .eq('kind', 'visualization')
        .order('createdAt', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform the results to add preview images
      const formattedVisualizations = visualizations.map((viz) => {
        let preview = '/placeholder-chart.png'; // Default
        
        // Try to extract data from content if available
        try {
          const content = JSON.parse(viz.content || '{}');
          // In a real app, you would generate a preview image here
        } catch (e) {
          console.error('Error parsing visualization content:', e);
        }
        
        return {
          id: viz.id,
          title: viz.title,
          kind: viz.kind,
          createdAt: viz.createdAt,
          preview
        };
      });
      
      return new NextResponse(JSON.stringify(formattedVisualizations), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error querying database for visualizations:', error);
      
      // Return mock data as fallback
      const visualizations = [
        {
          id: generateUUID(),
          title: 'Monthly Revenue',
          kind: 'visualization',
          createdAt: new Date(),
          preview: '/placeholder-chart.png'
        },
        {
          id: generateUUID(),
          title: 'Customer Growth',
          kind: 'visualization',
          createdAt: new Date(),
          preview: '/placeholder-chart.png'
        }
      ];
      
      return new NextResponse(JSON.stringify(visualizations), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error fetching visualizations:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to fetch visualizations',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 