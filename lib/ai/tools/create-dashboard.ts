import { tool } from 'ai';
import { z } from 'zod';

export const createDashboard = tool({
  description: 'Create an analytics dashboard with metrics and KPIs',
  parameters: z.object({
    title: z.string().describe('Title of the dashboard'),
    description: z.string().describe('Description of what this dashboard shows'),
    metrics: z.array(z.object({
      name: z.string().describe('Name of the metric (e.g., "Total Revenue")'),
      value: z.union([z.string(), z.number()]).describe('Current value of the metric'),
      change: z.string().optional().describe('Percentage change (e.g., "+12.3%")')
    })).describe('Array of metrics to display')
  }),
  execute: async (input) => {
    // Return the dashboard data directly
    return {
      type: 'dashboard',
      ...input
    };
  },
}); 