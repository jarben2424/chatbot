import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(req: NextRequest) {
  console.log('Auth check API called');
  
  try {
    console.log('Checking authentication using auth()...');
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      console.log('No authenticated session found in auth check');
      return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('Authentication successful for user ID:', session.user.id);
    
    // Return basic user info
    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email
    });
  } catch (error) {
    console.error('Error in auth check:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Error checking authentication' },
      { status: 500 }
    );
  }
} 