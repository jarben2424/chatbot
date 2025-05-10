import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const email = session.user.email || '';
    const isPaid = email.endsWith('@hang.com');
    
    // Simple default values for now
    return new NextResponse(JSON.stringify({
      allowed: true,
      remaining: isPaid ? 95 : 9,
      total: isPaid ? 100 : 10,
      isPaid,
      currentUsage: isPaid ? 5 : 1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Rate limit API error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to check rate limit',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 