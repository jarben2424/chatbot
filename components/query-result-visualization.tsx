'use client';

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableIcon, BarChartIcon, LineChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HighlightCard } from './dashboard/highlight-card';

type VisualizationType = 'line-chart' | 'bar-chart' | 'highlight' | 'table';

interface QueryResultVisualizationProps {
  data: any;
  query?: string;
  className?: string;
  visualizationType?: string;
}

export function QueryResultVisualization({
  data,
  query,
  className,
  visualizationType
}: QueryResultVisualizationProps) {
  // Determine the initial view type based on the data structure or provided type
  const initialViewType = visualizationType || getInitialViewType(data);
  const [viewType, setViewType] = useState<VisualizationType>(initialViewType as VisualizationType);

  // Function to determine the best initial view based on the data structure
  function getInitialViewType(data: any): VisualizationType {
    if (!data) return 'table';
    
    // Check if it's in the format returned by our transformation functions
    if (data.xKey && data.yKeys && data.data) {
      // Check if it's a line chart data structure
      if (data.xKey.toLowerCase().includes('date') || 
          data.xKey.toLowerCase().includes('time') ||
          data.xKey.toLowerCase().includes('year') ||
          data.xKey.toLowerCase().includes('month')) {
        return 'line-chart';
      }
      
      // Otherwise it's probably a bar chart
      return 'bar-chart';
    }

    // Check if it's highlight data
    if (data.value !== undefined && data.label) {
      return 'highlight';
    }
    
    // Default to table view for raw data
    return 'table';
  }

  // Function to get color for charts
  const getColor = (index: number) => {
    const colors = [
      '#2563eb', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#14b8a6', // teal
    ];
    return colors[index % colors.length];
  };

  // Render based on the view type and data structure
  const renderVisualization = () => {
    if (!data) return <div>No data available</div>;

    // For highlight/KPI style single value
    if (viewType === 'highlight' || (data.value !== undefined && data.label)) {
      return (
        <HighlightCard value={data.value} label={data.label} />
      );
    }

    // For line chart visualization
    if (viewType === 'line-chart' && data.data && data.xKey && data.yKeys) {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={data.xKey} 
              angle={-45} 
              textAnchor="end"
              height={70}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.yKeys.map((key: string, index: number) => (
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
      );
    }

    // For bar chart visualization
    if (viewType === 'bar-chart' && data.data && data.xKey && data.yKeys) {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={data.xKey}
              angle={-45} 
              textAnchor="end"
              height={70}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.yKeys.map((key: string, index: number) => (
              <Bar 
                key={key}
                dataKey={key} 
                name={key.replace(/_/g, ' ')}
                fill={getColor(index)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Default table view for raw data or when table view is selected
    return renderTableView();
  };

  // Render data as a table
  const renderTableView = () => {
    // If it's transformed data format, use the data array
    const tableData = data.data && Array.isArray(data.data) ? data.data : 
                       Array.isArray(data) ? data : [];
    
    if (tableData.length === 0) return <div>No data available</div>;
    
    const columns = Object.keys(tableData[0]);
    
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
            {tableData.map((row: Record<string, any>, i: number) => (
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
  };

  // Format cell values for display in the table
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object' && value !== null) {
      // Format Date objects or try to stringify objects
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Complex Object]';
      }
    }
    return String(value);
  };

  // Return the visualization component with view toggle options
  return (
    <Card className={cn("", className)}>
      {query && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Query Results</CardTitle>
          <CardDescription className="text-xs font-mono whitespace-pre-wrap">
            {query}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex justify-end mb-4 space-x-2">
          {/* Only show relevant toggles based on the data structure */}
          {(data?.data && data?.xKey && data?.yKeys) && (
            <>
              <Button 
                variant={viewType === 'line-chart' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewType('line-chart')}
              >
                <LineChartIcon className="h-4 w-4 mr-2" />
                Line
              </Button>
              <Button 
                variant={viewType === 'bar-chart' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewType('bar-chart')}
              >
                <BarChartIcon className="h-4 w-4 mr-2" />
                Bar
              </Button>
            </>
          )}
          <Button 
            variant={viewType === 'table' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewType('table')}
          >
            <TableIcon className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>
        
        {renderVisualization()}
      </CardContent>
    </Card>
  );
}
