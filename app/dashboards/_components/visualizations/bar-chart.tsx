'use client';

import React, { useMemo } from 'react';
import { Bar, ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface BarChartProps {
  data: any[];
}

export function BarChart({ data }: BarChartProps) {
  const { chartData, metrics, categoryKey } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], metrics: [], categoryKey: null };
    
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    // Find numeric columns for metrics
    const metrics = columns.filter(col => {
      const value = firstRow[col];
      return typeof value === 'number';
    });
    
    // Use the first non-numeric column as category (x-axis)
    const nonNumericColumns = columns.filter(col => !metrics.includes(col));
    const categoryKey = nonNumericColumns.length > 0 ? nonNumericColumns[0] : columns[0];
    
    return { chartData: data, metrics, categoryKey };
  }, [data]);
  
  if (chartData.length === 0 || !categoryKey || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        No suitable data for bar chart
      </div>
    );
  }
  
  const colors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={categoryKey} 
            tick={{ fontSize: 12 }}
            tickFormatter={(value: any) => {
              // Truncate long labels
              if (typeof value === 'string' && value.length > 10) {
                return value.substring(0, 10) + '...';
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {metrics.map((metric, index) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={colors[index % colors.length]}
              name={metric}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
