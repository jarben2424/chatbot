'use client';

import { UIVisualizationType } from './client-visualization-types';

export type VisualizationType = UIVisualizationType;

export interface LocalDashboardQuery {
  id: string;
  title: string;
  question: string;
  sqlQuery: string;
  createdAt: string;
  updatedAt: string;
  visualizationType: VisualizationType;
}

const DASHBOARD_QUERIES_KEY = 'dashboard_queries';

export function getLocalDashboardQueries(): LocalDashboardQuery[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const queriesJson = localStorage.getItem(DASHBOARD_QUERIES_KEY);
    return queriesJson ? JSON.parse(queriesJson) : [];
  } catch (error) {
    console.error('Error reading dashboard queries from localStorage:', error);
    return [];
  }
}

export function saveLocalDashboardQuery({
  title,
  question,
  sqlQuery,
  visualizationType,
}: {
  title: string;
  question: string;
  sqlQuery: string;
  visualizationType: VisualizationType;
}): LocalDashboardQuery {
  const queries = getLocalDashboardQueries();
  
  const newQuery: LocalDashboardQuery = {
    id: crypto.randomUUID(),
    title,
    question,
    sqlQuery,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visualizationType,
  };
  
  localStorage.setItem(
    DASHBOARD_QUERIES_KEY,
    JSON.stringify([newQuery, ...queries])
  );
  
  return newQuery;
}

export function updateLocalDashboardQuery(
  id: string, 
  updates: Partial<Omit<LocalDashboardQuery, 'id' | 'createdAt'>>
): LocalDashboardQuery | null {
  const queries = getLocalDashboardQueries();
  let updatedQuery = null;
  
  const updatedQueries = queries.map(query => {
    if (query.id === id) {
      updatedQuery = {
        ...query,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return updatedQuery;
    }
    return query;
  });
  
  localStorage.setItem(
    DASHBOARD_QUERIES_KEY,
    JSON.stringify(updatedQueries)
  );
  
  return updatedQuery;
}

export function deleteLocalDashboardQuery(id: string): void {
  const queries = getLocalDashboardQueries();
  const updatedQueries = queries.filter(query => query.id !== id);
  
  localStorage.setItem(
    DASHBOARD_QUERIES_KEY,
    JSON.stringify(updatedQueries)
  );
}

export function updateLocalDashboardQueryTimestamp(id: string): void {
  const queries = getLocalDashboardQueries();
  const queryIndex = queries.findIndex(q => q.id === id);
  
  if (queryIndex !== -1) {
    queries[queryIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(DASHBOARD_QUERIES_KEY, JSON.stringify(queries));
  }
}

// Email subscription types and functions
export type EmailCadence = 'daily' | 'weekly' | 'monthly';

export interface DashboardEmailSubscription {
  id: string;
  name: string;
  dashboardQueryIds: string[];
  recipients: string[];
  cadence: EmailCadence;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMAIL_SUBSCRIPTIONS_KEY = 'dashboard_email_subscriptions';

export function getEmailSubscriptions(): DashboardEmailSubscription[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const subscriptionsJson = localStorage.getItem(EMAIL_SUBSCRIPTIONS_KEY);
    return subscriptionsJson ? JSON.parse(subscriptionsJson) : [];
  } catch (error) {
    console.error('Error reading email subscriptions from localStorage:', error);
    return [];
  }
}

export function saveEmailSubscription({
  name,
  dashboardQueryIds,
  recipients,
  cadence,
  active = true,
}: {
  name: string;
  dashboardQueryIds: string[];
  recipients: string[];
  cadence: EmailCadence;
  active?: boolean;
}): DashboardEmailSubscription {
  const subscriptions = getEmailSubscriptions();
  
  const newSubscription: DashboardEmailSubscription = {
    id: crypto.randomUUID(),
    name,
    dashboardQueryIds,
    recipients,
    cadence,
    active,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  subscriptions.push(newSubscription);
  localStorage.setItem(EMAIL_SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  
  return newSubscription;
}

export function updateEmailSubscription(
  id: string, 
  updates: Partial<Omit<DashboardEmailSubscription, 'id' | 'createdAt'>>
): DashboardEmailSubscription | null {
  const subscriptions = getEmailSubscriptions();
  const subscriptionIndex = subscriptions.findIndex(s => s.id === id);
  
  if (subscriptionIndex === -1) {
    return null;
  }
  
  const updatedSubscription = {
    ...subscriptions[subscriptionIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  subscriptions[subscriptionIndex] = updatedSubscription;
  localStorage.setItem(EMAIL_SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  
  return updatedSubscription;
}

export function deleteEmailSubscription(id: string): void {
  const subscriptions = getEmailSubscriptions();
  const filteredSubscriptions = subscriptions.filter(s => s.id !== id);
  
  if (filteredSubscriptions.length !== subscriptions.length) {
    localStorage.setItem(EMAIL_SUBSCRIPTIONS_KEY, JSON.stringify(filteredSubscriptions));
  }
}

export function getEmailPreview(subscriptionId: string): {
  subject: string;
  body: string;
  queries: LocalDashboardQuery[];
} | null {
  const subscriptions = getEmailSubscriptions();
  const subscription = subscriptions.find(s => s.id === subscriptionId);
  
  if (!subscription) {
    return null;
  }
  
  const allQueries = getLocalDashboardQueries();
  const includedQueries = allQueries.filter(q => 
    subscription.dashboardQueryIds.includes(q.id)
  );
  
  return {
    subject: `Dashboard Update: ${subscription.name}`,
    body: `Here are your dashboard metrics as of ${new Date().toLocaleDateString()}.`,
    queries: includedQueries,
  };
}
