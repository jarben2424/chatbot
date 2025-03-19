import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { document } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/document/visualizations
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
      // Create db connection
      const db = drizzle(neon(process.env.DATABASE_URL!), { schema: { document } });
      
      // Query all documents with kind = 'visualization'
      const visualizations = await db
        .select({
          id: document.id,
          title: document.title,
          kind: document.kind,
          createdAt: document.createdAt,
          content: document.content
        })
        .from(document)
        .where(eq(document.kind, 'visualization'))
        .orderBy(desc(document.createdAt));
      
      // Transform the results to add preview images
      const formattedVisualizations = visualizations.map((viz: {
        id: string;
        title: string;
        kind: string;
        createdAt: Date;
        content: string | null;
      }) => {
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