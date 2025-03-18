import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UserDashboardMetric } from '@/lib/user-dashboard-metrics';

// GET handler to retrieve user dashboard metrics
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, return empty array
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get metrics for the current user
    const { data, error } = await supabase
      .from('UserDashboardMetrics')
      .select('*')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('displayOrder', { ascending: true });
    
    if (error) {
      console.error('Error fetching user dashboard metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard metrics' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in dashboard metrics GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new user dashboard metric
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, question, sqlQuery, visualizationType } = body;
    
    if (!title || !sqlQuery) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, return error
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get current highest order value to place new metric at the end
    const { data: existingMetrics, error: queryError } = await supabase
      .from('UserDashboardMetrics')
      .select('displayOrder')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('displayOrder', { ascending: false })
      .limit(1);
    
    if (queryError) {
      console.error('Error querying existing metrics:', queryError);
      return NextResponse.json(
        { error: 'Failed to prepare for new metric' },
        { status: 500 }
      );
    }
    
    const highestOrder = existingMetrics && existingMetrics.length > 0 
      ? existingMetrics[0].displayOrder + 1 
      : 0;
    
    const now = new Date().toISOString();
    
    // Insert the new dashboard metric
    const { data: newMetric, error } = await supabase
      .from('UserDashboardMetrics')
      .insert({
        userId: user.id,
        title,
        description: description || `Data for ${title}`,
        question,
        sqlQuery,
        visualizationType: visualizationType || 'highlight',
        displayOrder: highestOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user dashboard metric:', error);
      return NextResponse.json(
        { error: 'Failed to create dashboard metric' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newMetric);
  } catch (error) {
    console.error('Error in dashboard metrics POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler to update a user dashboard metric's order
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, displayOrder } = body;
    
    if (!id || displayOrder === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, return error
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Update the metric order
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({
        displayOrder,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('userId', user.id);
    
    if (error) {
      console.error('Error updating metric order:', error);
      return NextResponse.json(
        { error: 'Failed to update metric order' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in dashboard metrics PATCH route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a user dashboard metric (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const metricId = searchParams.get('id');
    
    if (!metricId) {
      return NextResponse.json(
        { error: 'Metric ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, return error
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Soft delete the metric by setting isActive to false
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', metricId)
      .eq('userId', user.id);
    
    if (error) {
      console.error('Error deleting dashboard metric:', error);
      return NextResponse.json(
        { error: 'Failed to delete dashboard metric' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in dashboard metrics DELETE route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
