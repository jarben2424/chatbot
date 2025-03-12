'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DataTable } from './data-visualization/data-table';
import { BarChart, LineChart, PieChart, ScatterChart } from './data-visualization/charts';
import { Button } from './ui/button';
import { Edit, Maximize } from 'lucide-react';

interface DataVisualizationProps {
  data: any[];
  visualization: 'table' | 'bar' | 'line' | 'pie' | 'scatter' | string;
  title?: string;
  description?: string;
  onEdit?: () => void;
}

export function DataVisualization({
  data,
  visualization,
  title,
  description,
  onEdit
}: DataVisualizationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Function to expand visualization
  const expandVisualization = () => {
    setIsExpanded(true);
  };
  
  // Render the appropriate chart type
  const renderVisualization = () => {
    switch(visualization) {
      case 'bar':
        return <BarChart data={data} />;
      case 'line':
        return <LineChart data={data} />;
      case 'pie':
        return <PieChart data={data} />;
      case 'scatter':
        return <ScatterChart data={data} />;
      default:
        return <DataTable data={data} />;
    }
  };
  
  return (
    <div 
      className={cn(
        "visualization-container rounded-lg border overflow-hidden transition-all duration-500 ease-in-out",
        isLoading ? "blur-sm animate-pulse" : "",
        isExpanded ? "fixed inset-0 z-50 bg-background p-6" : ""
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{title || 'Data Visualization'}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button 
              onClick={onEdit} 
              variant="outline" 
              size="sm"
              className={cn(isLoading ? "opacity-0" : "opacity-100", "transition-opacity duration-300")}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {!isExpanded && (
            <Button 
              onClick={expandVisualization} 
              variant="outline" 
              size="sm"
              className={cn(isLoading ? "opacity-0" : "opacity-100", "transition-opacity duration-300")}
            >
              <Maximize className="h-4 w-4 mr-1" />
              Expand
            </Button>
          )}
        </div>
      </div>
      
      <div className={cn(
        "transition-all duration-500 ease-in-out",
        isExpanded ? "h-[calc(100vh-10rem)]" : "h-[300px]"
      )}>
        {renderVisualization()}
      </div>
      
      {isExpanded && (
        <div className="absolute top-4 right-4">
          <Button onClick={() => setIsExpanded(false)} variant="outline">
            Close
          </Button>
        </div>
      )}
    </div>
  );
} 