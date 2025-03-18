'use client'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
  console.log('Creating Supabase client with:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Has ANON KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: true,
        storageKey: 'sb-auth-token',
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null
            const value = window.localStorage.getItem(key)
            console.log('Auth storage getItem', { key, value: value ? 'exists' : 'null' })
            return value
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return
            console.log('Auth storage setItem', { key, value: value ? 'exists' : 'null' })
            window.localStorage.setItem(key, value)
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return
            console.log('Auth storage removeItem', { key })
            window.localStorage.removeItem(key)
          }
        }
      }
    }
  )
}

// Directly get the user ID for dashboard metrics
// Always returns a string ID or throws error
export const getDashboardUserId = async (): Promise<string> => {
  const supabase = createClient();
  
  try {
    // First try from cookies/session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      console.log('Found user ID from session:', session.user.id);
      return session.user.id;
    }
    
    // Then try directly getting the user
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      console.log('Found user ID from getUser:', user.id);
      return user.id;
    }
    
    throw new Error('No authenticated user found');
  } catch (error) {
    console.error('Error getting dashboard user ID:', error);
    throw error;
  }
};

// Test function to deliberately try all authentication methods
export const testClientAuth = async () => {
  const supabase = createClient()
  console.log('========= COMPREHENSIVE AUTH TEST =========')
  
  // 1. Direct check from localStorage
  console.log('1. Direct localStorage check:')
  const storageKey = 'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0] + '-auth-token'
  console.log('Storage key:', storageKey)
  let storedValue = null
  try {
    storedValue = localStorage.getItem(storageKey)
    console.log('Data found in storage:', !!storedValue)
    if (storedValue) {
      try {
        const parsedData = JSON.parse(storedValue)
        console.log('Stored auth data:', {
          expires_at: parsedData.expires_at,
          provider: parsedData.user?.app_metadata?.provider,
          email: parsedData.user?.email?.split('@')[0] + '@****'
        })
      } catch (e) {
        console.log('Error parsing stored data:', e)
      }
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e)
  }

  // 2. Get session method
  console.log('\n2. Via getSession:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('Session data:', !!session)
  console.log('Session user:', session?.user?.email, session?.user?.id)
  console.log('Session error:', sessionError ? sessionError.message : 'None')
  
  // 3. Get user method
  console.log('\n3. Via getUser:')
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User data:', !!user)
    console.log('User ID:', user?.email, user?.id)
    console.log('User error:', userError ? userError.message : 'None')
  } catch (e) {
    console.error('Error in getUser:', e)
  }
  
  // 4. Advanced: Check for cookies (client-side only)
  console.log('\n4. Advanced: Cookie Inspection:')
  if (typeof document !== 'undefined') {
    const allCookies = document.cookie
    const supabaseCookies = allCookies
      .split(';')
      .filter(c => c.trim().startsWith('sb-') || c.trim().startsWith('supabase-'))
      .map(c => c.trim())
    
    if (supabaseCookies.length > 0) {
      console.log('Found Supabase cookies:')
      supabaseCookies.forEach(c => {
        const [name, valueStart] = c.split('=')
        console.log(`- ${name}: ${valueStart.substring(0, 10)}...`)
      })
    } else {
      console.log('No Supabase cookies found')
    }
  }
  
  console.log('=========================================')
  return { session, user: session?.user }
}

// Enhanced helper to debug auth status and try multiple methods to get the current user
export const checkAuthSession = async () => {
  const supabase = createClient()
  let userData = null
  let sessionData = null
  let error = null
  
  console.log('======== AUTH SESSION CHECK ========')

  try {
    // Method 1: Try getSession first
    console.log('Method 1: Trying getSession...')
    const sessionResult = await supabase.auth.getSession()
    sessionData = sessionResult.data
    error = sessionResult.error
    
    if (error) {
      console.error('Session error:', error.message, error)
    }
    
    if (sessionData?.session?.user) {
      console.log('✅ Session found with getSession():', sessionData.session.user.email)
      userData = sessionData.session.user
    } else {
      console.log('❌ No session found with getSession()')
      
      // Method 2: Try getUser as fallback
      console.log('Method 2: Trying getUser...')
      const userResult = await supabase.auth.getUser()
      
      if (userResult.error) {
        console.error('getUser error:', userResult.error.message)
      }
      
      if (userResult.data?.user) {
        console.log('✅ User found with getUser():', userResult.data.user.email)
        userData = userResult.data.user
      } else {
        console.log('❌ No user found with getUser()')
      }
    }
  } catch (e) {
    console.error('Error in checkAuthSession:', e)
    error = e
  }
  
  if (userData) {
    console.log('=== Auth Info ===')
    console.log('User ID:', userData.id)
    console.log('Email:', userData.email)
    console.log('Last Sign In:', new Date(userData.last_sign_in_at || '').toLocaleString())
    
    if (sessionData?.session?.expires_at) {
      console.log('Session Expires At:', 
        new Date(sessionData.session.expires_at * 1000).toLocaleString())
    }
  } else {
    console.log('⚠️ No authenticated user found')
  }
  
  console.log('===================================')
  
  return { 
    data: sessionData,
    user: userData, 
    error 
  }
}
