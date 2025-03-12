'use client';

import React from 'react';
import { VisualizationType } from '@/lib/local-storage';
import { Highlight } from '@/app/dashboards/_components/visualizations/highlight';
import { LineChart } from '@/app/dashboards/_components/visualizations/line-chart';
import { BarChart } from '@/app/dashboards/_components/visualizations/bar-chart';
import { DataTable } from '@/app/dashboards/_components/visualizations/data-table';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4 text-muted-foreground">
    Loading visualization...
  </div>
);

interface VisualizationProps {
  data: any[];
  type: VisualizationType;
  title?: string;
}

export function Visualization({ data, type, title }: VisualizationProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        No data to display
      </div>
    );
  }

  // Render the appropriate visualization based on type
  switch (type) {
    case 'highlight':
      return <Highlight data={data} title={title} />;
    case 'line-chart':
      return <LineChart data={data} />;
    case 'bar-chart':
      return <BarChart data={data} />;
    case 'table':
    default:
      return <DataTable data={data} />;
  }
}
