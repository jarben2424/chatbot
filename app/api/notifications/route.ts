import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';

// DELETE /api/notifications?id=<notification_id> - Route deletion to appropriate endpoint
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // First check if it's a report
    const { data: report } = await supabase
      .from('Report')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .maybeSingle();
    
    if (report) {
      // It's a report, forward to the reports API
      const reportResponse = await fetch(`${new URL(request.url).origin}/api/reports?id=${id}`, {
        method: 'DELETE',
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
      
      if (!reportResponse.ok) {
        throw new Error(`Failed to delete report: ${reportResponse.statusText}`);
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Check if it's an alert
    const { data: alert } = await supabase
      .from('Alert')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .maybeSingle();
    
    if (alert) {
      // It's an alert, forward to the alerts API
      const alertResponse = await fetch(`${new URL(request.url).origin}/api/alerts?id=${id}`, {
        method: 'DELETE',
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
      
      if (!alertResponse.ok) {
        throw new Error(`Failed to delete alert: ${alertResponse.statusText}`);
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Not found in either reports or alerts
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in notifications DELETE route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/notifications - Get combined reports and alerts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get reports
    const reportsResponse = await fetch(`${new URL(request.url).origin}/api/reports`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!reportsResponse.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    const reports = await reportsResponse.json();
    
    // Get alerts
    const alertsResponse = await fetch(`${new URL(request.url).origin}/api/alerts`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!alertsResponse.ok) {
      throw new Error('Failed to fetch alerts');
    }
    
    const alerts = await alertsResponse.json();
    
    // Combine and return
    return NextResponse.json([...reports, ...alerts]);
  } catch (error) {
    console.error('Error in notifications GET route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
