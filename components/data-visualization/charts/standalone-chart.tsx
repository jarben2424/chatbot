'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DataTable } from '../data-table';
import { cn } from '@/lib/utils';

interface StandaloneChartProps {
  data: any[];
  type: string;
  colors?: string[];
  title?: string;
  description?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
}

export function StandaloneChart({
  data = [],
  type = 'bar',
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  title,
  description,
  showLegend = true,
  showGrid = true,
  className,
}: StandaloneChartProps) {
  // If no data, show a placeholder
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground h-full w-full", className)}>
        No data available to visualize
      </div>
    );
  }

  // Get the keys from the first data object for axes
  const keys = Object.keys(data[0] || {}).filter(key => 
    typeof data[0][key] === 'number'
  );
  
  const stringKeys = Object.keys(data[0] || {}).filter(key => 
    typeof data[0][key] === 'string'
  );
  
  // Define a default x-axis (first string column)
  const xAxisKey = stringKeys[0] || 'index';
  
  // Use the remaining numeric keys for data series
  const dataKeys = keys;
  
  // Render the appropriate chart based on type
  switch (type) {
    case 'bar':
      return (
        <div className={cn("w-full h-full", className)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={colors[index % colors.length]} 
                  radius={[4, 4, 0, 0]}
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
      
    case 'line':
      return (
        <div className={cn("w-full h-full", className)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
      
    case 'pie':
      // For pie charts, transform data
      const pieData = dataKeys.map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: data.reduce((sum, item) => sum + (item[key] || 0), 0),
      }));
      
      return (
        <div className={cn("w-full h-full", className)}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}`, '']}
              />
              {showLegend && <Legend layout="vertical" align="right" verticalAlign="middle" />}
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
      
    case 'scatter':
      // Take the first two numeric keys for scatter plot
      const xKey = dataKeys[0];
      const yKey = dataKeys[1] || dataKeys[0];
      
      return (
        <div className={cn("w-full h-full", className)}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                type="number" 
                dataKey={xKey} 
                name={xKey.charAt(0).toUpperCase() + xKey.slice(1)}
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                type="number" 
                dataKey={yKey} 
                name={yKey.charAt(0).toUpperCase() + yKey.slice(1)}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
              <Scatter 
                name={`${xKey} vs ${yKey}`} 
                data={data} 
                fill={colors[0]} 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
      
    case 'table':
    default:
      return (
        <div className={cn("w-full h-full overflow-auto", className)}>
          <DataTable data={data} />
        </div>
      );
  }
} 