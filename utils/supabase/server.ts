import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Use this for components and API routes
export const createClient = async () => {
  try {
    const cookieStore = cookies()
    
    if (!cookieStore) {
      console.warn('Cookie store not available, using direct Supabase client')
      return createDirectClient()
    }
    
    return createServerComponentClient({
      cookies: () => cookieStore
    })
  } catch (error) {
    console.error('Error creating Supabase client with cookies:', error)
    return createDirectClient()
  }
}

// Fallback to using direct Supabase client if cookies are not available
const createDirectClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    }
  })
}