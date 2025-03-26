import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';

// GET /api/reports - Get all reports for the current user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // If an ID is provided, fetch a specific report
    if (id) {
      // Fetch the report data
      const { data: report, error: reportError } = await supabase
        .from('Report')
        .select('*')
        .eq('id', id)
        .eq('userId', session.user.id)
        .single();
      
      if (reportError) {
        console.error('Error fetching report:', reportError);
        return NextResponse.json({ error: 'Failed to fetch report details' }, { status: 500 });
      }
      
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      
      // Initialize the formatted response
      const formattedReport = {
        ...report
      };
      
      // Fetch recipients count for this report
      try {
        const { count, error: recipientsCountError } = await supabase
          .from('ReportRecipient')
          .select('id', { count: 'exact', head: true })
          .eq('reportId', report.id);
        
        if (!recipientsCountError) {
          formattedReport.recipientCount = count || 0;
        }
      } catch (error) {
        console.log('Error fetching recipients count:', error);
        // Continue without count
      }
      
      return NextResponse.json(formattedReport);
    }
    
    // Otherwise, fetch all reports for the user
    const { data: reports, error } = await supabase
      .from('Report')
      .select('*')
      .eq('userId', session.user.id)
      .order('updatedAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
    
    // For each report, get the recipient count
    const reportsWithRecipientCounts = await Promise.all(
      reports.map(async (report) => {
        try {
          const { count, error: recipientsCountError } = await supabase
            .from('ReportRecipient')
            .select('id', { count: 'exact', head: true })
            .eq('reportId', report.id);
          
          return {
            ...report,
            recipientCount: !recipientsCountError ? count || 0 : 0
          };
        } catch (error) {
          console.log('Error fetching recipients count for report:', report.id, error);
          return {
            ...report,
            recipientCount: 0
          };
        }
      })
    );
    
    return NextResponse.json(reportsWithRecipientCounts);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/reports - Create or update a report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const reportData = await request.json();
    
    // Add user ID to the report data
    reportData.userId = session.user.id;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // If updating an existing report
    if (reportData.id) {
      const { data: updatedReport, error } = await supabase
        .from('Report')
        .update({
          ...reportData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', reportData.id)
        .eq('userId', session.user.id) // Security check
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Error updating report' }, { status: 500 });
      }
      
      return NextResponse.json(updatedReport);
    }
    
    // If creating a new report
    const { data: newReport, error } = await supabase
      .from('Report')
      .insert({
        ...reportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: 'Error creating report' }, { status: 500 });
    }
    
    return NextResponse.json(newReport);
  } catch (error) {
    console.error('Error in reports POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reports?id=<report_id> - Delete a report
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if the report exists and belongs to the user
    const { data: report, error: fetchError } = await supabase
      .from('Report')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single();
    
    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }
    
    // First delete all recipients associated with this report
    const { error: deleteRecipientsError } = await supabase
      .from('ReportRecipient')
      .delete()
      .eq('reportId', id);
      
    if (deleteRecipientsError) {
      console.error('Error deleting report recipients:', deleteRecipientsError);
      // Continue with deletion anyway
    }
    
    // Delete any report history associated with this report
    const { error: deleteHistoryError } = await supabase
      .from('ReportHistory')
      .delete()
      .eq('reportId', id);
      
    if (deleteHistoryError) {
      console.error('Error deleting report history:', deleteHistoryError);
      // Continue with deletion anyway
    }
    
    // Finally delete the report
    const { error: deleteError } = await supabase
      .from('Report')
      .delete()
      .eq('id', id)
      .eq('userId', session.user.id);
    
    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in reports DELETE route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
