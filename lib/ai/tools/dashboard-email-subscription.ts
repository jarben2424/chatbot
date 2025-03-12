import { tool } from 'ai';
import { z } from 'zod';

// Define types for email subscription settings
export type EmailCadence = 'daily' | 'weekly' | 'monthly';

export interface DashboardEmailSubscription {
  id: string;
  name: string;
  dashboardQueryIds: string[];
  recipients: string[];
  cadence: EmailCadence;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardEmailPreview {
  subject: string;
  body: string;
  visualizations: {
    queryId: string;
    title: string;
    visualizationType: string;
    data: any[];
  }[];
}

/**
 * Dashboard email subscription tool
 * Allows users to subscribe to automated email updates for dashboard metrics
 */
export const dashboardEmailSubscription = tool({
  description: 'Manage email subscriptions for dashboard metrics',
  parameters: z.object({
    action: z.enum(['create', 'update', 'delete', 'list', 'preview']).describe('The action to perform'),
    subscription: z.object({
      id: z.string().optional().describe('The ID of the subscription (required for update and delete)'),
      name: z.string().optional().describe('A name for the subscription'),
      dashboardQueryIds: z.array(z.string()).optional().describe('Array of dashboard query IDs to include'),
      recipients: z.array(z.string().email()).optional().describe('Array of email addresses to send to'),
      cadence: z.enum(['daily', 'weekly', 'monthly']).optional().describe('How often to send the emails'),
      active: z.boolean().optional().describe('Whether the subscription is active'),
    }).optional().describe('The subscription data (required for create and update)'),
  }),
  execute: async ({ action, subscription }) => {
    // In a real implementation, this would connect to a database
    // For now, we'll just use localStorage (on client) or a mock (on server)
    
    try {
      switch (action) {
        case 'create':
          if (!subscription?.name || !subscription?.dashboardQueryIds || !subscription?.recipients || !subscription?.cadence) {
            throw new Error('Missing required subscription fields');
          }
          
          return {
            success: true,
            message: 'Subscription created successfully',
            subscription: {
              id: `sub_${Math.random().toString(36).substring(2, 11)}`,
              name: subscription.name,
              dashboardQueryIds: subscription.dashboardQueryIds,
              recipients: subscription.recipients,
              cadence: subscription.cadence,
              active: subscription.active ?? true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
          
        case 'update':
          if (!subscription?.id) {
            throw new Error('Subscription ID is required for updates');
          }
          
          return {
            success: true,
            message: 'Subscription updated successfully',
            subscription: {
              ...subscription,
              updatedAt: new Date().toISOString(),
            },
          };
          
        case 'delete':
          if (!subscription?.id) {
            throw new Error('Subscription ID is required for deletion');
          }
          
          return {
            success: true,
            message: 'Subscription deleted successfully',
            id: subscription.id,
          };
          
        case 'list':
          // In a real implementation, this would fetch from the database
          return {
            success: true,
            subscriptions: [] as DashboardEmailSubscription[], // Mock empty array for now
          };
          
        case 'preview':
          if (!subscription?.dashboardQueryIds || subscription.dashboardQueryIds.length === 0) {
            throw new Error('At least one dashboard query must be selected for preview');
          }
          
          // Generate a mock email preview
          return {
            success: true,
            preview: {
              subject: `Dashboard Update: ${subscription.name || 'Your Metrics'}`,
              body: `Here are your dashboard metrics as of ${new Date().toLocaleDateString()}`,
              visualizations: subscription.dashboardQueryIds.map(id => ({
                queryId: id,
                title: 'Sample Metric',
                visualizationType: 'highlight',
                data: [{ value: 123.45 }],
              })),
            },
          };
          
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
