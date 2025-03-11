'use client';

import React, { useEffect, useState } from 'react';
import { useArtifact } from '@/hooks/use-artifact';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, ScatterChart } from './charts';
import { DataTable } from './data-table';
import { VisualizationControls } from './visualization-controls';
import { X } from 'lucide-react';
import { ArtifactKind } from '@/components/artifact';
import { StandaloneChart } from './charts/standalone-chart';

interface VisualizationPanelProps {
  data: any[];
  visualization: string;
  title: string;
  description?: string;
  artifactId: string;
  expandable?: boolean;
  forceExpanded?: boolean;
  onClose: () => void;
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
    console.log('Expanding visualization:', {
      artifactId,
      title,
      data: data?.length,
      visualization: settings.type
    });
    
    if (artifactId) {
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
      return <div className="p-4 text-center text-muted-foreground">No data available</div>;
    }

    console.log('Rendering visualization:', {
      type: settings.type,
      dataFirstRow: data[0],
      dataLength: data.length
    });

    // Determine if this is time-series data
    const isTimeSeries = Object.keys(data[0]).some(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('year')
    );

    // For line charts, ensure data is in the right format
    if (settings.type === 'line' && isTimeSeries) {
      // Find the likely time and value columns
      const timeKey = Object.keys(data[0]).find(key => 
        key.toLowerCase().includes('date') || 
        key.toLowerCase().includes('month') || 
        key.toLowerCase().includes('year')
      ) || Object.keys(data[0])[0];
      
      const valueKeys = Object.keys(data[0]).filter(key => 
        typeof data[0][key] === 'number' || 
        (typeof data[0][key] === 'string' && !isNaN(Number(data[0][key].replace(/[^0-9.-]+/g, ''))))
      );

      // Return appropriate chart
      return <LineChart 
        data={data} 
        xAxisKey={timeKey}
        yAxisKeys={valueKeys}
        colors={settings.colors}
        showLegend={settings.showLegend}
      />;
    }

    // Use appropriate visualization based on type
    switch (settings.type === 'auto' ? visualization : settings.type) {
      case 'bar':
        return <BarChart 
          data={data} 
          xAxisKey={Object.keys(data[0])[0]}
          yAxisKeys={Object.keys(data[0]).filter(key => typeof data[0][key] === 'number')}
          colors={settings.colors}
          showLegend={settings.showLegend}
        />;
      case 'line':
        return <LineChart data={data} colors={settings.colors} showLegend={settings.showLegend} />;
      case 'pie':
        return <PieChart data={data} />;
      case 'scatter':
        return <ScatterChart data={data} />;
      case 'auto':
        // Determine best visualization automatically
        if (isTimeSeries) return <LineChart data={data} colors={settings.colors} showLegend={settings.showLegend} />;
        return <BarChart 
          data={data} 
          xAxisKey={Object.keys(data[0])[0]}
          yAxisKeys={Object.keys(data[0]).filter(key => typeof data[0][key] === 'number')}
          colors={settings.colors}
          showLegend={settings.showLegend}
        />;
      case 'table':
      default:
        return <DataTable data={data} />;
    }

    // Add this fallback
    if (settings.type === 'line' || settings.type === 'bar' || settings.type === 'pie') {
      return (
        <StandaloneChart 
          type={settings.type} 
          data={data}
        />
      );
    }
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
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex">
            <div className="flex-1 p-6 overflow-auto">
              {renderVisualization()}
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
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {expandable && (
            <Button size="sm" onClick={handleExpand}>
              Expand
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4 max-h-96 overflow-auto">
        {renderVisualization()}
      </div>
    </div>
  );
} 