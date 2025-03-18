'use client'

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
    console.log('Fetching dashboard metrics from API...');
    
    // Call the API endpoint with credentials to ensure cookies are sent
    const response = await fetch('/api/user-dashboard-metrics', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Authentication failed for getUserDashboardMetrics');
        return getUserDashboardMetricsFromLocalStorage();
      }
      
      console.error('Error response from dashboard metrics API:', response.status, response.statusText);
      return getUserDashboardMetricsFromLocalStorage();
    }
    
    const metrics = await response.json();
    console.log(`Received ${metrics.length} dashboard metrics from API`);
    
    // Save to localStorage as a fallback for offline/error scenarios
    if (metrics && Array.isArray(metrics)) {
      saveUserDashboardMetricsToLocalStorage(metrics);
    }
    
    return metrics || [];
  } catch (error) {
    console.error('Error in getUserDashboardMetrics:', error);
    return getUserDashboardMetricsFromLocalStorage();
  }
}

/**
 * Add a metric to the user's dashboard
 */
export async function addMetricToDashboard({
  sourceType,
  sourceId,
  customTitle,
  customDescription,
  customVisualizationType,
  parameters = {}
}: {
  sourceType: 'dashboard_metric' | 'chat_generated_metric';
  sourceId: string;
  customTitle?: string;
  customDescription?: string;
  customVisualizationType?: string;
  parameters?: Record<string, any>;
}): Promise<boolean> {
  try {
    console.log(`Adding metric to dashboard via API: ${sourceType} ${sourceId.substring(0, 8)}...`);
    
    // Call the API endpoint with credentials to ensure cookies are sent
    const response = await fetch('/api/user-dashboard-metrics', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceType,
        sourceId,
        customTitle,
        customDescription,
        customVisualizationType,
        parameters
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Authentication failed for addMetricToDashboard');
        return false;
      }
      
      console.error('Error response from dashboard metrics API:', response.status, response.statusText);
      return false;
    }
    
    const result = await response.json();
    console.log('Successfully added metric to dashboard:', result.metricId);
    return true;
  } catch (error) {
    console.error('Error in addMetricToDashboard:', error);
    return false;
  }
}

/**
 * Update the display order of a dashboard metric
 */
export async function updateUserDashboardMetricOrder(id: string, newOrder: number): Promise<boolean> {
  try {
    console.log(`Updating metric order via API: ${id} to ${newOrder}`);
    
    // Call the API endpoint with credentials to ensure cookies are sent
    const response = await fetch('/api/user-dashboard-metrics', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, newOrder }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Authentication failed for updateUserDashboardMetricOrder');
        return updateUserDashboardMetricOrderInLocalStorage(id, newOrder);
      }
      
      console.error('Error response from dashboard metrics API:', response.status, response.statusText);
      return updateUserDashboardMetricOrderInLocalStorage(id, newOrder);
    }
    
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
    console.log(`Deleting metric via API: ${id}`);
    
    // Call the API endpoint with credentials to ensure cookies are sent
    const response = await fetch(`/api/user-dashboard-metrics?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Authentication failed for deleteUserDashboardMetric');
        return deleteUserDashboardMetricFromLocalStorage(id);
      }
      
      console.error('Error response from dashboard metrics API:', response.status, response.statusText);
      return deleteUserDashboardMetricFromLocalStorage(id);
    }
    
    // Remove from localStorage as well for consistency
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
    // Call the API endpoint to execute the query
    const response = await fetch('/api/run-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sqlQuery }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute query: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing dashboard metric query:', error);
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
