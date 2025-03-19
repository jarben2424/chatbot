import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Define type for Supabase client
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

// Create a Supabase client for server-side usage (cached to improve performance)
export const createClient = cache(() => {
  // Get environment variables for Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for server');
  }

  // Get cookies for maintaining auth state
  const cookieStore = cookies();

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // Use cookies to maintain session across requests
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  });
});
