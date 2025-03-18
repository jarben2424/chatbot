import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MoreHorizontal } from 'lucide-react';
import { ShadcnVisualization } from './visualizations/shadcn-visualization';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VisualizationType } from '@/lib/local-storage';

interface DashboardHighlightCardProps {
  id: string;
  title: string;
  description: string;
  visualizationType: string | VisualizationType;
  isLoading: boolean;
  data?: any;
  onRunQuery: () => void;
  showActions?: boolean;
  onDelete?: () => void;
}

export function DashboardHighlightCard({
  id,
  title,
  description,
  visualizationType,
  isLoading,
  data,
  onRunQuery,
  showActions = false,
  onDelete
}: DashboardHighlightCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {showActions && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDelete}>
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data && data.length > 0 ? (
          <>
            <ShadcnVisualization 
              data={data} 
              type={visualizationType}
              title={title}
              description={description}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">No data available</p>
            <Button onClick={onRunQuery} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-3 w-3" />
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
