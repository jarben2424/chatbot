export interface VisualizationSettings {
  type: string;
  colors: string[];
  showLegend: boolean;
  showTitle: boolean;
  showLabels: boolean;
  showGrid?: boolean;
  xAxis?: string;
}

export interface ChartData {
  id: string;
  title: string;
  description?: string;
  type: 'visualization';
  content: {
    data: any[];
    visualization: string;
    settings: VisualizationSettings;
  };
} 