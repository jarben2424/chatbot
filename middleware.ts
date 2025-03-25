import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // For campaign creation pages, we just let them go through normally
  // The route groups (no-sidebar) will handle this without requiring a redirect
  // Route groups with parentheses do not affect the URL structure in Next.js
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  await supabase.auth.getSession()
  return res
}
