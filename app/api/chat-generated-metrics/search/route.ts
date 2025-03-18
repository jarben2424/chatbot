import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';

// Helper to get authenticated user from either NextAuth or Supabase
async function getAuthenticatedUser() {
  console.log('Getting authenticated user for search endpoint...');
  
  // Try NextAuth first
  console.log('Checking NextAuth session...');
  const session = await auth();
  
  if (session && session.user) {
    console.log('NextAuth session found for user:', session.user.id);
    return {
      userId: session.user.id,
      email: session.user.email,
      provider: 'nextauth'
    };
  }
  
  console.log('No NextAuth session found, trying Supabase...');
  
  // If NextAuth fails, try Supabase directly
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Supabase auth error:', error.message);
    return null;
  }
  
  if (data && data.user) {
    console.log('Supabase session found for user:', data.user.id);
    return {
      userId: data.user.id,
      email: data.user.email,
      provider: 'supabase'
    };
  }
  
  console.log('No authenticated user found in either auth method');
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { sqlQuery } = await req.json();
    
    if (!sqlQuery) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }
    
    console.log('Chat-generated metrics search: Checking authentication');
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.warn('No authenticated user found for search metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID for search:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Look for user-owned metrics with the same query
    const { data: existingMetrics, error: searchError } = await supabase
      .from('ChatGeneratedMetrics')
      .select('id, title, description, category')
      .eq('sqlquery', sqlQuery)
      .eq('userid', session.user.id)
      .limit(1);
    
    if (searchError) {
      console.error('Error searching for existing metrics:', searchError);
      return NextResponse.json(
        { error: 'Failed to search for metrics' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      existingMetric: existingMetrics && existingMetrics.length > 0 ? existingMetrics[0] : null
    });
  } catch (error) {
    console.error('Error in chat generated metrics search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 