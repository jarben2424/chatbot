// types.ts
// UI visualization types (used in components and client-side code)
export type UIVisualizationType = 'highlight' | 'line-chart' | 'bar-chart' | 'table';

// Database visualization types (must match the database constraints)
export type DatabaseVisualizationType = 'highlight' | 'chart' | 'table';

/**
 * Maps UI visualization type to database-compatible visualization type
 * @param uiType The visualization type from the UI
 * @returns A database-compatible visualization type
 */
export function mapToDatabaseVisualizationType(uiType: UIVisualizationType | string): DatabaseVisualizationType {
  switch (uiType) {
    case 'line-chart':
    case 'bar-chart':
      return 'chart';
    case 'highlight':
    case 'table':
      return uiType as DatabaseVisualizationType;
    default:
      return 'table'; // default fallback
  }
}

/**
 * Maps database visualization type to UI-compatible visualization type
 * @param dbType The visualization type from the database
 * @returns A UI-compatible visualization type
 */
export function mapToUIVisualizationType(dbType: DatabaseVisualizationType | string): UIVisualizationType {
  switch (dbType) {
    case 'chart':
      // Default to line-chart - can be refined later based on data characteristics
      return 'line-chart';
    case 'highlight':
    case 'table':
      return dbType as UIVisualizationType;
    default:
      return 'table'; // default fallback
  }
}
