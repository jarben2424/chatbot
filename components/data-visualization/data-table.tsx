'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps {
  data: any[];
}

export function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No data to display</div>;
  }

  // Get column headers from the first data object
  const columns = Object.keys(data[0]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell key={`${rowIndex}-${column}`}>
                {formatCellValue(row[column])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Helper function to format cell values
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'number') {
    // Format number with commas for thousands
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  return String(value);
} 