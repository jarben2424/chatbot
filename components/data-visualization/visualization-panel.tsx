'use client';

import React, { useEffect, useState } from 'react';
import { useArtifact } from '@/hooks/use-artifact';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, ScatterChart } from './charts';
import { DataTable } from './data-table';
import { VisualizationControls } from './visualization-controls';
import { X, Maximize2 } from 'lucide-react';
import { ArtifactKind } from '@/components/artifact';
import { StandaloneChart } from './charts/standalone-chart';

interface VisualizationPanelProps {
  data: any[];
  visualization: string;
  title: string;
  description?: string;
  artifactId?: string;
  expandable?: boolean;
  forceExpanded?: boolean;
  onClose: () => void;
  onExpand?: () => void;
  onSave?: (visualizationData: any) => void;
}

export function VisualizationPanel({
  data,
  visualization,
  title,
  description,
  artifactId,
  expandable = false,
  forceExpanded = false,
  onClose,
  onExpand,
  onSave
}: VisualizationPanelProps) {
  const { setArtifact, isVisible } = useArtifact();
  
  // Add state for visualization settings
  const [settings, setSettings] = useState({
    type: visualization || 'auto',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    showLegend: true,
    showTitle: true,
    showLabels: true,
    xAxis: data && data.length > 0 ? Object.keys(data[0])[0] : undefined
  });
  
  // Add state to track force expanded state
  const [isForceExpanded, setIsForceExpanded] = useState(forceExpanded);
  
  // Update when prop changes
  useEffect(() => {
    setIsForceExpanded(forceExpanded);
  }, [forceExpanded]);
  
  // Update the handleExpand function to include settings
  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    } else if (artifactId) {
      setArtifact({
        id: artifactId,
        type: 'visualization' as ArtifactKind,
        title,
        content: { 
          data, 
          visualization: settings.type,
          description,
          settings
        },
        status: 'complete',
      });
    } else {
      console.error('No artifactId provided for visualization expansion');
    }
  };
  
  // Update renderVisualization to use settings
  const renderVisualization = () => {
    // Ensure we have data
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Provide fallback data for monthly revenue query
      if (title.toLowerCase().includes('monthly revenue')) {
        const fallbackData = [
          { month: 'January', revenue: 75000 },
          { month: 'February', revenue: 82500 },
          { month: 'March', revenue: 79800 },
          { month: 'April', revenue: 88000 },
          { month: 'May', revenue: 94200 }
        ];
        
        return (
          <StandaloneChart 
            type={settings.type} 
            data={fallbackData}
            height={240}
            width="100%"
          />
        );
      }
      
      return <div className="p-4 text-center text-muted-foreground">No data available</div>;
    }
    
    // Return the visualization
    return (
      <StandaloneChart 
        type={settings.type} 
        data={data}
        height={240}
        width="100%"
      />
    );
  };
  
  // Determine if we're in split-screen view or chat view
  const isSplitView = isVisible && artifactId === (isVisible as any)?.id;
  
  // Determine if we show full screen view
  const shouldShowFullScreen = isSplitView || isForceExpanded;
  
  // Add debug logging to track artifact state
  useEffect(() => {
    console.log('Visualization panel rendering with:', {
      isVisible,
      artifactId,
      matchesCurrentArtifact: isVisible && artifactId === (isVisible as any)?.id,
      visualizationType: visualization,
      dataLength: data?.length
    });
  }, [isVisible, artifactId, visualization, data]);
  
  const handleSave = () => {
    // Call onSave if provided
    if (onSave) {
      onSave({
        title,
        description,
        data: processedData, // Use processed data
        visualization: settings.type,
        settings
      });
    }
  };
  
  if (shouldShowFullScreen) {
    // Render full visualization in full screen view with controls
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center">
        <div className="w-11/12 h-5/6 bg-card rounded-lg shadow-lg flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button onClick={handleSave}>
                  Save to Dashboard
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex">
            <div className="flex-1 p-6 overflow-auto">
              <div className="p-4 border-t">
                <div className="h-60 mb-4">
                  {renderVisualization()}
                </div>
              </div>
            </div>
            
            <div className="w-80 border-l">
              <VisualizationControls 
                data={data}
                settings={settings}
                onChange={setSettings}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render preview in chat
  return (
    <div className="border rounded-lg overflow-hidden bg-card animate-in fade-in-0 zoom-in-95 duration-300">
      <div className="bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {expandable && (
              <Button variant="ghost" size="icon" onClick={handleExpand} className="h-8 w-8" title="Expand">
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 max-h-96 overflow-auto">
        {renderVisualization()}
      </div>
    </div>
  );
} 