import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';

// GET /api/alerts - Get all alerts for the current user
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
      // Get specific alert with recipients
      const { data: alert, error: alertError } = await supabase
        .from('Alert')
        .select('*')
        .eq('id', id)
        .eq('userId', session.user.id)
        .single();
      
      if (alertError) throw alertError;
      
      // Fetch recipients for this alert
      const { data: recipients, error: recipientsError } = await supabase
        .from('AlertRecipient')
        .select('*')
        .eq('alertId', id);
      
      if (recipientsError) throw recipientsError;
      
      // Fetch history for this alert
      const { data: history, error: historyError } = await supabase
        .from('AlertHistory')
        .select('*')
        .eq('alertId', id)
        .order('triggeredAt', { ascending: false })
        .limit(5);
      
      if (historyError) throw historyError;
      
      // Format the response
      const formattedAlert = {
        ...alert,
        customFrequency: alert.customFrequency,
        isActive: alert.isActive,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        lastTriggeredAt: alert.lastTriggeredAt,
        recipients: recipients || [],
        history: history || []
      };
      
      return NextResponse.json(formattedAlert);
    } else {
      // Get all alerts
      const { data, error } = await supabase
        .from('Alert')
        .select('*')
        .eq('userId', session.user.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      // Get recipient counts for all alerts
      const alertIds = data.map(alert => alert.id);
      
      // If there are no alerts, return an empty array
      if (alertIds.length === 0) {
        return NextResponse.json([]);
      }
      
      // Fetch recipient counts for each alert
      const recipientCounts: Record<string, number> = {};
      
      // Process each alert individually to count recipients
      for (const alertId of alertIds) {
        const { count, error: countError } = await supabase
          .from('AlertRecipient')
          .select('*', { count: 'exact', head: true })
          .eq('alertId', alertId);
        
        if (countError) {
          console.error(`Error counting recipients for alert ${alertId}:`, countError);
          recipientCounts[alertId] = 0;
        } else {
          recipientCounts[alertId] = count || 0;
        }
      }
      
      // Format the response with recipient counts
      const formattedAlerts = data.map(alert => ({
        ...alert,
        customFrequency: alert.customFrequency,
        isActive: alert.isActive,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        lastTriggeredAt: alert.lastTriggeredAt,
        recipientCount: recipientCounts[alert.id] || 0
      }));
      
      return NextResponse.json(formattedAlerts);
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/alerts - Create or update an alert
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { id, title, description, type, condition, frequency, customFrequency, isActive, recipients } = data;
    
    // Validate required fields
    if (!title || !type || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    let alertId = id;
    
    // Create or update the alert
    if (alertId) {
      // Update existing alert
      const { error } = await supabase
        .from('Alert')
        .update({
          title,
          description,
          type,
          condition,
          frequency,
          customFrequency,
          isActive,
          updatedAt: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('userId', session.user.id);
      
      if (error) throw error;
    } else {
      // Create new alert
      const { data: alertData, error } = await supabase
        .from('Alert')
        .insert({
          title,
          description,
          type,
          condition,
          frequency,
          customFrequency,
          isActive,
          userId: session.user.id
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      alertId = alertData.id;
    }
    
    // Handle recipients if provided
    if (recipients && recipients.length > 0) {
      // First, delete existing recipients
      const { error: deleteError } = await supabase
        .from('AlertRecipient')
        .delete()
        .eq('alertId', alertId);
      
      if (deleteError) throw deleteError;
      
      // Then insert new recipients
      const recipientsToInsert = recipients.map((recipient: any) => ({
        alertId,
        email: recipient.email,
        notifyBy: recipient.notifyBy || 'email'
      }));
      
      const { error: insertError } = await supabase
        .from('AlertRecipient')
        .insert(recipientsToInsert);
      
      if (insertError) throw insertError;
    }
    
    return NextResponse.json({ id: alertId, success: true });
  } catch (error) {
    console.error('Error creating/updating alert:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/alerts?id=<alert_id> - Delete an alert
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
  }
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Delete the alert (cascade will handle related records)
    const { error } = await supabase
      .from('Alert')
      .delete()
      .eq('id', id)
      .eq('userId', session.user.id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
