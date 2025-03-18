import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';
import { UserDashboardMetric } from '@/lib/user-dashboard-metrics';

// GET handler to retrieve user dashboard metrics
export async function GET(req: NextRequest) {
  try {
    console.log('User dashboard metrics GET: Getting authentication session...');
    const session = await auth();

    // Use the same check pattern as the chat route
    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated user found for GET user dashboard metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get metrics for the current user
    const { data: userMetrics, error: userMetricsError } = await supabase
      .from('UserDashboardMetrics')
      .select(`
        id,
        sourcetype,
        sourceid,
        displayorder,
        isactive,
        customtitle,
        customdescription,
        customvisualizationtype,
        parameters,
        createdat,
        updatedat
      `)
      .eq('userid', session.user.id)
      .eq('isactive', true)
      .order('displayorder', { ascending: true });
    
    if (userMetricsError) {
      console.error('Error fetching user dashboard metrics:', userMetricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }
    
    if (!userMetrics || userMetrics.length === 0) {
      return NextResponse.json([]);
    }
    
    // Process each metric to fetch the actual query from the source
    const processedMetrics = [];
    
    for (const metric of userMetrics) {
      try {
        if (metric.sourcetype === 'dashboard_metric') {
          // Fetch from DashboardMetrics
          const { data, error } = await supabase
            .from('DashboardMetrics')
            .select('id, title, description, querytemplate, visualizationtype')
            .eq('id', metric.sourceid)
            .single();

          if (error || !data) {
            console.error('Error fetching dashboard metric:', error);
            continue;
          }

          // Process parameters if any
          let sqlQuery = data.querytemplate;
          if (metric.parameters && Object.keys(metric.parameters).length > 0) {
            // Simple parameter replacement
            for (const [key, value] of Object.entries(metric.parameters)) {
              sqlQuery = sqlQuery.replace(`{{${key}}}`, String(value));
            }
          }

          processedMetrics.push({
            id: metric.id,
            userId: session.user.id,
            title: metric.customtitle || data.title,
            description: metric.customdescription || data.description,
            sqlQuery,
            visualizationType: (metric.customvisualizationtype || data.visualizationtype),
            displayOrder: metric.displayorder,
            isActive: metric.isactive,
            createdAt: metric.createdat,
            updatedAt: metric.updatedat
          });
        } else if (metric.sourcetype === 'chat_generated_metric') {
          // Fetch from ChatGeneratedMetrics
          const { data, error } = await supabase
            .from('ChatGeneratedMetrics')
            .select('id, title, description, question, sqlquery, visualizationtype')
            .eq('id', metric.sourceid)
            .single();

          if (error || !data) {
            console.error('Error fetching chat generated metric:', error);
            continue;
          }

          processedMetrics.push({
            id: metric.id,
            userId: session.user.id,
            title: metric.customtitle || data.title,
            description: metric.customdescription || data.description,
            question: data.question,
            sqlQuery: data.sqlquery,
            visualizationType: (metric.customvisualizationtype || data.visualizationtype),
            displayOrder: metric.displayorder,
            isActive: metric.isactive,
            createdAt: metric.createdat,
            updatedAt: metric.updatedat
          });
        }
      } catch (error) {
        console.error('Error processing dashboard metric:', error);
      }
    }
    
    return NextResponse.json(processedMetrics);
  } catch (error) {
    console.error('Error in user dashboard metrics GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to add a metric to the dashboard
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      sourceType, 
      sourceId, 
      customTitle, 
      customDescription, 
      customVisualizationType,
      parameters = {}
    } = body;
    
    console.log('Received request to add metric to dashboard:', {
      sourceType,
      sourceId: sourceId.substring(0, 8) + '...' // Show part of ID for logging
    });
    
    // Validate required fields
    if (!sourceType || !sourceId) {
      console.warn('Missing required fields in add metric request');
      return NextResponse.json(
        { error: 'Missing required fields: sourceType and sourceId are required' },
        { status: 400 }
      );
    }
    
    // Validate sourceType
    if (sourceType !== 'dashboard_metric' && sourceType !== 'chat_generated_metric') {
      return NextResponse.json(
        { error: 'Invalid sourceType. Must be "dashboard_metric" or "chat_generated_metric"' },
        { status: 400 }
      );
    }
    
    console.log('User dashboard metrics POST: Getting authentication session...');
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated user found for POST user dashboard metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get current highest order value to place new metric at the end
    const { data: existingMetrics, error: queryError } = await supabase
      .from('UserDashboardMetrics')
      .select('displayorder')
      .eq('userid', session.user.id)
      .eq('isactive', true)
      .order('displayorder', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Error querying existing metrics:', queryError);
      return NextResponse.json(
        { error: 'Failed to determine display order' },
        { status: 500 }
      );
    }

    const highestOrder = existingMetrics && existingMetrics.length > 0 
      ? existingMetrics[0].displayorder + 1 
      : 0;

    const now = new Date().toISOString();
    
    console.log(`Adding metric to dashboard with display order ${highestOrder}`);
    
    // Insert the new metric
    const { data, error } = await supabase
      .from('UserDashboardMetrics')
      .insert({
        userid: session.user.id,
        sourcetype: sourceType,
        sourceid: sourceId,
        displayorder: highestOrder,
        isactive: true,
        customtitle: customTitle,
        customdescription: customDescription,
        customvisualizationtype: customVisualizationType,
        parameters,
        createdat: now,
        updatedat: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding metric to dashboard:', error);
      return NextResponse.json(
        { error: 'Failed to add metric to dashboard' },
        { status: 500 }
      );
    }
    
    console.log('Successfully added metric to dashboard with ID:', data.id);
    return NextResponse.json({ success: true, metricId: data.id });
  } catch (error) {
    console.error('Error in user dashboard metrics POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler to update metrics order
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, newOrder } = body;
    
    if (!id || typeof newOrder !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('User dashboard metrics PATCH: Getting authentication session...');
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated user found for PATCH user dashboard metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Update the metric order in the database
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({ displayorder: newOrder, updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', session.user.id);

    if (error) {
      console.error('Error updating metric order:', error);
      return NextResponse.json(
        { error: 'Failed to update metric order' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user dashboard metrics PATCH route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler to soft delete a metric
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required id parameter' },
        { status: 400 }
      );
    }
    
    console.log('User dashboard metrics DELETE: Getting authentication session...');
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated user found for DELETE user dashboard metrics');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Authenticated user ID:', session.user.id);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Soft delete the metric by setting isActive to false
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({
        isactive: false,
        updatedat: new Date().toISOString()
      })
      .eq('id', id)
      .eq('userid', session.user.id);

    if (error) {
      console.error('Error deleting dashboard metric:', error);
      return NextResponse.json(
        { error: 'Failed to delete metric' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user dashboard metrics DELETE route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
