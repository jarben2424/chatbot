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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

// Interface definitions
interface ShadcnVisualizationProps {
  data: any[] | TransformedChartData;
  type: string | VisualizationType;
  title?: string;
  description?: string;
  loading?: boolean;
}

// Interface for data transformed with xKey and yKeys (used in chat interface)
interface TransformedChartData {
  data: any[];
  xKey: string;
  yKeys: string[];
}

function NoDataFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
      <p>No data available</p>
    </div>
  );
}

export function ShadcnVisualization({ data, type, title, description, loading }: ShadcnVisualizationProps) {
  // Handle loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-40 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Handle empty data case
  if (!data || 
      (Array.isArray(data) && data.length === 0) || 
      (!Array.isArray(data) && 'data' in data && data.data.length === 0)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // For highlight visualization (single value metric)
  if (type === 'highlight') {
    if (Array.isArray(data) && data.length === 1 && Object.keys(data[0]).length === 1) {
      const key = Object.keys(data[0])[0];
      const value = data[0][key];
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">{key}</p>
          <h2 className="text-4xl font-bold">{value}</h2>
        </div>
      );
    }
    return <NoDataFallback />;
  }
  
  // For line visualization
  if (type === 'line' || type === 'line-chart') {
    // Handle transformed data from chat interface
    if (!Array.isArray(data) && 'xKey' in data && 'yKeys' in data && Array.isArray(data.data)) {
      // Use the transformed data format
      const transformedData = data as TransformedChartData;
      return (
        <div className="w-full h-full" style={{ minHeight: '250px' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <LineChart data={transformedData.data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={transformedData.xKey} 
                angle={-45} 
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format date to MM-DD
                  if (value && typeof value === 'string' && value.includes('-')) {
                    const parts = value.split('-');
                    if (parts.length >= 3) {
                      return `${parts[1]}-${parts[2].split(' ')[0]}`;
                    }
                  }
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {transformedData.yKeys.map((key: string, index: number) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key.replace(/_/g, ' ')}
                  stroke={getColor(index)}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    // Handle raw data array from the dashboard
    const dataArray = Array.isArray(data) ? data : [];
    
    // Need to determine the keys from the raw data
    if (dataArray.length === 0) return <NoDataFallback />;
    
    const columns = Object.keys(dataArray[0]);
    
    // Find time-based column for x-axis
    const timeColumn = columns.find(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('year') ||
      col.toLowerCase().includes('month') ||
      col.toLowerCase().includes('day') ||
      col.toLowerCase().includes('week')
    ) || columns[0]; // Default to first column
    
    // Find numeric columns for y-axis
    const numericColumns = columns.filter(col => {
      const value = dataArray[0][col];
      return typeof value === 'number' && col !== timeColumn;
    });
    
    return (
      <div className="w-full h-full" style={{ minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <LineChart data={dataArray} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={timeColumn} 
              angle={-45} 
              textAnchor="end"
              height={50}
              interval={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Format date to MM-DD
                if (value && typeof value === 'string' && value.includes('-')) {
                  const parts = value.split('-');
                  if (parts.length >= 3) {
                    return `${parts[1]}-${parts[2].split(' ')[0]}`;
                  }
                }
                return value;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {numericColumns.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.replace(/_/g, ' ')}
                stroke={getColor(index)}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  // For bar visualization
  if (type === 'bar' || type === 'bar-chart') {
    // Handle transformed data from chat interface
    if (!Array.isArray(data) && 'xKey' in data && 'yKeys' in data && Array.isArray(data.data)) {
      // Use the transformed data format
      const transformedData = data as TransformedChartData;
      return (
        <div className="w-full h-full" style={{ minHeight: '250px' }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <BarChart data={transformedData.data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={transformedData.xKey} 
                angle={-45} 
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format date to MM-DD
                  if (value && typeof value === 'string' && value.includes('-')) {
                    const parts = value.split('-');
                    if (parts.length >= 3) {
                      return `${parts[1]}-${parts[2].split(' ')[0]}`;
                    }
                  }
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {transformedData.yKeys.map((key: string, index: number) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  name={key.replace(/_/g, ' ')}
                  fill={getColor(index)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    // Handle raw data array from the dashboard
    const dataArray = Array.isArray(data) ? data : [];
    
    // Need to determine the keys from the raw data
    if (dataArray.length === 0) return <NoDataFallback />;
    
    const columns = Object.keys(dataArray[0]);
    
    // Find categorical column for x-axis (non-numeric)
    const numericColumns = columns.filter(col => {
      const value = dataArray[0][col];
      return typeof value === 'number';
    });
    
    const categoricalColumns = columns.filter(col => !numericColumns.includes(col));
    const categoryKey = categoricalColumns[0] || columns[0]; // Use first non-numeric column, fallback to first column
    
    return (
      <div className="w-full h-full" style={{ minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart data={dataArray} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={categoryKey} 
              angle={-45} 
              textAnchor="end"
              height={50}
              interval={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Format date to MM-DD
                if (value && typeof value === 'string' && value.includes('-')) {
                  const parts = value.split('-');
                  if (parts.length >= 3) {
                    return `${parts[1]}-${parts[2].split(' ')[0]}`;
                  }
                }
                return value;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {numericColumns.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                name={key.replace(/_/g, ' ')}
                fill={getColor(index)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  // For table visualization
  if (type === 'table') {
    // Format cell values for display in the table
    const formatCellValue = (value: any) => {
      if (value === null || value === undefined) {
        return '-';
      }
      if (typeof value === 'number') {
        return value.toLocaleString();
      }
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      return String(value);
    };
    
    const dataArray = Array.isArray(data) ? data : (!Array.isArray(data) && 'data' in data) ? data.data : [];
    
    if (dataArray.length === 0) return <NoDataFallback />;
    
    const columns = Object.keys(dataArray[0]);
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col.replace(/_/g, ' ')}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataArray.slice(0, 10).map((row: Record<string, any>, i: number) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {formatCellValue(row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  // Default case - just return the raw data
  return <NoDataFallback />;
}

// Function to get color (matching the one in query-result-visualization.tsx)
const getColor = (index: number) => {
  const colors = ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
  return colors[index % colors.length];
};
