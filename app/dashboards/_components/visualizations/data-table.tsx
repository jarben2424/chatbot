'use client';

import React from 'react';

interface DataTableProps {
  data: any[];
}

export function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        No data to display
      </div>
    );
  }
  
  // Extract column headers from first row
  const columns = Object.keys(data[0]);
  
  return (
    <div className="overflow-auto max-h-64">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            {columns.map((column) => (
              <th key={column} className="p-2 text-left text-xs font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {columns.map((column) => (
                <td key={`${index}-${column}`} className="p-2 text-xs">
                  {typeof row[column] === 'object' 
                    ? JSON.stringify(row[column]) 
                    : String(row[column])
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
