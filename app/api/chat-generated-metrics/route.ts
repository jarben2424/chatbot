import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';

// GET handler to retrieve chat-generated metrics for the current user
export async function GET(req: NextRequest) {
  try {
    console.log('Chat-generated metrics GET: Checking authentication');
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.warn('No authenticated user found for GET chat generated metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get metrics for the authenticated user
    const { data, error } = await supabase
      .from('ChatGeneratedMetrics')
      .select('*')
      .eq('userid', session.user.id)
      .order('createdat', { ascending: false });
    
    if (error) {
      console.error('Error fetching chat generated metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in chat generated metrics GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new chat-generated metric
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      question, 
      sqlQuery, 
      conversationId,
      category,
      visualizationType,
      title: customTitle
    } = body;
    
    console.log('Received request to save chat generated metric:', {
      questionLength: question?.length,
      sqlQueryLength: sqlQuery?.length,
      hasConversationId: !!conversationId,
      category,
      visualizationType
    });
    
    if (!question || !sqlQuery) {
      console.warn('Missing required fields in chat generated metric request');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Use the exact same auth approach as the chat route
    console.log('Chat-generated metrics POST: Getting authentication session...');
    const session = await auth();

    // Use the same check pattern as the chat route
    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated user found for POST chat generated metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Generate a title from the question if not provided
    const title = customTitle || (question.length > 50 
      ? question.substring(0, 47) + '...' 
      : question);
    
    // Map the UI visualization type to a database-compatible visualization type
    const mapVisualizationType = (uiType: string): string => {
      switch (uiType) {
        case 'line-chart':
        case 'bar-chart':
          return 'chart';
        case 'highlight':
        case 'table':
          return uiType;
        default:
          return 'table'; // default fallback
      }
    };
    
    const dbVisualizationType = mapVisualizationType(visualizationType);
    
    console.log('Inserting chat generated metric for user ID:', session.user.id);
    console.log('Mapped visualization type from', visualizationType, 'to', dbVisualizationType);
    
    // Insert the new metric
    const { data, error } = await supabase
      .from('ChatGeneratedMetrics')
      .insert({
        userid: session.user.id,
        title,
        description: question,
        question,
        sqlquery: sqlQuery,
        visualizationtype: dbVisualizationType,
        category: category || 'general',
        conversationid: conversationId || null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to save chat generated metric:', error);
      return NextResponse.json(
        { error: `Failed to save metric: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Successfully saved chat generated metric with ID:', data.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat generated metrics POST route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 