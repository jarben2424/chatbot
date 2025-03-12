import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function middleware(request: Request) {
  const session = await auth()
  
  // Authentication check for API routes
  if (request.url.includes('/api/')) {
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    return NextResponse.next()
  }
  
  // Auth protection for app routes
  if (!session?.user &&
      !request.url.includes('/login') &&
      !request.url.includes('/_next') &&
      !request.url.includes('/favicon.ico')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/chat/:path*',
    '/dashboard/:path*', 
    '/documents/:path*',
    '/visualizations/:path*',
    '/settings/:path*'
  ]
}
