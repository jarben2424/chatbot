'use client';

import { 
  UIVisualizationType,
  DatabaseVisualizationType,
  mapToDatabaseVisualizationType,
  mapToUIVisualizationType
} from './visualization-types';

// Re-export all types and functions for client components
export type { 
  UIVisualizationType,
  DatabaseVisualizationType
};

export { 
  mapToDatabaseVisualizationType,
  mapToUIVisualizationType
};
