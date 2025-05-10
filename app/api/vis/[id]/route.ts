import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock visualization data
    const visualization = {
      id: params.id,
      title: "Visualization", 
      description: "Data visualization",
      type: "bar",
      data: [
        { month: "Jan", value: 1000 },
        { month: "Feb", value: 1200 },
        { month: "Mar", value: 900 },
        { month: "Apr", value: 1500 },
        { month: "May", value: 1800 },
        { month: "Jun", value: 1200 }
      ],
      createdAt: new Date()
    };

    return new NextResponse(JSON.stringify(visualization), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
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