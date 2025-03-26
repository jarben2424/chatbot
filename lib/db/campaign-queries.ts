import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaign, type Campaign, type NewCampaign } from './campaign-schema';

// Save a new campaign or update an existing one
export async function saveCampaign(campaignData: NewCampaign): Promise<Campaign> {
  if (campaignData.id) {
    // Update existing campaign
    await db.update(campaign)
      .set({
        ...campaignData,
        updatedAt: new Date()
      })
      .where(eq(campaign.id, campaignData.id as string));
    
    // Fetch and return the updated campaign
    const result = await db.select().from(campaign).where(eq(campaign.id, campaignData.id as string));
    return result[0];
  } else {
    // Insert new campaign
    const result = await db.insert(campaign).values(campaignData).returning();
    return result[0];
  }
}

// Get a campaign by ID
export async function getCampaignById(id: string): Promise<Campaign | null> {
  const result = await db.select().from(campaign).where(eq(campaign.id, id));
  return result[0] || null;
}

// Get all campaigns for a user
export async function getCampaignsByUserId(userId: string): Promise<Campaign[]> {
  return db.select().from(campaign).where(eq(campaign.userId, userId));
}

// Delete a campaign
export async function deleteCampaign(id: string): Promise<void> {
  await db.delete(campaign).where(eq(campaign.id, id));
}
