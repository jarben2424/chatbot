import { createClient } from '@/utils/supabase/client';

export interface UserDashboardMetric {
  id: string;
  userId: string;
  title: string;
  description?: string;
  question?: string;
  sqlQuery: string;
  visualizationType: 'highlight' | 'chart' | 'table';
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all active dashboard metrics for the current user
 */
export async function getUserDashboardMetrics(): Promise<UserDashboardMetric[]> {
  try {
    const supabase = createClient();

    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, return empty array
    if (!user) {
      console.warn('No authenticated user found for getUserDashboardMetrics');
      return getUserDashboardMetricsFromLocalStorage();
    }

    // Get metrics for the current user
    const { data, error } = await supabase
      .from('UserDashboardMetrics')
      .select('*')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('displayOrder', { ascending: true });

    if (error) {
      console.error('Error fetching user dashboard metrics:', error);
      return getUserDashboardMetricsFromLocalStorage();
    }

    // Save to localStorage as a fallback
    saveUserDashboardMetricsToLocalStorage(data || []);

    return data || [];
  } catch (error) {
    console.error('Error in getUserDashboardMetrics:', error);
    return getUserDashboardMetricsFromLocalStorage();
  }
}

/**
 * Create a new dashboard metric for the current user
 */
export async function createUserDashboardMetric(metric: Omit<UserDashboardMetric, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive' | 'displayOrder'>): Promise<UserDashboardMetric | null> {
  try {
    const supabase = createClient();

    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, save to localStorage and return
    if (!user) {
      console.warn('No authenticated user found for createUserDashboardMetric');
      return createUserDashboardMetricInLocalStorage(metric);
    }

    // Get current highest order value to place new metric at the end
    const { data: existingMetrics, error: queryError } = await supabase
      .from('UserDashboardMetrics')
      .select('displayOrder')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('displayOrder', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Error querying existing metrics:', queryError);
      return createUserDashboardMetricInLocalStorage(metric);
    }

    const highestOrder = existingMetrics && existingMetrics.length > 0 
      ? existingMetrics[0].displayOrder + 1 
      : 0;

    const now = new Date().toISOString();

    // Insert the new metric
    const { data: newMetric, error } = await supabase
      .from('UserDashboardMetrics')
      .insert({
        userId: user.id,
        title: metric.title,
        description: metric.description || `Data for ${metric.title}`,
        question: metric.question,
        sqlQuery: metric.sqlQuery,
        visualizationType: metric.visualizationType,
        displayOrder: highestOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user dashboard metric:', error);
      return createUserDashboardMetricInLocalStorage(metric);
    }

    // Update local storage with the new metric
    const existingMetricsFromStorage = getUserDashboardMetricsFromLocalStorage();
    saveUserDashboardMetricsToLocalStorage([...existingMetricsFromStorage, newMetric]);

    return newMetric;
  } catch (error) {
    console.error('Error in createUserDashboardMetric:', error);
    return createUserDashboardMetricInLocalStorage(metric);
  }
}

/**
 * Update the display order of a dashboard metric
 */
export async function updateUserDashboardMetricOrder(id: string, newOrder: number): Promise<boolean> {
  try {
    const supabase = createClient();

    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, update in localStorage and return
    if (!user) {
      console.warn('No authenticated user found for updateUserDashboardMetricOrder');
      return updateUserDashboardMetricOrderInLocalStorage(id, newOrder);
    }

    // Update the metric order
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({
        displayOrder: newOrder,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Error updating metric order:', error);
      return updateUserDashboardMetricOrderInLocalStorage(id, newOrder);
    }

    // Update the order in localStorage as well
    updateUserDashboardMetricOrderInLocalStorage(id, newOrder);

    return true;
  } catch (error) {
    console.error('Error in updateUserDashboardMetricOrder:', error);
    return updateUserDashboardMetricOrderInLocalStorage(id, newOrder);
  }
}

/**
 * Delete a dashboard metric (soft delete by setting isActive to false)
 */
export async function deleteUserDashboardMetric(id: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // First try to authenticate the user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user, delete from localStorage and return
    if (!user) {
      console.warn('No authenticated user found for deleteUserDashboardMetric');
      return deleteUserDashboardMetricFromLocalStorage(id);
    }

    // Soft delete the metric by setting isActive to false
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Error deleting dashboard metric:', error);
      return deleteUserDashboardMetricFromLocalStorage(id);
    }

    // Remove from localStorage as well
    deleteUserDashboardMetricFromLocalStorage(id);

    return true;
  } catch (error) {
    console.error('Error in deleteUserDashboardMetric:', error);
    return deleteUserDashboardMetricFromLocalStorage(id);
  }
}

/**
 * Execute a dashboard metric SQL query
 */
export async function executeUserDashboardMetricQuery(sqlQuery: string): Promise<any> {
  try {
    const response = await fetch('/api/run-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sqlQuery })
    });

    if (!response.ok) {
      throw new Error(`Query failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.results && data.results.length > 0 ? data.results[0] : null;
  } catch (error) {
    console.error('Error executing metric query:', error);
    throw error;
  }
}

// Local storage functions for fallback

function getUserDashboardMetricsFromLocalStorage(): UserDashboardMetric[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedMetrics = localStorage.getItem('userDashboardMetrics');
    return storedMetrics ? JSON.parse(storedMetrics) : [];
  } catch (error) {
    console.error('Error retrieving metrics from localStorage:', error);
    return [];
  }
}

function saveUserDashboardMetricsToLocalStorage(metrics: UserDashboardMetric[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('userDashboardMetrics', JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving metrics to localStorage:', error);
  }
}

function createUserDashboardMetricInLocalStorage(metric: Omit<UserDashboardMetric, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive' | 'displayOrder'>): UserDashboardMetric {
  const existingMetrics = getUserDashboardMetricsFromLocalStorage();
  
  // Generate a temp ID and calculate next display order
  const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const highestOrder = existingMetrics.length > 0 
    ? Math.max(...existingMetrics.map(m => m.displayOrder)) + 1 
    : 0;
  
  const now = new Date().toISOString();
  
  const newMetric: UserDashboardMetric = {
    id,
    userId: 'local-user',
    title: metric.title,
    description: metric.description || `Data for ${metric.title}`,
    question: metric.question,
    sqlQuery: metric.sqlQuery,
    visualizationType: metric.visualizationType,
    displayOrder: highestOrder,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Save to localStorage
  saveUserDashboardMetricsToLocalStorage([...existingMetrics, newMetric]);
  
  return newMetric;
}

function updateUserDashboardMetricOrderInLocalStorage(id: string, newOrder: number): boolean {
  const metrics = getUserDashboardMetricsFromLocalStorage();
  const metricIndex = metrics.findIndex(m => m.id === id);
  
  if (metricIndex === -1) {
    return false;
  }
  
  metrics[metricIndex] = {
    ...metrics[metricIndex],
    displayOrder: newOrder,
    updatedAt: new Date().toISOString()
  };
  
  saveUserDashboardMetricsToLocalStorage(metrics);
  return true;
}

function deleteUserDashboardMetricFromLocalStorage(id: string): boolean {
  const metrics = getUserDashboardMetricsFromLocalStorage();
  const updatedMetrics = metrics.filter(m => m.id !== id);
  
  if (updatedMetrics.length === metrics.length) {
    return false;
  }
  
  saveUserDashboardMetricsToLocalStorage(updatedMetrics);
  return true;
}
