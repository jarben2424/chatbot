'use client';

import React, { useMemo } from 'react';
import { VisualizationType } from '@/lib/local-storage';
import { BarChart, LineChart, HighlightCard } from '@/components/ui/charts';

interface VisualizationProps {
  data: Record<string, any>[];
  type: VisualizationType;
  title?: string;
}

// Loading fallback component with shadcn styling
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4 h-52 text-muted-foreground">
    Loading visualization...
  </div>
);

// No data fallback component with shadcn styling
const NoDataFallback = () => (
  <div className="flex items-center justify-center p-4 h-52 text-muted-foreground">
    No data to display
  </div>
);

export function ShadcnVisualization({ data, type, title }: VisualizationProps) {
  // Handle empty data case
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <NoDataFallback />;
  }

  // For highlight visualization (single value metric)
  if (type === 'highlight') {
    // Simplified highlight metrics logic
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    if (keys.length === 0) return <NoDataFallback />;
    
    // Just extract the first non-null value, regardless of the key
    const valueKey = keys.find(key => firstRow[key] !== null) || keys[0];
    const value = firstRow[valueKey];
    
    return (
      <HighlightCard 
        title={title || 'Metric'} 
        value={value} 
        className="h-52"
      />
    );
  }
  
  // Prepare data for time series charts (line-chart or bar-chart)
  const { chartData, categories, indexKey } = useMemo(() => {
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    // Identify potential date/time columns for x-axis
    const dateTimeKeys = columns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('year') ||
      col.toLowerCase().includes('month') ||
      col.toLowerCase().includes('day')
    );
    
    // Use the first date column as the x-axis or fallback to the first column
    const indexKey = dateTimeKeys.length > 0 ? dateTimeKeys[0] : columns[0];
    
    // Find numeric columns for metrics
    const categories = columns.filter(col => {
      const value = firstRow[col];
      return typeof value === 'number' && col !== indexKey;
    });
    
    // If no numeric columns found, try to use all non-index columns
    if (categories.length === 0) {
      const nonIndexColumns = columns.filter(col => col !== indexKey);
      if (nonIndexColumns.length > 0) {
        categories.push(...nonIndexColumns);
      }
    }
    
    // Format data for chart if needed
    const chartData = data.map(item => {
      const formattedItem: Record<string, any> = { ...item };
      
      // Format date values for display
      if (dateTimeKeys.includes(indexKey)) {
        const dateValue = item[indexKey];
        if (dateValue && typeof dateValue === 'string') {
          try {
            const date = new Date(dateValue);
            formattedItem[indexKey] = date.toLocaleDateString();
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
      }
      
      return formattedItem;
    });
    
    return { chartData, categories, indexKey };
  }, [data]);
  
  // If we have no categories to display, show no data
  if (categories.length === 0 || !indexKey) {
    return <NoDataFallback />;
  }
  
  // Handle line chart type
  if (type === 'line-chart') {
    return (
      <LineChart
        data={chartData}
        categories={categories}
        index={indexKey}
        className="h-52"
        chartConfig={{
          grid: true,
          xAxis: true,
          yAxis: true,
          tooltip: true,
          legend: true,
        }}
      />
    );
  }
  
  // Bar chart visualization
  if (type === 'bar-chart') {
    return (
      <BarChart
        data={chartData}
        categories={categories}
        index={indexKey}
        className="h-52"
        chartConfig={{
          grid: true,
          xAxis: true,
          yAxis: true,
          tooltip: true,
          legend: true,
        }}
      />
    );
  }
  
  // Default to line chart for any other visualization type (like 'chart')
  // We handle 'chart' here as a fallback case since it's being mapped to 'line-chart' in the parent components
  return (
    <LineChart
      data={chartData}
      categories={categories}
      index={indexKey}
      className="h-52"
      chartConfig={{
        grid: true,
        xAxis: true,
        yAxis: true,
        tooltip: true,
        legend: true,
      }}
    />
  );
}
