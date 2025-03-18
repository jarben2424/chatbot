// Define the SnowflakeRow type locally
type SnowflakeRow = Record<string, any>;

/**
 * Execute a query for a specific dashboard metric via API route
 * 
 * @param metricId The ID of the metric to execute
 * @param parameters Optional parameters for the query template
 * @returns QueryResult with formatted data for the visualization
 */
export async function executeMetricQuery(metricId: string, parameters?: Record<string, any>) {
  try {
    console.log(`Executing metric query for ID: ${metricId}`);
    
    // Add a timeout to the fetch to prevent hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        metricId,
        parameters 
      }),
      signal: controller.signal
    });
    
    // Clear the timeout since fetch completed
    clearTimeout(timeoutId);
    
    // Check if the response was successful
    if (!response.ok) {
      console.error(`API returned error status: ${response.status} for metric ID: ${metricId}`);
      return {
        success: false,
        error: `Server returned error: ${response.status} ${response.statusText}`,
        metricId
      };
    }
    
    // Parse the JSON with error handling
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      return {
        success: false,
        error: 'Invalid response format from server',
        metricId
      };
    }
    
    return result;
  } catch (error) {
    // Handle specific error types
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Query timed out after 15 seconds:', metricId);
      return {
        success: false,
        error: 'Query timed out after 15 seconds',
        metricId
      };
    }
    
    console.error('Error executing metric query via API:', error);
    return {
      success: false,
      error: `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`,
      metricId
    };
  }
}
