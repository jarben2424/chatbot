import { auth } from '@/app/(auth)/auth';

// Rate limits
const FREE_DAILY_LIMIT = 10;
const PAID_DAILY_LIMIT = 100; // Higher limit for paid accounts

// In-memory store for rate limiting (resets on server restart)
// In production, use a persistent store like Redis, database, or localStorage
const usageStore: Record<string, number> = {};

export async function checkRateLimit(): Promise<{
  allowed: boolean;
  remaining: number;
  total: number;
}> {
  const session = await auth();
  
  // If no session, allow the request (for demo purposes)
  if (!session?.user) {
    return { allowed: true, remaining: 10, total: FREE_DAILY_LIMIT };
  }
  
  const email = session.user.email || '';
  const userId = session.user.id;
  
  // Check if user has a paid account
  const isPaid = email.endsWith('@hang.com');
  
  const limit = isPaid ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `${userId}:${today}`;
  
  // Get current count
  const count = usageStore[key] || 0;
  
  // Check if over limit
  if (count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      total: limit 
    };
  }
  
  // Increment count
  usageStore[key] = count + 1;
  
  return { 
    allowed: true, 
    remaining: limit - (count + 1),
    total: limit
  };
}

// For debugging - get current usage for a user
export function getCurrentUsage(userId: string): number {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  return usageStore[key] || 0;
} 