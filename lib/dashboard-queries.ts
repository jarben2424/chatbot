'use client';

import { createClient } from '@/utils/supabase/client';
import { VisualizationType } from './local-storage';

// Key for local storage
const LOCAL_STORAGE_KEY = 'dashboard_queries';

export interface DashboardQuery {
  id: string;
  userId: string;
  title: string;
  question: string;
  sqlQuery: string;
  visualizationType: VisualizationType;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  displayOrder: number;
}

// Helper function to generate UUID
function generateUUID(): string {
  // Simple UUID generator for our purposes
  const timestamp = new Date().getTime();
  const randomPart = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return `dashboard-${timestamp}-${randomPart}`;
}

// Get items from local storage
function getLocalStorageQueries(): DashboardQuery[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return [];
  }
}

// Save items to local storage
function saveLocalStorageQueries(queries: DashboardQuery[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queries));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

// Create a new dashboard query
export async function createDashboardQuery({
  title,
  question,
  sqlQuery,
  visualizationType,
}: {
  title: string;
  question: string;
  sqlQuery: string;
  visualizationType: VisualizationType;
}): Promise<DashboardQuery | null> {
  try {
    const supabase = createClient();
    
    // First get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use a demo user ID if not authenticated
    const userId = user?.id || 'demo-user-123';
    
    try {
      // Get current highest order value to place new query at the top
      const { data: existingQueries, error } = await supabase
        .from('DashboardQuery')
        .select('displayOrder')
        .eq('userId', userId)
        .eq('isActive', true)
        .order('displayOrder', { ascending: false })
        .limit(1);
      
      // If there's an error with Supabase, fall back to local storage
      if (error) throw new Error('Supabase error');
      
      const highestOrder = existingQueries && existingQueries.length > 0 
        ? existingQueries[0].displayOrder + 1 
        : 0;
      
      const now = new Date().toISOString();
      
      const { data, error: insertError } = await supabase
        .from('DashboardQuery')
        .insert({
          userId: userId,
          title,
          question,
          sqlQuery,
          visualizationType,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          displayOrder: highestOrder // New queries appear at the top
        })
        .select()
        .single();
      
      if (insertError) throw new Error('Supabase insert error');
      
      return data;
    } catch (e) {
      // Fall back to local storage if Supabase fails
      console.warn('Falling back to local storage for dashboard queries:', e);
      
      const existingQueries = getLocalStorageQueries();
      const highestOrder = existingQueries.length > 0 
        ? Math.max(...existingQueries.map(q => q.displayOrder)) + 1 
        : 0;
      
      const now = new Date().toISOString();
      
      const newQuery: DashboardQuery = {
        id: generateUUID(),
        userId,
        title,
        question,
        sqlQuery,
        visualizationType,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        displayOrder: highestOrder
      };
      
      const updatedQueries = [...existingQueries, newQuery];
      saveLocalStorageQueries(updatedQueries);
      
      return newQuery;
    }
  } catch (error) {
    console.error('Error creating dashboard query:', error);
    return null;
  }
}

// Get dashboard queries for the current user
export async function getDashboardQueries(): Promise<DashboardQuery[]> {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use a demo user ID if not authenticated
    const userId = user?.id || 'demo-user-123';
    
    try {
      const { data, error } = await supabase
        .from('DashboardQuery')
        .select('*')
        .eq('userId', userId)
        .eq('isActive', true)
        .order('displayOrder', { ascending: true });
      
      if (error) throw new Error('Supabase query error');
      
      return data || [];
    } catch (e) {
      // Fall back to local storage if Supabase fails
      console.warn('Falling back to local storage for dashboard queries:', e);
      
      return getLocalStorageQueries().filter(q => 
        q.userId === userId && q.isActive
      ).sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch (error) {
    console.error('Error fetching dashboard queries:', error);
    
    // Return mock data for demonstration if everything fails
    if (typeof window !== 'undefined') {
      return getLocalStorageQueries();
    }
    
    // Return empty array if nothing else works
    return [];
  }
}

// Update an existing dashboard query
export async function updateDashboardQuery(
  id: string,
  updates: Partial<Omit<DashboardQuery, 'id' | 'userId' | 'createdAt'>>
): Promise<DashboardQuery | null> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use a demo user ID if not authenticated
    const userId = user?.id || 'demo-user-123';
    
    try {
      const { data, error } = await supabase
        .from('DashboardQuery')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .eq('userId', userId)
        .select()
        .single();
      
      if (error) throw new Error('Supabase update error');
      
      return data;
    } catch (e) {
      // Fall back to local storage if Supabase fails
      console.warn('Falling back to local storage for dashboard query update:', e);
      
      const queries = getLocalStorageQueries();
      const updatedQueries = queries.map(q => 
        q.id === id && q.userId === userId 
          ? { ...q, ...updates, updatedAt: new Date().toISOString() }
          : q
      );
      
      saveLocalStorageQueries(updatedQueries);
      
      const foundQuery = updatedQueries.find(q => q.id === id);
      return foundQuery || null;
    }
  } catch (error) {
    console.error('Error updating dashboard query:', error);
    return null;
  }
}

// Delete a dashboard query
export async function deleteDashboardQuery(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use a demo user ID if not authenticated
    const userId = user?.id || 'demo-user-123';
    
    try {
      const { error } = await supabase
        .from('DashboardQuery')
        .update({ 
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .eq('userId', userId);
      
      if (error) throw new Error('Supabase delete error');
      
      return true;
    } catch (e) {
      // Fall back to local storage if Supabase fails
      console.warn('Falling back to local storage for dashboard query deletion:', e);
      
      const queries = getLocalStorageQueries();
      const updatedQueries = queries.map(q => 
        q.id === id && q.userId === userId 
          ? { ...q, isActive: false, updatedAt: new Date().toISOString() }
          : q
      );
      
      saveLocalStorageQueries(updatedQueries);
      return true;
    }
  } catch (error) {
    console.error('Error deleting dashboard query:', error);
    return false;
  }
}

// Update the order of dashboard queries
export async function updateDashboardQueryOrder(
  orderMap: Record<string, number>
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use a demo user ID if not authenticated
    const userId = user?.id || 'demo-user-123';
    
    try {
      // Update the order of each query in the map
      const promises = Object.entries(orderMap).map(([id, order]) => {
        return supabase
          .from('DashboardQuery')
          .update({ 
            displayOrder: order,
            updatedAt: new Date().toISOString()
          })
          .eq('id', id)
          .eq('userId', userId);
      });
      
      await Promise.all(promises);
      return true;
    } catch (e) {
      // Fall back to local storage if Supabase fails
      console.warn('Falling back to local storage for dashboard query order update:', e);
      
      const queries = getLocalStorageQueries();
      const updatedQueries = queries.map(q => {
        if (q.userId === userId && orderMap[q.id] !== undefined) {
          return { 
            ...q, 
            displayOrder: orderMap[q.id],
            updatedAt: new Date().toISOString()
          };
        }
        return q;
      });
      
      saveLocalStorageQueries(updatedQueries);
      return true;
    }
  } catch (error) {
    console.error('Error updating dashboard query order:', error);
    return false;
  }
}
