import { InferModel } from 'drizzle-orm';
import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  foreignKey,
  jsonb
} from 'drizzle-orm/pg-core';

// Campaign table definition
export const campaign = pgTable('Campaign', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
  name: text('name').notNull(),
  campaignType: text('campaignType').notNull(),
  status: text('status').default('draft').notNull(),
  
  // Step 2: Offers selection
  selectedOfferIds: text('selectedOfferIds').array(),
  
  // Step 3: Segment selection
  useAiSegment: boolean('useAiSegment').default(false),
  selectedSegmentId: uuid('selectedSegmentId'),
  aiSegmentPrompt: text('aiSegmentPrompt'),
  audienceSize: integer('audienceSize'),
  
  // Step 4: Matching details
  matchingComplete: boolean('matchingComplete').default(false),
  matchCount: integer('matchCount').default(0),
  
  // Step 5: Integration options
  integrationType: text('integrationType'),
  integrationSettings: jsonb('integrationSettings').default({})
});

// Create types based on the schema
export type Campaign = InferModel<typeof campaign>;
export type NewCampaign = InferModel<typeof campaign, 'insert'>;
