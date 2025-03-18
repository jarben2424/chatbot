'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/toast';
import { Session, User } from '@supabase/supabase-js';

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboards',
  '/dashboards/my',
  '/dashboards/sales',
  '/dashboards/customers',
  '/dashboards/skus',
];

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  signUp: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  signOut: () => Promise<void>;
  getUserId: () => string | null;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some(route => 
    pathname && pathname.startsWith(route)
  );

  // Initialize auth state
  const refreshAuthState = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        console.log('Auth state initialized with session:', currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign in
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await refreshAuthState(); // Refresh to ensure everything is up to date
        console.log('Successfully signed in:', data.user.id);
        return { success: true };
      }
      
      return {
        success: false,
        error: 'No session returned after login'
      };
    } catch (error) {
      console.error('Error during sign in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during sign in'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up
  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // First check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing user:', checkError);
      }

      if (existingUsers && existingUsers.length > 0) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }
      
      // Register new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (data.user) {
        // Insert user into custom users table if needed
        try {
          await supabase
            .from('users')
            .insert([{ id: data.user.id, email: data.user.email }]);
        } catch (insertError) {
          console.error('Error creating user record:', insertError);
          // Continue anyway since the auth record was created
        }
        
        setSession(data.session);
        setUser(data.user);
        console.log('Successfully signed up:', data.user.id);
        
        return { success: true };
      }
      
      return {
        success: false,
        error: 'Failed to create user'
      };
    } catch (error) {
      console.error('Error during sign up:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during sign up'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Utility function to get user ID
  const getUserId = (): string | null => {
    return user?.id || null;
  };

  // Listen for auth state changes
  useEffect(() => {
    // Initial auth check
    refreshAuthState();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle redirection for protected routes
  useEffect(() => {
    if (!isLoading && requiresAuth && !user) {
      console.log('Auth required for this route. Redirecting to login...');
      router.push('/login');
      
      toast({
        type: "error",
        description: "You must be logged in to access this page",
      });
    }
  }, [isLoading, user, pathname, requiresAuth, router]);

  // Provide auth context
  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    getUserId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export a wrapper component for use in layout
export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
