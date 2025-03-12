'use client';

import React from 'react';
import {
  Bar,
  Line,
  Pie,
  Scatter,
  PieChart,
  BarChart,
  LineChart,
  ScatterChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { DataTable } from './data-table';

interface StandaloneChartProps {
  type: string;
  data: any[];
  width?: string | number;
  height?: string | number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  xAxis?: string;
  showLabels?: boolean;
}

export function StandaloneChart({
  type,
  data,
  width = '100%',
  height = 300,
  showLegend = true,
  showGrid = true,
  colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'],
  xAxis,
  showLabels = true
}: StandaloneChartProps) {
  // If no data or empty data, render placeholder
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/10 rounded-md">
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }
  
  // Determine data keys excluding the x-axis
  const dataKeys = Object.keys(data[0]).filter(key => key !== xAxis);
  
  // Format data for Pie chart
  const getPieData = () => {
    if (dataKeys.length === 0 || !xAxis) return data;
    
    return data.map(item => ({
      name: item[xAxis],
      value: Number(item[dataKeys[0]]) || 0
    }));
  };
  
  // Table view
  if (type === 'table') {
    return <DataTable data={data} />;
  }
  
  return (
    <ResponsiveContainer width={width} height={height}>
      {type === 'bar' ? (
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {xAxis && <XAxis dataKey={xAxis} />}
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          {dataKeys.slice(0, 5).map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={colors[index % colors.length]} 
              name={key}
              label={showLabels ? { position: 'top', fontSize: 10 } : false}
            />
          ))}
        </BarChart>
      ) : type === 'line' ? (
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {xAxis && <XAxis dataKey={xAxis} />}
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          {dataKeys.slice(0, 5).map((key, index) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={colors[index % colors.length]} 
              name={key}
              dot={showLabels}
            />
          ))}
        </LineChart>
      ) : type === 'pie' ? (
        <PieChart>
          <Pie
            data={getPieData()}
            cx="50%"
            cy="50%"
            labelLine={showLabels}
            label={showLabels ? { fill: '#888', fontSize: 12 } : false}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
          >
            {getPieData().map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </PieChart>
      ) : type === 'scatter' ? (
        <ScatterChart>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey={xAxis} 
            type="number" 
            name={xAxis}
          />
          <YAxis dataKey={dataKeys[0]} name={dataKeys[0]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          {showLegend && <Legend />}
          <Scatter 
            data={data} 
            fill={colors[0]} 
            name={dataKeys[0]}
          />
        </ScatterChart>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Unsupported chart type</p>
        </div>
      )}
    </ResponsiveContainer>
  );
} 