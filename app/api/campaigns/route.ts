import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createClient } from '@/utils/supabase/server';

// GET /api/campaigns - Get all campaigns for the current user
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
    
    // If an ID is provided, fetch a specific campaign
    if (id) {
      // Fetch the campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('Campaign')
        .select('*')
        .eq('id', id)
        .eq('userId', session.user.id)
        .single();
      
      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
        return NextResponse.json({ error: 'Failed to fetch campaign details' }, { status: 500 });
      }
      
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      
      // Initialize the formatted response
      const formattedCampaign = {
        ...campaign,
        segments: [],
        offers: []
      };
      
      // If there's a selectedSegmentId, fetch that segment
      if (campaign.selectedSegmentId) {
        try {
          const { data: segment, error: segmentError } = await supabase
            .from('CustomerSegment')
            .select('id, name, customerCount')
            .eq('id', campaign.selectedSegmentId)
            .single();
          
          if (!segmentError && segment) {
            formattedCampaign.segments = [segment];
          }
        } catch (error) {
          console.log('Error fetching segment:', error);
          // Continue without segment
        }
      }
      
      // If there are selectedOfferIds, fetch those offers
      if (campaign.selectedOfferIds && campaign.selectedOfferIds.length > 0) {
        try {
          const { data: offers, error: offersError } = await supabase
            .from('Offer')
            .select('id, name, description, discount')
            .in('id', campaign.selectedOfferIds);
          
          if (!offersError && offers) {
            formattedCampaign.offers = offers;
          }
        } catch (error) {
          console.log('Error fetching offers:', error);
          // Continue without offers
        }
      }
      
      return NextResponse.json(formattedCampaign);
    }
    
    // Otherwise, fetch all campaigns for the user
    const { data: campaigns, error } = await supabase
      .from('Campaign')
      .select('*')
      .eq('userId', session.user.id)
      .order('updatedAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST /api/campaigns - Create or update a campaign
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const campaignData = await request.json();
    
    // Add user ID to the campaign data
    campaignData.userId = session.user.id;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // If updating an existing campaign
    if (campaignData.id) {
      const { data: updatedCampaign, error } = await supabase
        .from('Campaign')
        .update({
          ...campaignData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', campaignData.id)
        .eq('userId', session.user.id) // Security check
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: 'Error updating campaign' }, { status: 500 });
      }
      
      return NextResponse.json(updatedCampaign);
    }
    
    // If creating a new campaign
    const { data: newCampaign, error } = await supabase
      .from('Campaign')
      .insert({
        ...campaignData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json({ error: 'Error creating campaign' }, { status: 500 });
    }
    
    return NextResponse.json(newCampaign);
  } catch (error) {
    console.error('Error in campaigns POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campaigns?id=<campaign_id> - Delete a campaign
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if the campaign exists and belongs to the user
    const { data: campaign, error: fetchError } = await supabase
      .from('Campaign')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single();
    
    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found or unauthorized' }, { status: 404 });
    }
    
    // Delete the campaign
    const { error: deleteError } = await supabase
      .from('Campaign')
      .delete()
      .eq('id', id)
      .eq('userId', session.user.id);
    
    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      return NextResponse.json({ error: 'Error deleting campaign' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in campaigns DELETE route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
