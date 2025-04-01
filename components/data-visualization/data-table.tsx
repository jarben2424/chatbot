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

type ColumnType = 'unknown' | 'date' | 'currency' | 'percentage' | 'number' | 'string';

interface DataTableProps {
  data: any[];
}

export function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No data to display</div>;
  }

  // Get column headers from the first data object
  const columns = Object.keys(data[0]);
  
  // Determine column types for better formatting
  const columnTypes = columns.reduce<Record<string, ColumnType>>((types, column) => {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    
    if (nonNullValues.length === 0) {
      return { ...types, [column]: 'unknown' };
    }
    
    // Check if column contains dates
    const isDate = nonNullValues.some(value => {
      return typeof value === 'string' && 
             !isNaN(Date.parse(value)) && 
             value.match(/^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{4}/);
    });
    
    if (isDate) {
      return { ...types, [column]: 'date' };
    }
    
    // Check if column contains numeric values
    const isNumeric = nonNullValues.every(value => 
      typeof value === 'number' || 
      (typeof value === 'string' && !isNaN(Number(value.toString().replace(/[^0-9.-]+/g, ''))))
    );
    
    if (isNumeric) {
      // Determine if it's currency
      const isCurrency = column.toLowerCase().includes('price') || 
                         column.toLowerCase().includes('revenue') || 
                         column.toLowerCase().includes('cost') ||
                         column.toLowerCase().includes('sales') ||
                         column.toLowerCase().includes('profit') ||
                         column.toLowerCase().includes('income') ||
                         column.toLowerCase().includes('expense');
                         
      const isPercentage = column.toLowerCase().includes('percent') || 
                           column.toLowerCase().includes('rate') ||
                           column.toLowerCase().includes('ratio');
                           
      if (isCurrency) {
        return { ...types, [column]: 'currency' };
      } else if (isPercentage) {
        return { ...types, [column]: 'percentage' };
      } else {
        return { ...types, [column]: 'number' };
      }
    }
    
    return { ...types, [column]: 'string' };
  }, {});

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{formatColumnHeader(column)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column) => (
              <TableCell 
                key={`${rowIndex}-${column}`} 
                className={columnTypes[column] === 'number' || 
                          columnTypes[column] === 'currency' ||
                          columnTypes[column] === 'percentage' ? 'text-right' : ''}
              >
                {formatCellValue(row[column], columnTypes[column])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Format column headers for readability
function formatColumnHeader(header: string): string {
  // Convert snake_case or camelCase to Title Case with spaces
  return header
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

// Helper function to format cell values
function formatCellValue(value: any, type: ColumnType): React.ReactNode {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  switch (type) {
    case 'date':
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    
    case 'currency':
      try {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          maximumFractionDigits: 2
        }).format(Number(value.toString().replace(/[^0-9.-]+/g, '')));
      } catch {
        return value;
      }
    
    case 'percentage':
      try {
        const num = Number(value.toString().replace(/[^0-9.-]+/g, ''));
        // If value is already formatted as percentage (e.g., 0.25 for 25%)
        const formatted = num > 0 && num < 1 ? 
          `${(num * 100).toFixed(2)}%` : 
          `${num.toFixed(2)}%`;
        return formatted;
      } catch {
        return value;
      }
    
    case 'number':
      try {
        return new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2
        }).format(Number(value.toString().replace(/[^0-9.-]+/g, '')));
      } catch {
        return value;
      }
    
    default:
      return String(value);
  }
} 