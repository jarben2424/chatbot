import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Define the return type for createClient
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

// Create a Supabase client for browser-side usage
export const createClient = () => {
  // Get environment variables for Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for client');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};
