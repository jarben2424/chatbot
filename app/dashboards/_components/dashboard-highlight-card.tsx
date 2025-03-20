import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MoreHorizontal, Trash2 } from 'lucide-react';
import { ShadcnVisualization } from './visualizations/shadcn-visualization';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VisualizationType } from '@/lib/local-storage';

interface DashboardHighlightCardProps {
  id: string;
  title: string;
  description: string;
  visualizationType: string | VisualizationType;
  data?: any;
  isLoading: boolean;
  onRunQuery: () => void;
  showActions?: boolean;
  onDelete?: () => void;
}

export function DashboardHighlightCard({
  id,
  title,
  description,
  visualizationType,
  data,
  isLoading,
  onRunQuery,
  showActions = false,
  onDelete,
}: DashboardHighlightCardProps) {
  // Determine the highlight value for highlight cards
  const highlightValue = useMemo(() => {
    if (visualizationType !== 'highlight' || !data || isLoading) return null;
    
    // For highlight cards, find the first non-null value
    if (Array.isArray(data) && data.length > 0) {
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      if (keys.length === 0) return null;
      
      // Just extract the first non-null value, regardless of the key
      const valueKey = keys.find(key => firstRow[key] !== null) || keys[0];
      const value = firstRow[valueKey];
      
      // Format the value based on type
      if (typeof value === 'number') {
        return value % 1 === 0 
          ? value.toLocaleString() 
          : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return String(value || '0');
    }
    return null;
  }, [data, visualizationType, isLoading]);

  // Determine the type for shadcn visualization
  const shadcnVisualizationType = useMemo(() => {
    if (typeof visualizationType === 'string') {
      if (visualizationType === 'line-chart') return 'line';
      if (visualizationType === 'bar-chart') return 'bar';
      return visualizationType as VisualizationType;
    }
    return visualizationType;
  }, [visualizationType]);

  const isChartType = 
    (typeof visualizationType === 'string' && 
     (visualizationType === 'line-chart' || visualizationType === 'bar-chart' || visualizationType === 'table'));
  
  const isHighlightType = 
    (typeof visualizationType === 'string' && visualizationType === 'highlight') || 
    shadcnVisualizationType === 'highlight';

  return (
    <Card className="overflow-hidden bg-white shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium truncate">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1">
            <RefreshCw 
              onClick={() => onRunQuery?.()}
              className={`h-4 w-4 cursor-pointer text-muted-foreground ${isLoading ? 'animate-spin' : 'hover:text-primary'}`}
            />
            {onDelete && (
              <Trash2
                onClick={() => onDelete()}
                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-red-500"
              />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-8 w-2/3 mx-auto bg-gray-200 rounded"></div>
              <div className={`${isHighlightType ? 'h-16' : 'h-40'} w-full bg-gray-100 rounded`}></div>
            </div>
          </div>
        ) : (
          <>
            {isHighlightType ? (
              highlightValue !== null ? (
                <h3 className="text-4xl font-bold tracking-tight mt-6">{highlightValue}</h3>
              ) : (
                <div className="h-16 flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )
            ) : (
              <div className={`w-full h-full`}>
                <ShadcnVisualization
                  type={shadcnVisualizationType}
                  data={data}
                  title={title}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
