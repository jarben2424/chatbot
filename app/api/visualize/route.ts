import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateDataVisualization } from '@/lib/data-visualization/generate';
import { generateUUID } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { data, title, description, type = 'auto' } = body;

    console.log('Visualization request received:', { 
      hasData: !!data, 
      dataLength: data?.length,
      type, 
      title 
    });

    if (!data || !Array.isArray(data) || data.length === 0) {
      return new NextResponse(JSON.stringify({ 
        error: 'No data provided',
        details: `Received: ${typeof data}, array: ${Array.isArray(data)}, length: ${data?.length || 0}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate the visualization
    const visualization = await generateDataVisualization(data, type);
    
    // Return the visualization result
    return new NextResponse(JSON.stringify({
      data,
      visualization: type === 'auto' ? visualization.type : type,
      title,
      description: description || '',
      artifactId: visualization.id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Visualization API error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to create visualization',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 