'use client';

import React from 'react';
import {
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { VisualizationType } from './visualization-types';

// Use the imported type
interface VisualizationProps {
  data: any[];
  type: VisualizationType;
  title?: string;
}

export function Visualization({ data, type, title }: VisualizationProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted p-4">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  switch (type) {
    case 'highlight':
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-4xl font-bold mt-2">
            {typeof data[0]?.value === 'number' ? data[0].value.toLocaleString() : data[0]?.value || 'N/A'}
          </p>
        </div>
      );

    case 'line-chart':
      return (
        <div className="h-full p-4">
          <p className="text-center mb-2">{title}</p>
          <div className="border p-4 rounded-md h-[80%] flex flex-col justify-center">
            <p className="text-center text-sm text-muted-foreground">Line Chart Visualization</p>
            <div className="text-xs text-muted-foreground mt-2 max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>
      );

    case 'bar-chart':
      return (
        <div className="h-full p-4">
          <p className="text-center mb-2">{title}</p>
          <div className="border p-4 rounded-md h-[80%] flex flex-col justify-center">
            <p className="text-center text-sm text-muted-foreground">Bar Chart Visualization</p>
            <div className="text-xs text-muted-foreground mt-2 max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>
      );

    case 'table':
    default:
      // If data is empty or not an array, show empty state
      if (!Array.isArray(data) || data.length === 0) {
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data available</p>
          </div>
        );
      }

      // Extract column names from the first item
      const columns = Object.keys(data[0]);

      return (
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column}`}>
                      {typeof row[column] === 'object' 
                        ? JSON.stringify(row[column]) 
                        : row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
  }
}
