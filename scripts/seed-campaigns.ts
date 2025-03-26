import { db } from '../lib/db';
import { campaign } from '../lib/db/campaign-schema';

async function seedCampaigns() {
  // Create sample campaigns
  const sampleCampaigns = [
    {
      userId: '550e8400-e29b-41d4-a716-446655440000', // Replace with a valid user ID from your system
      name: 'Spring Sale Personalized Offers',
      campaignType: 'personalized-segment',
      status: 'active',
      selectedOfferIds: ['offer1', 'offer2'],
      useAiSegment: true,
      aiSegmentPrompt: 'Customers who purchased in the last 3 months and like outdoor products',
      audienceSize: 2450,
      matchingComplete: true,
      matchCount: 1850,
      integrationType: 'klaviyo',
      integrationSettings: { listId: 'abc123' }
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440000', // Replace with a valid user ID
      name: 'New Customer Welcome Series',
      campaignType: 'welcome-series',
      status: 'draft',
      selectedOfferIds: ['offer3'],
      useAiSegment: false,
      selectedSegmentId: '7c0d7850-7b1a-4d80-b45c-b68cfae3ef9d',
      audienceSize: 1280,
      matchingComplete: false,
      integrationType: null,
      integrationSettings: {}
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440000', // Replace with a valid user ID
      name: 'Summer Collection Preview',
      campaignType: 'personalized-segment',
      status: 'draft',
      selectedOfferIds: ['offer4', 'offer5', 'offer6'],
      useAiSegment: true,
      aiSegmentPrompt: 'High-value customers who spent over $200 in the last 6 months',
      audienceSize: 875,
      matchingComplete: false,
      integrationType: null,
      integrationSettings: {}
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440000', // Replace with a valid user ID
      name: 'Holiday Promotion 2024',
      campaignType: 'recurring-engagement',
      status: 'completed',
      selectedOfferIds: ['offer7', 'offer8'],
      useAiSegment: false,
      selectedSegmentId: '9e8d7c6b-5a4b-3c2d-1e0f-9a8b7c6d5e4f',
      audienceSize: 5200,
      matchingComplete: true,
      matchCount: 4800,
      integrationType: 'export',
      integrationSettings: { format: 'csv' }
    },
    {
      userId: '550e8400-e29b-41d4-a716-446655440000', // Replace with a valid user ID
      name: 'Win-back Inactive Customers',
      campaignType: 'win-back',
      status: 'active',
      selectedOfferIds: ['offer9'],
      useAiSegment: true,
      aiSegmentPrompt: 'Customers who haven\'t purchased in the last 6 months but were previously active',
      audienceSize: 3200,
      matchingComplete: true,
      matchCount: 2950,
      integrationType: 'klaviyo',
      integrationSettings: { listId: 'def456' }
    }
  ];

  try {
    // Clear existing campaigns (optional, remove this in production)
    // await db.delete(campaign);
    
    // Insert sample campaigns
    for (const campaignData of sampleCampaigns) {
      await db.insert(campaign).values(campaignData);
    }
    
    console.log('Successfully seeded campaigns');
  } catch (error) {
    console.error('Error seeding campaigns:', error);
  } finally {
    // Close database connection
    process.exit();
  }
}

// Run the seed function
seedCampaigns();
