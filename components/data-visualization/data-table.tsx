'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Search 
} from 'lucide-react';

interface DataTableProps {
  data: any[];
  pageSize?: number;
}

export function DataTable({
  data,
  pageSize = 10
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  // Memoize columns (field names)
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);
  
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter(row => 
      columns.some(column => {
        const value = row[column];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, columns, searchQuery]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key!] === null) return 1;
      if (b[sortConfig.key!] === null) return -1;
      
      const valueA = typeof a[sortConfig.key!] === 'string' 
        ? a[sortConfig.key!].toLowerCase() 
        : a[sortConfig.key!];
        
      const valueB = typeof b[sortConfig.key!] === 'string' 
        ? b[sortConfig.key!].toLowerCase() 
        : b[sortConfig.key!];
      
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIdx = currentPage * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);
  
  // Set up pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  
  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' 
        ? 'desc' 
        : 'asc'
    }));
  };
  
  // Render sort indicator
  const renderSortIndicator = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };
  
  // If no data or columns, show a message
  if (!data || data.length === 0 || columns.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/10 rounded-md">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column} className="cursor-pointer" onClick={() => handleSort(column)}>
                  <div className="flex items-center">
                    {column}
                    {renderSortIndicator(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map(column => (
                  <TableCell key={`${rowIndex}-${column}`}>
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            
            {/* Empty rows for consistent height */}
            {paginatedData.length < pageSize && 
              Array.from({ length: pageSize - paginatedData.length }).map((_, i) => (
                <TableRow key={`empty-${i}`}>
                  {columns.map((column, j) => (
                    <TableCell key={`empty-${i}-${j}`}>&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1}-
            {Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 