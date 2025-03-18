import { createClient } from '@/utils/supabase/client';

// Types for the three tables in our schema
/**
 * Dashboard metric definition from the database
 */
export interface DashboardMetric {
  id: string;
  title: string;
  description: string;
  category: string;
  querytemplate: string;
  visualizationtype: string; // Note lowercase to match DB column name
  parameters?: Record<string, any>;
}

/**
 * Chat-generated metric from the database
 */
export interface ChatGeneratedMetric {
  id: string;
  title: string;
  description?: string;
  category: string;
  originalQuestion: string;
  sqlQuery: string;
  visualizationtype: string; // Matches DashboardMetric field name
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User dashboard metric configuration
 */
export interface UserDashboardMetric {
  id: string;
  userId: string;
  sourceType: 'dashboard_metric' | 'chat_generated_metric';
  sourceId: string;
  customTitle?: string;
  customDescription?: string;
  customVisualizationType?: string;
  category: string;
  displayOrder: number;
  parameters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // These fields are added after fetching from the database
  sourceData?: DashboardMetric | ChatGeneratedMetric;
  title?: string;
  description?: string;
  visualizationtype?: string;
  query?: string;
}

// Complete metric type with merged data from source
export interface DashboardMetricComplete extends UserDashboardMetric {
  title: string;
  description?: string;
  visualizationType: string;
  category: string;
  query: string;
}

/**
 * Get all available system dashboard metrics
 */
export async function getSystemDashboardMetrics(): Promise<DashboardMetric[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('DashboardMetrics')
      .select('*')
      // Removed the isSystem filter to get all metrics
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error fetching system dashboard metrics:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getSystemDashboardMetrics:', error);
    return [];
  }
}

/**
 * Get all chat-generated metrics created by the current user
 */
export async function getChatGeneratedMetrics(): Promise<ChatGeneratedMetric[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ChatGeneratedMetrics')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching chat generated metrics:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getChatGeneratedMetrics:', error);
    return [];
  }
}

/**
 * Create a new chat-generated metric
 */
export async function createChatGeneratedMetric(metric: {
  title: string;
  description?: string;
  originalQuestion: string;
  sqlQuery: string;
  visualizationtype: string;
  category: string;
  conversationId?: string;
}): Promise<ChatGeneratedMetric | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ChatGeneratedMetrics')
      .insert([
        {
          title: metric.title,
          description: metric.description,
          originalQuestion: metric.originalQuestion,
          sqlQuery: metric.sqlQuery,
          visualizationtype: metric.visualizationtype,
          category: metric.category,
          conversationId: metric.conversationId,
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating chat generated metric:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createChatGeneratedMetric:', error);
    return null;
  }
}

/**
 * Get the currently authenticated user ID or throw if not found
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const supabase = createClient();
  
  // Try getSession first
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError.message);
    // Don't throw here, continue to try other methods
  } else if (sessionData?.session?.user?.id) {
    console.log('Found user ID from session:', sessionData.session.user.id);
    return sessionData.session.user.id;
  }
  
  // If getSession didn't work, try getUser as a fallback
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User error:', userError.message);
      throw new Error(`User authentication required: ${userError.message}`);
    } else if (userData?.user?.id) {
      console.log('Found user ID from getUser:', userData.user.id);
      return userData.user.id;
    }
  } catch (e) {
    console.error('Error getting user:', e);
    throw new Error('User authentication required');
  }
  
  // If we got this far without returning, there's no authenticated user
  console.error('User not authenticated: No valid session or user found!');
  throw new Error('User not authenticated: No valid session or user found!');
}

/**
 * Add a metric to the user's dashboard
 */
export async function addMetricToDashboard(
  params: {
    sourceType: 'dashboard_metric' | 'chat_generated_metric';
    sourceId: string;
    customTitle?: string;
    customDescription?: string;
    customVisualizationType?: string;
    category: string;
    parameters?: Record<string, any>;
  },
  overrideUserId?: string
): Promise<UserDashboardMetric | null> {
  console.log('===== FUNCTION START: addMetricToDashboard =====');
  console.log('===== Input params:', JSON.stringify(params, null, 2));
  console.log('===== Override User ID provided:', overrideUserId ? 'Yes' : 'No');

  try {
    const supabase = createClient();
    console.log('===== Supabase client created =====');

    // Get user ID using our helper function
    const userId = await getAuthenticatedUserId();
    console.log('===== Using user ID:', userId);

    // Get current highest display order
    console.log('===== Fetching current highest display order...');
    const { data: existingMetrics, error: displayOrderError } = await supabase
      .from('UserDashboardMetrics')
      .select('displayorder')
      .eq('userid', userId) // Filter by user ID is essential for correct ordering
      .order('displayorder', { ascending: false })
      .limit(1);

    if (displayOrderError) {
      console.error('===== Error fetching display order:', displayOrderError.message);
      throw new Error(`Failed to get display order: ${displayOrderError.message}`);
    }

    const newDisplayOrder = existingMetrics && existingMetrics.length > 0
      ? existingMetrics[0].displayorder + 1
      : 0;
    console.log(`===== New display order calculated: ${newDisplayOrder} =====`);

    // Prepare parameters (make sure we include the category)
    const parameters = {
      ...(params.parameters || {}),
      category: params.category,
    };
    console.log('===== Prepared parameters:', JSON.stringify(parameters, null, 2));

    console.log('===== Executing insert operation...');
    const { data: insertedData, error: insertError } = await supabase
      .from('UserDashboardMetrics')
      .insert({
        userid: userId,
        sourcetype: params.sourceType,
        sourceid: params.sourceId,
        displayorder: newDisplayOrder,
        isactive: true,
        customtitle: params.customTitle || null,
        customdescription: params.customDescription || null,
        customvisualizationtype: params.customVisualizationType || null,
        parameters,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('===== Insert error:', insertError.message);
      throw insertError;
    }

    if (!insertedData) {
      console.error('===== No data returned from insert =====');
      return null;
    }

    console.log('===== Successfully inserted record:', insertedData.id);

    const convertedData: UserDashboardMetric = {
      id: insertedData.id,
      userId: insertedData.userid,
      sourceType: insertedData.sourcetype,
      sourceId: insertedData.sourceid,
      displayOrder: insertedData.displayorder,
      customTitle: insertedData.customtitle,
      customDescription: insertedData.customdescription,
      customVisualizationType: insertedData.customvisualizationtype,
      category: insertedData.parameters?.category || params.category,
      parameters: insertedData.parameters,
      createdAt: insertedData.createdat,
      updatedAt: insertedData.updatedat,
    };

    console.log('===== Successfully added metric:', convertedData.id);
    return convertedData;
  } catch (error) {
    console.error('===== Error in addMetricToDashboard:', error);
    return null;
  }
}

/**
 * Get all metrics from the user's dashboard, with complete data
 */
export async function getUserDashboardMetrics(): Promise<DashboardMetricComplete[]> {
  try {
    const supabase = createClient();
    console.log('===== FUNCTION START: getUserDashboardMetrics =====');
    
    // Get current session to verify authentication
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('===== Session error:', sessionError.message);
      throw new Error(`Auth session error: ${sessionError.message}`);
    }
    
    if (!sessionData.session || !sessionData.session.user) {
      console.error('===== User not authenticated: Auth session missing!');
      throw new Error('User not authenticated: Auth session missing!');
    }
    
    const userId = sessionData.session.user.id;
    console.log('===== Authenticated user ID:', userId);
    
    // Get user's dashboard metrics
    const { data: userMetrics, error } = await supabase
      .from('UserDashboardMetrics')
      .select('*')
      .eq('userid', userId) // Explicitly filter by user ID
      .eq('isactive', true)
      .order('displayorder', { ascending: true });
    
    if (error) {
      console.error('Error fetching user dashboard metrics:', error);
      return [];
    }
    
    if (!userMetrics || userMetrics.length === 0) {
      return [];
    }
    
    // Build complete metrics by fetching source data
    const completeMetrics: DashboardMetricComplete[] = [];
    
    // Get all needed system metrics
    const systemMetricIds = userMetrics
      .filter(m => m.sourcetype === 'dashboard_metric')
      .map(m => m.sourceid);
    
    let systemMetricsMap: Record<string, DashboardMetric> = {};
    if (systemMetricIds.length > 0) {
      const { data: systemMetrics, error: systemMetricsError } = await supabase
        .from('DashboardMetrics')
        .select('*')
        .in('id', systemMetricIds);
      
      if (systemMetricsError) {
        console.error('Error fetching system metrics:', systemMetricsError);
      } else {
        systemMetricsMap = (systemMetrics || []).reduce((acc, metric) => {
          acc[metric.id] = metric;
          return acc;
        }, {} as Record<string, DashboardMetric>);
      }
    }
    
    // Get all needed chat metrics
    const chatMetricIds = userMetrics
      .filter(m => m.sourcetype === 'chat_generated_metric')
      .map(m => m.sourceid);
    
    let chatMetricsMap: Record<string, ChatGeneratedMetric> = {};
    if (chatMetricIds.length > 0) {
      const { data: chatMetrics, error: chatMetricsError } = await supabase
        .from('ChatGeneratedMetrics')
        .select('*')
        .in('id', chatMetricIds);
      
      if (chatMetricsError) {
        console.error('Error fetching chat metrics:', chatMetricsError);
      } else {
        chatMetricsMap = (chatMetrics || []).reduce((acc, metric) => {
          acc[metric.id] = metric;
          return acc;
        }, {} as Record<string, ChatGeneratedMetric>);
      }
    }
    
    // Build the complete metrics
    for (const userMetric of userMetrics) {
      let sourceData: DashboardMetric | ChatGeneratedMetric | undefined;
      
      if (userMetric.sourcetype === 'dashboard_metric') {
        sourceData = systemMetricsMap[userMetric.sourceid];
      } else {
        sourceData = chatMetricsMap[userMetric.sourceid];
      }
      
      if (!sourceData) {
        console.warn(`Source data not found for metric ${userMetric.id}`);
        continue;
      }
      
      // Create the complete metric with data from both sources
      const completeMetric: DashboardMetricComplete = {
        ...userMetric,
        sourceData,
        title: userMetric.customtitle || sourceData.title,
        description: userMetric.customdescription || sourceData.description,
        visualizationType: userMetric.customvisualizationtype || sourceData.visualizationtype,
        category: userMetric.parameters.category,
        query: userMetric.sourcetype === 'dashboard_metric'
          ? processQueryTemplate((sourceData as DashboardMetric).querytemplate, userMetric.parameters || {})
          : (sourceData as ChatGeneratedMetric).sqlQuery
      };
      
      completeMetrics.push(completeMetric);
    }
    
    return completeMetrics;
  } catch (error) {
    console.error('Error in getUserDashboardMetrics:', error);
    return [];
  }
}

/**
 * Process a query template with parameters
 */
function processQueryTemplate(template: string, params: Record<string, any>): string {
  let query = template;
  
  // Replace parameters in the form {{param_name}}
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    // Simple string replacement - in a real app, you'd want proper SQL escaping
    query = query.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return query;
}

/**
 * Update the display order of user dashboard metrics
 */
export async function updateUserDashboardMetricOrder(
  metrics: { id: string; displayOrder: number }[]
): Promise<boolean> {
  console.log('===== FUNCTION START: updateUserDashboardMetricOrder =====');
  
  try {
    const supabase = createClient();
    
    console.log('Metrics to update:', metrics);
    
    // Update each metric's display order
    for (const metric of metrics) {
      const { error } = await supabase
        .from('UserDashboardMetrics')
        .update({ displayorder: metric.displayOrder, updatedat: new Date().toISOString() })
        .eq('id', metric.id);
      
      if (error) {
        console.error(`Error updating metric ${metric.id}:`, error);
        return false;
      }
    }
    
    console.log('Successfully updated all metric display orders');
    return true;
  } catch (error) {
    console.error('Error in updateUserDashboardMetricOrder:', error);
    return false;
  }
}

/**
 * Delete a metric from the user's dashboard
 */
export async function deleteUserDashboardMetric(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Soft delete by marking as inactive
    const { error } = await supabase
      .from('UserDashboardMetrics')
      .update({ isactive: false, updatedat: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user dashboard metric:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteUserDashboardMetric:', error);
    return false;
  }
}

/**
 * Get all metrics from the user's dashboard, with complete data, filtered by category
 */
export async function getUserDashboardMetricsByCategory(
  category: string
): Promise<UserDashboardMetric[]> {
  try {
    const supabase = createClient();
    
    // Get user's dashboard metrics for the specified category
    const { data: userMetrics, error } = await supabase
      .from('UserDashboardMetrics')
      .select('*')
      .eq('isactive', true)
      .eq('parameters->>category', category)
      .order('displayorder', { ascending: true });
    
    if (error) {
      console.error('Error fetching user dashboard metrics by category:', error);
      return [];
    }
    
    if (!userMetrics || userMetrics.length === 0) {
      return [];
    }
    
    // Build complete metrics by fetching source data
    const completeMetrics: UserDashboardMetric[] = [];
    
    // Get all needed system metrics
    const systemMetricIds = userMetrics
      .filter(m => m.sourcetype === 'dashboard_metric')
      .map(m => m.sourceid);
    
    let systemMetricsMap: Record<string, DashboardMetric> = {};
    if (systemMetricIds.length > 0) {
      const { data: systemMetrics } = await supabase
        .from('DashboardMetrics')
        .select('*')
        .in('id', systemMetricIds);
      
      systemMetricsMap = (systemMetrics || []).reduce((acc, metric) => {
        acc[metric.id] = metric;
        return acc;
      }, {} as Record<string, DashboardMetric>);
    }
    
    // Get all needed chat metrics
    const chatMetricIds = userMetrics
      .filter(m => m.sourcetype === 'chat_generated_metric')
      .map(m => m.sourceid);
    
    let chatMetricsMap: Record<string, ChatGeneratedMetric> = {};
    if (chatMetricIds.length > 0) {
      const { data: chatMetrics } = await supabase
        .from('ChatGeneratedMetrics')
        .select('*')
        .in('id', chatMetricIds);
      
      chatMetricsMap = (chatMetrics || []).reduce((acc, metric) => {
        acc[metric.id] = metric;
        return acc;
      }, {} as Record<string, ChatGeneratedMetric>);
    }
    
    // Build the complete metrics
    for (const userMetric of userMetrics) {
      let sourceData: DashboardMetric | ChatGeneratedMetric | undefined;
      
      if (userMetric.sourcetype === 'dashboard_metric') {
        sourceData = systemMetricsMap[userMetric.sourceid];
      } else {
        sourceData = chatMetricsMap[userMetric.sourceid];
      }
      
      if (!sourceData) {
        console.warn(`Source data not found for metric ${userMetric.id}`);
        continue;
      }
      
      // Create the complete metric with data from both sources
      const completeMetric: UserDashboardMetric = {
        ...userMetric,
        sourceData,
        title: userMetric.customtitle || sourceData.title,
        description: userMetric.customdescription || sourceData.description,
        visualizationtype: userMetric.customvisualizationtype || sourceData.visualizationtype,
        query: userMetric.sourcetype === 'dashboard_metric'
          ? processQueryTemplate((sourceData as DashboardMetric).querytemplate, userMetric.parameters || {})
          : (sourceData as ChatGeneratedMetric).sqlQuery
      };
      
      completeMetrics.push(completeMetric);
    }
    
    return completeMetrics;
  } catch (error) {
    console.error('Error in getUserDashboardMetricsByCategory:', error);
    return [];
  }
}

/**
 * Get system dashboard metrics by category
 */
export async function getSystemDashboardMetricsByCategory(
  category: string
): Promise<DashboardMetric[]> {
  try {
    const supabase = createClient();
    console.log('Fetching system dashboard metrics for category:', category);
    
    // Get system metrics for this category
    const { data: metrics, error } = await supabase
      .from('DashboardMetrics')
      .select('*')
      .eq('category', category)
      .eq('issystem', true)
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error fetching system dashboard metrics:', error);
      return [];
    }
    
    console.log(`Found ${metrics?.length || 0} system metrics for category:`, category);
    return metrics || [];
  } catch (error) {
    console.error('Unexpected error in getSystemDashboardMetricsByCategory:', error);
    // Return empty array instead of throwing to prevent component failures
    return [];
  }
}

/**
 * Add a system metric to the user's dashboard (wrapper around addMetricToDashboard)
 */
export async function addSystemMetricToUserDashboard(
  metricId: string,
  category: string,
  overrideUserId?: string
): Promise<boolean> {
  console.log('===== FUNCTION CALLED: addSystemMetricToUserDashboard =====');
  console.log('Parameters:', { metricId, category, overrideUserId: overrideUserId ? 'provided' : 'not provided' });
  
  try {
    const result = await addMetricToDashboard(
      {
        sourceType: 'dashboard_metric',
        sourceId: metricId,
        category
      },
      overrideUserId
    );
    
    return result !== null;
  } catch (error) {
    console.error('Error in addSystemMetricToUserDashboard:', error);
    return false;
  }
}
