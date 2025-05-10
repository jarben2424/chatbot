'use client';

import React from 'react';

// Simplified chart components for demonstration
// In a real app, you'd use a charting library like recharts, chart.js, or d3

interface ChartProps {
  data: any[];
}

export function BarChart({ data }: ChartProps) {
  // Basic rendering of a bar chart using div elements
  const maxValue = Math.max(...data.map(item => 
    Math.max(...Object.values(item).filter(val => typeof val === 'number'))));
  
  return (
    <div className="w-full p-4">
      <div className="flex flex-col space-y-2">
        {data.map((item, index) => {
          const valueKey = Object.keys(item).find(key => typeof item[key] === 'number');
          const labelKey = Object.keys(item).find(key => typeof item[key] === 'string');
          
          if (!valueKey || !labelKey) return null;
          
          const value = item[valueKey];
          const label = item[labelKey];
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-24 text-sm truncate">{label}</div>
              <div className="flex-1">
                <div 
                  className="h-6 bg-blue-500 rounded"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm">{value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineChart({ data }: ChartProps) {
  // For now, we'll display a message instead of implementing a complex line chart
  return (
    <div className="w-full p-4 border rounded flex items-center justify-center h-64 bg-muted/20">
      <p className="text-muted-foreground">Line Chart Visualization</p>
      <p className="text-xs text-muted-foreground mt-2">
        Data points: {data.length}
      </p>
    </div>
  );
}

export function PieChart({ data }: ChartProps) {
  // For now, we'll display a simple representation
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-red-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-teal-500'
  ];
  
  const valueKey = data[0] ? Object.keys(data[0]).find(key => typeof data[0][key] === 'number') : null;
  const labelKey = data[0] ? Object.keys(data[0]).find(key => typeof data[0][key] === 'string') : null;
  
  if (!valueKey || !labelKey) {
    return <div>Invalid data format for pie chart</div>;
  }
  
  const total = data.reduce((sum, item) => sum + (typeof item[valueKey] === 'number' ? item[valueKey] : 0), 0);
  
  return (
    <div className="w-full p-4">
      <div className="flex flex-col space-y-2">
        {data.map((item, index) => {
          const value = item[valueKey];
          const label = item[labelKey];
          const percentage = (value / total) * 100;
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`} />
              <div className="flex-1">
                <div className="text-sm">{label}</div>
              </div>
              <div className="text-sm font-medium">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScatterChart({ data }: ChartProps) {
  // For now, we'll display a message instead of implementing a complex scatter chart
  return (
    <div className="w-full p-4 border rounded flex items-center justify-center h-64 bg-muted/20">
      <p className="text-muted-foreground">Scatter Plot Visualization</p>
      <p className="text-xs text-muted-foreground mt-2">
        Data points: {data.length}
      </p>
    </div>
  );
} 