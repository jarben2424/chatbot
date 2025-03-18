'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { VisualizationType } from '@/lib/local-storage';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

function NoDataFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
      <p>No data available</p>
    </div>
  );
}

interface ShadcnVisualizationProps {
  data: any[];
  type: string | VisualizationType;
  title?: string;
  description?: string;
}

export function ShadcnVisualization({ data, type, title, description }: ShadcnVisualizationProps) {
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
    
    // Format numbers with commas and decimal places if applicable
    let formattedValue = "";
    
    if (typeof value === 'number') {
      // Add dollar sign for financial values if the title suggests money
      const isMoney = title?.toLowerCase().includes('revenue') || 
                     title?.toLowerCase().includes('sales') || 
                     title?.toLowerCase().includes('price') ||
                     title?.toLowerCase().includes('cost');
                     
      formattedValue = isMoney ? '$' : '';
      
      formattedValue += new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 1,
        notation: value > 10000 ? 'compact' : 'standard',
        compactDisplay: 'short'
      }).format(value);
    } else {
      formattedValue = value?.toString() || '0';
    }
    
    return (
      <div className="text-3xl font-semibold">
        {formattedValue}
      </div>
    );
  }

  // For bar and line charts
  // Get all unique keys except for the category/index key
  const firstRow = data[0];
  const keys = Object.keys(firstRow).filter(key => key !== 'category' && key !== 'date' && key !== 'name');
  
  // Determine the category/index key
  const categoryKey = firstRow.hasOwnProperty('category') ? 'category' : 
                    firstRow.hasOwnProperty('date') ? 'date' : 
                    firstRow.hasOwnProperty('name') ? 'name' : keys[0];
  
  const colors = ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
  
  if (type === 'bar' || type === 'bar-chart') {
    return (
      <div className="w-full" style={{ minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey={categoryKey} 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false} 
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip />
            {keys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]} 
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  if (type === 'line' || type === 'line-chart') {
    return (
      <div className="w-full" style={{ minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey={categoryKey} 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false} 
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip />
            {keys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  // Default case - just return the raw data
  return <NoDataFallback />;
}
