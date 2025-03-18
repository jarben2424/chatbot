/**
 * Types for application
 */

// Snowflake related types
export type SnowflakeRow = Record<string, any>;
export type SnowflakeQueryResult = {
  success: boolean;
  data?: SnowflakeRow[];
  error?: string;
};

// Visualization types
export type HighlightData = {
  value: number | string;
  label?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
};

export type ChartData = {
  data: Record<string, any>[];
  categories: string[];
  index: string;
};

export type TableData = {
  data: Record<string, any>[];
  columns: {
    key: string;
    header: string;
  }[];
};

export type VisualizationData = HighlightData | ChartData | TableData | null;
