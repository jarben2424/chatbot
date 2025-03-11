import { generateUUID } from '@/lib/utils';

type VisualizationType = 'table' | 'bar' | 'line' | 'pie' | 'scatter' | 'auto';

// Determine the best visualization type based on data characteristics
function determineVisualizationType(data: any[]): VisualizationType {
  if (!data || data.length === 0) {
    return 'table';
  }
  
  // Count number of numeric vs categorical columns
  const firstRow = data[0];
  let numericColumns = 0;
  let categoricalColumns = 0;
  
  Object.values(firstRow).forEach(value => {
    if (typeof value === 'number') {
      numericColumns++;
    } else {
      categoricalColumns++;
    }
  });
  
  // Simple heuristics for visualization type
  if (numericColumns === 0) {
    return 'table';
  } else if (data.length <= 10 && categoricalColumns >= 1 && numericColumns >= 1) {
    return 'bar';
  } else if (data.length > 10 && numericColumns >= 1) {
    return 'line';
  } else if (categoricalColumns === 1 && numericColumns === 1 && data.length <= 8) {
    return 'pie';
  } else if (numericColumns >= 2) {
    return 'scatter';
  }
  
  return 'table';
}

export async function generateDataVisualization(
  data: any[], 
  type: VisualizationType, 
  options?: Record<string, any>
) {
  // Auto-select visualization type if set to auto
  const visualizationType = type === 'auto' 
    ? determineVisualizationType(data)
    : type;
  
  // Generate a unique ID for this visualization
  const id = generateUUID();
  
  // In a real implementation, you might generate actual visualization config here
  // For now, we're just returning the type and ID
  return {
    id,
    type: visualizationType,
    data,
    options,
    // You could add more properties for specific visualization configs
  };
} 