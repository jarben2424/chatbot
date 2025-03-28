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
    
    if (id) {
      // Get specific report with recipients
      const { data: report, error: reportError } = await supabase
        .from('Report')
        .select('*')
        .eq('id', id)
        .eq('userId', session.user.id)
        .single();
      
      if (reportError) throw reportError;
      
      // Fetch recipients for this report
      const { data: recipients, error: recipientsError } = await supabase
        .from('ReportRecipient')
        .select('*')
        .eq('reportId', id);
      
      if (recipientsError) throw recipientsError;
      
      // Format the response
      const formattedReport = {
        ...report,
        customSchedule: report.customSchedule,
        isActive: report.isActive,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        lastSentAt: report.lastSentAt,
        recipients: recipients || []
      };
      
      return NextResponse.json(formattedReport);
    } else {
      // Get all reports
      const { data, error } = await supabase
        .from('Report')
        .select('*')
        .eq('userId', session.user.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      // Get recipient counts for all reports
      const reportIds = data.map(report => report.id);
      
      // If there are no reports, return an empty array
      if (reportIds.length === 0) {
        return NextResponse.json([]);
      }
      
      // Fetch recipient counts for each report
      const recipientCounts: Record<string, number> = {};
      
      // Process each report individually to count recipients
      for (const reportId of reportIds) {
        const { count, error: countError } = await supabase
          .from('ReportRecipient')
          .select('*', { count: 'exact', head: true })
          .eq('reportId', reportId);
        
        if (countError) {
          console.error(`Error counting recipients for report ${reportId}:`, countError);
          recipientCounts[reportId] = 0;
        } else {
          recipientCounts[reportId] = count || 0;
        }
      }
      
      // Format the response with recipient counts
      const formattedReports = data.map(report => ({
        ...report,
        customSchedule: report.customSchedule,
        isActive: report.isActive,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        lastSentAt: report.lastSentAt,
        recipientCount: recipientCounts[report.id] || 0
      }));
      
      return NextResponse.json(formattedReports);
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/reports - Create or update a report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const json = await request.json();
    
    // Required fields
    if (!json.title || !json.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Extract report data from request
    const {
      title,
      description = '',
      type,
      content = {},
      schedule = 'weekly',
      customSchedule = '',
      recipients = [],
      isActive = true
    } = json;
    
    // Create or update the report
    let reportId = json.id;
    
    // Create Supabase client
    const supabase = await createClient();
    
    if (reportId) {
      // Update existing report
      const { data, error } = await supabase
        .from('Report')
        .update({
          title,
          description,
          type,
          content,
          schedule,
          customSchedule,
          isActive,
          updatedAt: new Date().toISOString()
        })
        .eq('id', reportId)
        .eq('userId', session.user.id)
        .select()
        .single();
      
      if (error) throw error;
      reportId = data.id;
      
      // Handle recipients update separately
      if (recipients.length > 0) {
        // For simplicity, we're replacing all recipients
        // In a real app, you might want to handle adds and removals separately
        await supabase
          .from('ReportRecipient')
          .delete()
          .eq('reportId', reportId);
        
        // Add new recipients
        const recipientData = recipients.map((recipient: any) => ({
          reportId: reportId,
          email: recipient.email,
          name: recipient.name || null
        }));
        
        if (recipientData.length > 0) {
          const { error } = await supabase
            .from('ReportRecipient')
            .insert(recipientData);
          
          if (error) throw error;
        }
      }
    } else {
      // Create new report
      const { data, error } = await supabase
        .from('Report')
        .insert({
          title,
          description,
          type,
          content,
          schedule,
          customSchedule,
          isActive,
          userId: session.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      reportId = data.id;
      
      // Add recipients
      if (recipients.length > 0) {
        const recipientData = recipients.map((recipient: any) => ({
          reportId: reportId,
          email: recipient.email,
          name: recipient.name || null
        }));
        
        const { error } = await supabase
          .from('ReportRecipient')
          .insert(recipientData);
        
        if (error) throw error;
      }
    }
    
    return NextResponse.json({ id: reportId });
  } catch (error) {
    console.error('Error creating/updating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
