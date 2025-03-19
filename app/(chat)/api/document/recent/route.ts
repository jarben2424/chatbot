import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getRecentDocuments } from '@/lib/db/queries';

/**
 * GET /api/document/recent
 * 
 * Fetches the most recent documents created by the current user
 * Supports optional query params:
 * - limit: number of documents to return (default: 5)
 * - kind: filter by document kind (default: all)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const kind = searchParams.get('kind') || undefined;
    
    console.log(`Fetching recent documents - userId: ${session.user.id}, limit: ${limit}, kind: ${kind || 'all'}`);
    
    // Get recent documents using the function that now uses Supabase
    const recentDocuments = await getRecentDocuments({ 
      userId: session.user.id,
      limit,
      kind: kind || undefined
    });
    
    // Return the results
    return new NextResponse(JSON.stringify(recentDocuments), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching recent documents:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 