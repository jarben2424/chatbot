'use client';

import React, { useMemo } from 'react';
import { Line, ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface LineChartProps {
  data: any[];
}

export function LineChart({ data }: LineChartProps) {
  const { chartData, metrics, timeKey } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], metrics: [], timeKey: null };
    
    // Identify potential date/time columns for x-axis
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    // Look for date/time columns
    const dateTimeKeys = columns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('year') ||
      col.toLowerCase().includes('month') ||
      col.toLowerCase().includes('day')
    );
    
    // Use the first date column as the x-axis or fallback to the first column
    const timeKey = dateTimeKeys.length > 0 ? dateTimeKeys[0] : columns[0];
    
    // Find numeric columns for metrics
    const metrics = columns.filter(col => {
      const value = firstRow[col];
      return typeof value === 'number' && col !== timeKey;
    });
    
    // Format data for chart
    const chartData = data.map(item => {
      const formattedItem = { ...item };
      
      // Format date values if needed
      if (dateTimeKeys.includes(timeKey)) {
        const dateValue = item[timeKey];
        if (dateValue && typeof dateValue === 'string') {
          // Try to parse as date and format it
          try {
            const date = new Date(dateValue);
            formattedItem[timeKey] = date.toLocaleDateString();
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
      }
      
      return formattedItem;
    });
    
    return { chartData, metrics, timeKey };
  }, [data]);
  
  if (chartData.length === 0 || !timeKey) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        No suitable data for line chart
      </div>
    );
  }
  
  const colors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={timeKey} 
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
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
              name={metric}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
