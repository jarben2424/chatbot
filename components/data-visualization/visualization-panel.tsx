'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useArtifact } from '@/hooks/use-artifact';
import { Button } from '@/components/ui/button';
import { BarChart as ChartBarChart, LineChart, PieChart, ScatterChart } from './charts';
import { DataTable } from './data-table';
import { VisualizationControls } from './visualization-controls';
import { X, Maximize2, FullscreenIcon, BarChart, FileIcon, CopyIcon, UndoIcon, RedoIcon, SparklesIcon, LineChartIcon, Save } from 'lucide-react';
import { ArtifactKind, UIArtifact } from '@/components/artifact';
import { StandaloneChart } from './charts/standalone-chart';
import { cn } from '@/lib/utils';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns';
import { FloatingAnalysisButton } from './floating-analysis-button';
import { toPng } from 'html-to-image';

// Import the VisualizationSettings interface from visualization-controls.tsx
interface VisualizationSettings {
  colors: string[];
  showLegend: boolean;
  showDataLabels: boolean;
  title: string;
  type: string;
  showTitle: boolean;
  showLabels: boolean;
  xAxis?: string;
}

export interface VisualizationPanelProps {
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
  onCaptureChart?: (imageDataUrl: string, chartData: any) => void;
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
  onSave,
  onCaptureChart
}: VisualizationPanelProps) {
  const { setArtifact, artifact } = useArtifact();
  
  // Global CSS to prevent scrollbars and pulsating elements
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.id = 'visualization-editor-styles';
    style.textContent = `
      /* Hide scrollbars while allowing scrolling */
      .visualization-editor-container .controls-wrapper::-webkit-scrollbar,
      .visualization-editor-container *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
      
      .visualization-editor-container .controls-wrapper,
      .visualization-editor-container * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      
      /* Prevent animations that might cause pulsating effects */
      .visualization-editor-container *::after,
      .visualization-editor-container *::before {
        animation: none !important;
        transition: none !important;
      }
    `;
    
    // Add the style to the document
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      const existingStyle = document.getElementById('visualization-editor-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  // App theme colors optimized for visualizations
  const themeColors = [
    'hsl(var(--chart-1, 221 83% 53%))',  // Primary blue
    'hsl(var(--chart-2, 358 84% 56%))',  // Red
    'hsl(var(--chart-3, 160 84% 39%))',  // Green
    'hsl(var(--chart-4, 45 93% 47%))',   // Yellow
    'hsl(var(--chart-5, 262 80% 63%))'   // Purple
  ];
  
  // Add state for visualization settings
  const [settings, setSettings] = useState<VisualizationSettings>({
    type: visualization === 'auto' ? determineBestVisualizationType(data) : visualization,
    colors: themeColors,
    showLegend: true,
    showTitle: true,
    showLabels: true,
    showDataLabels: false,
    title: title,
    xAxis: data && data.length > 0 ? Object.keys(data[0])[0] : undefined
  });
  
  // Add state to track force expanded state
  const [isForceExpanded, setIsForceExpanded] = useState(forceExpanded);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [versionHistory, setVersionHistory] = useState([{
    data, 
    settings,
    timestamp: new Date().toISOString() // Add timestamp to version history
  }]);
  const isCurrentVersion = currentVersionIndex === versionHistory.length - 1;
  // Track if we have any version history
  const hasVersionHistory = versionHistory.length > 1;
  
  // Format data properly for better visualization
  const formattedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    return data.map(item => {
      const result = { ...item };
      // Format numeric values properly
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'number') {
          // Round to whole numbers
          result[key] = Math.round(result[key]);
        } else if (typeof result[key] === 'string' && !isNaN(parseFloat(result[key]))) {
          // Try to convert string numbers to actual numbers and round
          result[key] = Math.round(parseFloat(result[key]));
        }
      });
      return result;
    });
  }, [data]);
  
  // Update when prop changes
  useEffect(() => {
    setIsForceExpanded(forceExpanded);
  }, [forceExpanded]);
  
  // Function to determine best visualization type based on data structure
  function determineBestVisualizationType(data: any[]): string {
    if (!data || !Array.isArray(data) || data.length === 0) return 'bar';
    
    // Look for date columns and numeric columns
    const sample = data[0];
    const hasDateColumn = Object.keys(sample).some(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('year') ||
      (typeof sample[key] === 'string' && !isNaN(Date.parse(sample[key])))
    );
    
    const numericColumns = Object.keys(sample).filter(key => 
      typeof sample[key] === 'number' || 
      (typeof sample[key] === 'string' && !isNaN(Number(sample[key].toString().replace(/[^0-9.-]+/g, ''))))
    );
    
    if (hasDateColumn && numericColumns.length > 0) {
      return 'line'; // Time series data = line chart
    } else if (numericColumns.length >= 2) {
      return 'bar'; // Multiple numeric columns = bar chart
    } else if (data.length <= 6 && numericColumns.length === 1) {
      return 'pie'; // Few categories with one value = pie chart
    }
    
    return 'bar'; // Default to bar chart
  }
  
  // Handle version changes
  const handleVersionChange = (type: 'next' | 'prev') => {
    if (type === 'prev' && currentVersionIndex > 0) {
      setCurrentVersionIndex(currentVersionIndex - 1);
    } else if (type === 'next' && currentVersionIndex < versionHistory.length - 1) {
      setCurrentVersionIndex(currentVersionIndex + 1);
    }
  };
  
  // Add a version to history when settings change
  const handleSettingsChange = (newSettings: VisualizationSettings) => {
    setSettings(newSettings);
    
    // Only add to history if at latest version
    if (isCurrentVersion) {
      setVersionHistory([...versionHistory, {
        data, 
        settings: newSettings,
        timestamp: new Date().toISOString() // Add timestamp to version history
      }]);
      setCurrentVersionIndex(versionHistory.length);
    }
  };
  
  // Update the handleExpand function to include settings and add transition
  const handleExpand = () => {
    setIsTransitioning(true);
    
    try {
      // Dispatch an event to notify that visualization is being expanded
      const expandEvent = new CustomEvent('visualizationExpanded', {
        detail: { 
          artifactId: artifactId,
          isFullScreen: true
        }
      });
      
      window.dispatchEvent(expandEvent);
    } catch (error) {
      console.error('Error dispatching visualization expansion event:', error);
    }
    
    setTimeout(() => {
      if (onExpand) {
        onExpand();
      } else if (artifactId) {
        const timestamp = new Date().toISOString();
        setDocumentTimestamp(timestamp); // Update local timestamp immediately
        
        // Ensure we have data to display
        console.log('Expanding visualization with data:', {
          dataLength: data?.length,
          data: data?.slice(0, 2), // First 2 items for debugging
          settings
        });
        
        // Create reference to the rendered visualization (if any) to get its position
        const vizElement = document.querySelector('.chart-container') || document.querySelector('.border.rounded-lg');
        const rect = vizElement ? vizElement.getBoundingClientRect() : null;
        
        // Parse any existing content from the artifact if available
        let existingContent;
        if (artifact && artifact.content) {
          try {
            existingContent = JSON.parse(artifact.content);
            console.log('Existing artifact content:', existingContent);
          } catch (e) {
            console.error('Error parsing artifact content:', e);
          }
        }
        
        // Create the artifact with reference to the document
        setArtifact({
          documentId: artifactId,
          kind: 'visualization' as ArtifactKind,
          title,
          content: JSON.stringify({
            data: data, // Use the current data directly
            visualization: settings.type,
            description,
            timestamp,
            settings,
            lastModified: timestamp
          }),
          status: 'idle',
          isVisible: true,
          boundingBox: rect ? {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          } : {
            top: 0,
            left: 0,
            width: 400,
            height: 300
          }
        });
        
        // Create a document record to ensure timestamp works
        fetch(`/api/document?id=${artifactId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            content: JSON.stringify({
              data,
              visualization: settings.type,
              description,
              settings,
              timestamp,
              lastModified: timestamp
            }),
            kind: 'visualization',
            createdAt: timestamp // This ensures the timestamp is stored correctly
          }),
        }).catch(error => {
          console.error('Error creating document:', error);
        });
        
        // Force a revalidation of the document
        setTimeout(() => {
          fetch(`/api/document?id=${artifactId}`).catch(console.error);
        }, 100);
      }
      
      setIsTransitioning(false);
    }, 150);
  };
  
  const handleClose = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onClose();
      setIsTransitioning(false);
    }, 150);
  };
  
  // Handle chart data export
  const handleExportData = () => {
    try {
      // Convert visualization data to CSV format
      const headers = Object.keys(formattedData[0] || {}).join(',');
      const rows = formattedData.map(row => 
        Object.values(row).map(val => typeof val === 'string' ? `"${val}"` : val).join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      
      // Copy to clipboard
      navigator.clipboard.writeText(csvContent);
      toast.success('Chart data copied to clipboard');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export chart data');
    }
  };
  
  // Update renderVisualization to use settings
  const renderVisualization = () => {
    console.log('Rendering visualization with settings:', {
      shouldShowFullScreen,
      hasData: !!data && Array.isArray(data) && data.length > 0,
      hasFormattedData: !!formattedData && formattedData.length > 0,
      dataLength: data?.length,
      formattedDataLength: formattedData?.length,
      type: settings.type,
      artifact: artifact?.content ? 'Has artifact content' : 'No artifact content',
      title
    });

    // First, always prefer the data passed directly to the component
    if (data && Array.isArray(data) && data.length > 0) {
      const chartType = settings.type === 'auto' ? determineBestVisualizationType(data) : settings.type;
      
      console.log('Using data from props:', {
        dataLength: data.length,
        formattedDataLength: formattedData.length,
        chartType
      });

      return (
        <StandaloneChart 
          type={chartType}
          data={formattedData}
          height={shouldShowFullScreen ? 650 : 215}
          width="100%"
          startYAxisFromZero={true}
          formatNumbers={true}
          colors={settings.colors}
          showLegend={settings.showLegend}
          showDataLabels={settings.showDataLabels}
          title={settings.showTitle ? settings.title : undefined}
        />
      );
    }
    
    // Then try to get data from the artifact if available
    if (shouldShowFullScreen && artifact && artifact.content) {
      try {
        // Try to get data from the artifact content
        const parsedContent = JSON.parse(artifact.content);
        console.log('Using data from artifact:', {
          artifactId: artifact.documentId,
          title: artifact.title,
          contentDataLength: parsedContent.data?.length
        });
        
        // Use artifact data if available
        let chartData = parsedContent.data;
        
        // If we have valid data from the artifact, use it
        if (chartData && Array.isArray(chartData) && chartData.length > 0) {
          // Format the data
          const formattedChartData = chartData.map(item => {
            const result = { ...item };
            // Format numeric values properly
            Object.keys(result).forEach(key => {
              if (typeof result[key] === 'number') {
                // Round to whole numbers
                result[key] = Math.round(result[key]);
              } else if (typeof result[key] === 'string' && !isNaN(parseFloat(result[key]))) {
                // Try to convert string numbers to actual numbers and round
                result[key] = Math.round(parseFloat(result[key]));
              }
            });
            return result;
          });
          
          const chartType = settings.type === 'auto' ? determineBestVisualizationType(chartData) : settings.type;
          
          return (
            <StandaloneChart 
              type={chartType}
              data={formattedChartData}
              height={650}
              width="100%"
              startYAxisFromZero={true}
              formatNumbers={true}
              colors={settings.colors}
              showLegend={settings.showLegend}
              showDataLabels={settings.showDataLabels}
              title={settings.showTitle ? settings.title : undefined}
            />
          );
        }
      } catch (e) {
        console.error('Error parsing artifact content:', e);
      }
    }
    
    // If we still don't have data, use fallback for monthly revenue or display no data
    if (title.toLowerCase().includes('monthly revenue')) {
      const fallbackData = [
        { month: 'January', revenue: 75000 },
        { month: 'February', revenue: 82500 },
        { month: 'March', revenue: 79800 },
        { month: 'April', revenue: 88000 },
        { month: 'May', revenue: 94200 }
      ];
      
      console.log('Rendering fallback data chart, fullscreen:', shouldShowFullScreen);
      
      return (
        <StandaloneChart 
          type={settings.type === 'auto' ? 'line' : settings.type}
          data={fallbackData}
          height={shouldShowFullScreen ? 650 : 215}
          width="100%"
          startYAxisFromZero={true}
          formatNumbers={true}
          colors={settings.colors}
          showLegend={settings.showLegend}
          showDataLabels={settings.showDataLabels}
          title={settings.showTitle ? settings.title : undefined}
        />
      );
    }
    
    // Last resort - no data available
    return <div className="text-center text-muted-foreground">No data available</div>;
  };
  
  // Determine if we're in split-screen view or chat view
  const isSplitView = artifactId && artifact && artifact.documentId === artifactId && artifact.isVisible;
  
  // Get settings from artifact if available
  const artifactSettings = useMemo(() => {
    if (artifact?.content) {
      try {
        const content = JSON.parse(artifact.content);
        console.log('Parsed artifact content:', {
          content,
          hasForceExpanded: !!content.forceExpanded,
          hasSettingsObj: !!content.settings,
          settingsForceExpanded: content.settings?.forceExpanded,
          fullContentStr: artifact.content.substring(0, 200) + '...' // First 200 chars for debugging
        });
        return content;
      } catch (e) {
        console.error('Error parsing artifact settings:', e);
        return {};
      }
    }
    return {};
  }, [artifact?.content]);
  
  // Determine if we show full screen view - check all possible locations of forceExpanded
  const shouldShowFullScreen = useMemo(() => {
    // First check props
    if (isSplitView || isForceExpanded) {
      return true;
    }
    
    // Then check artifact content
    if (artifactSettings) {
      // Check direct property
      if (artifactSettings.forceExpanded) {
        return true;
      }
      
      // Check in nested settings object (this is where it's actually set in query-display.tsx)
      if (artifactSettings.settings && artifactSettings.settings.forceExpanded) {
        return true;
      }
    }
    
    return false;
  }, [isSplitView, isForceExpanded, artifactSettings]);
  
  // Add debug logging to track artifact state
  useEffect(() => {
    console.log('Visualization panel rendering with:', {
      artifactId,
      visualizationType: visualization,
      dataLength: data?.length,
      hasData: !!data && Array.isArray(data) && data.length > 0,
      formattedDataLength: formattedData?.length,
      data: data?.slice(0, 2), // Log first 2 items for debugging
      shouldShowFullScreen,
      shouldShowFullScreenChecks: {
        isSplitView,
        isForceExpanded,
        artifactSettingsForceExpanded: artifactSettings?.forceExpanded,
        nestedSettingsForceExpanded: artifactSettings?.settings?.forceExpanded
      },
      artifactState: artifact?.status,
      isSplitView,
      isForceExpanded,
      artifactSettings: {
        forceExpanded: artifactSettings.forceExpanded,
        type: artifactSettings.type,
        hasSettings: !!artifactSettings.settings,
        settingsForceExpanded: artifactSettings.settings?.forceExpanded
      }
    });
  }, [artifactId, visualization, data, artifact, shouldShowFullScreen, formattedData, isSplitView, isForceExpanded, artifactSettings]);
  
  // Add effect to fetch the document timing information
  const [documentTimestamp, setDocumentTimestamp] = useState<string | null>(null);
  
  useEffect(() => {
    if (artifactId) {
      console.log('Fetching document with ID:', artifactId);
      fetch(`/api/document?id=${artifactId}`)
        .then(response => response.json())
        .then(documents => {
          console.log('Document fetch response:', documents);
          if (documents && documents.length > 0) {
            const latestDoc = documents[documents.length - 1];
            console.log('Latest document:', latestDoc);
            if (latestDoc.createdAt) {
              const timestamp = new Date(latestDoc.createdAt).toISOString();
              console.log('Setting document timestamp:', timestamp);
              setDocumentTimestamp(timestamp);
            }
          }
        })
        .catch(error => {
          console.error('Error fetching document timestamp:', error);
        });
    }
  }, [artifactId]);
  
  const handleSave = () => {
    // Create a timestamp for this update
    const timestamp = new Date().toISOString();
    console.log('Saving document with timestamp:', timestamp);
    setDocumentTimestamp(timestamp); // Update local timestamp state immediately
    
    // First save to the document
    if (artifactId) {
      const documentBody = {
        title,
        content: JSON.stringify({
          data,
          visualization: settings.type,
          description,
          settings,
          timestamp,
          lastModified: timestamp
        }),
        kind: 'visualization',
        createdAt: timestamp // This ensures the timestamp is updated
      };
      
      console.log('Document save request body:', documentBody);
      
      fetch(`/api/document?id=${artifactId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentBody)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(documents => {
        console.log('Document save response:', documents);
        
        // Force a revalidation to ensure timestamp updates
        fetch(`/api/document?id=${artifactId}`)
          .then(resp => resp.json())
          .then(docs => {
            console.log('Document fetch after save:', docs);
          })
          .catch(console.error);
        
        // Call onSave if provided
        if (onSave) {
          onSave({
            title,
            description,
            data: data,
            visualization: settings.type,
            settings
          });
        }
        
        toast.success('Visualization saved successfully');
      })
      .catch(error => {
        console.error('Error saving document:', error);
        toast.error('Failed to save visualization');
      });
    } else if (onSave) {
      // If no artifactId, just call onSave
      onSave({
        title,
        description,
        data: data,
        visualization: settings.type,
        settings
      });
      toast.success('Visualization saved successfully');
    }
  };
  
  // Add the chart capture function
  const captureChartAsImage = async () => {
    const chartElement = document.querySelector('.chart-container');
    if (!chartElement) {
      toast.error('Could not find chart to capture');
      return;
    }

    try {
      const dataUrl = await toPng(chartElement as HTMLElement, {
        quality: 0.95,
        backgroundColor: 'white',
      });

      // If a capture callback was provided, use it
      if (onCaptureChart) {
        onCaptureChart(dataUrl, {
          title,
          data,
          visualization,
          chartId: artifactId || undefined,
        });
        toast.success('Chart captured for embedding');
      } else {
        // Create temporary element to trigger download
        const tempLink = document.createElement('a');
        tempLink.href = dataUrl;
        tempLink.download = `${title.replace(/\s+/g, '_')}_chart.png`;
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        
        toast.success('Chart image downloaded');
      }

      return dataUrl;
    } catch (error) {
      console.error('Error capturing chart:', error);
      toast.error('Failed to capture chart image');
      return null;
    }
  };
  
  // Also add the analysis text for the "stable" case
  let analysisText = '';
  
  if (settings.type === 'line') {
    // Safely extract numeric values with type checking
    const firstItem = formattedData[0];
    const keys = Object.keys(firstItem);
    const numericKey = keys.find(key => typeof firstItem[key] === 'number') || keys[1];
    
    // Create strongly typed array of numbers
    const dataPoints: number[] = formattedData.map(item => {
      const value = item[numericKey];
      return typeof value === 'number' ? value : 0;
    });
    
    const trend = dataPoints[dataPoints.length - 1] > dataPoints[0] ? 'upward' : 'downward';
    const startValue = dataPoints[0] || 0;
    const endValue = dataPoints[dataPoints.length - 1] || 0;
    
    // Avoid division by zero
    const growth = startValue !== 0 
      ? ((endValue - startValue) / Math.abs(startValue) * 100).toFixed(1)
      : '0.0';
    
    analysisText = `Looking at this line chart, I can see a ${trend} trend with approximately ${growth}% ${endValue > startValue ? 'growth' : 'decline'} from beginning to end. `;
    
    // Check for volatility
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const volatility = max - min;
    
    if (max > 0 && volatility > (max * 0.3)) {
      analysisText += `There's significant volatility in the data, suggesting potential instability or seasonal factors. `;
    } else {
      analysisText += `The trend appears relatively stable without major fluctuations. `;
    }
  } else if (settings.type === 'bar') {
    analysisText = `This bar chart shows ${title} data. `;
    
    // Find some basic metrics with type safety
    const firstItem = formattedData[0];
    const numericKey = Object.keys(firstItem).find(key => typeof firstItem[key] === 'number');
    
    if (numericKey) {
      // Create a strongly typed array of numbers
      const values: number[] = formattedData.map(item => {
        const value = item[numericKey];
        return typeof value === 'number' ? value : 0;
      });
      
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      analysisText += `The values range from ${min} to ${max}, with an average of ${avg.toFixed(1)}. `;
    }
  } else {
    analysisText = `This ${settings.type} chart displays ${title} data. Based on the visualization, there are patterns and relationships that could be explored further. `;
  }

  // Display a toast with the analysis
  toast.info(
    <div className="max-w-md">
      <h3 className="font-medium mb-1">Chart Analysis</h3>
      <p className="text-sm text-muted-foreground">{analysisText}</p>
    </div>,
    {
      duration: 8000,
    }
  );

  if (shouldShowFullScreen) {
    // Render full visualization in full screen view with controls - using standard components
    return (
      <div className={cn(
        "visualization-editor-container flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent",
        "transition-all duration-300 ease-in-out",
        isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}>
        {/* Background */}
        <div className="fixed bg-background h-dvh w-dvw" />
        
        {/* Main content */}
        <div className="relative flex h-full w-full z-10">
          {/* Left panel (chat) - exactly matching document preview pattern */}
          <div className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0 overflow-hidden">
            {!isCurrentVersion && (
              <div className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-20" />
            )}
            
            <div className="flex flex-col h-full justify-between items-center gap-4">
              {/* Chat message area */}
              <div className="flex-1 w-full overflow-hidden">
                <div className="p-4 border-b border-border bg-background dark:bg-muted">
                  <h2 className="text-lg font-medium truncate">{title}</h2>
                  {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
                </div>
                
                <div className="p-4">
                  <div className="rounded-lg border p-3 mb-3 bg-background">
                    <p className="text-sm text-muted-foreground">
                      This is a visualization of your data. You can edit the visualization settings using the controls on the right.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right panel (visualization editor) - using standard components */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Toolbar at top - using standard toolbar pattern */}
            <div className="flex justify-between items-center p-3 bg-background dark:bg-muted border-b border-border">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClose} 
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Visualization Editor</span>
                  {documentTimestamp && (
                    <span className="text-xs text-muted-foreground">
                      {`Updated ${formatDistance(new Date(documentTimestamp), new Date(), { addSuffix: true })}`}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action buttons - standard header pattern */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVersionChange('prev')}
                  disabled={!hasVersionHistory || currentVersionIndex === 0}
                  className={!hasVersionHistory || currentVersionIndex === 0 ? "opacity-50" : ""}
                >
                  <UndoIcon size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVersionChange('next')}
                  disabled={isCurrentVersion}
                >
                  <RedoIcon size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExportData}
                >
                  <CopyIcon />
                </Button>
                
                {/* Improved save button with dropdown */}
                <div className="relative group save-dropdown-container">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1" 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-60 rounded-md shadow-lg bg-background border border-border z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                          onClick={() => {
                            // Save to a new dashboard
                            saveVisualization('new');
                            setIsDropdownOpen(false);
                          }}
                        >
                          <FileIcon className="h-4 w-4" />
                          New dashboard
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                          onClick={() => {
                            // Save to existing dashboard
                            saveVisualization('existing');
                            setIsDropdownOpen(false);
                          }}
                        >
                          <BarChart className="h-4 w-4" />
                          Existing dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Add Chart Capture Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1" 
                  onClick={captureChartAsImage}
                >
                  <FileIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Embed in Doc</span>
                </Button>
              </div>
            </div>
            
            {/* Main content area with editor and controls in resizable panels */}
            <div className="flex-1 overflow-hidden border-t border-border">
              <div className="relative h-full">
                {/* Full-width visualization panel */}
                <div className="h-full w-full p-3 bg-card overflow-hidden">
                  <div className="border rounded-lg h-full flex justify-center items-center p-2">
                    {renderVisualization()}
                  </div>
                </div>
                
                {/* Floating controls panel - positioned absolutely */}
                <div className="absolute top-6 right-6 w-72 z-10">
                  <div className="rounded-lg border bg-card shadow-lg">
                    <div className="p-3 flex justify-end items-center border-b">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </Button>
                    </div>
                    <div className="p-4">
                      <VisualizationControls
                        type={settings.type}
                        data={data}
                        settings={settings}
                        onChange={handleSettingsChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Analysis Button */}
        <FloatingAnalysisButton 
          onClick={() => {
            // Generate analysis text based on the chart type and data
            let analysisText = '';
            
            try {
              if (formattedData && formattedData.length > 0) {
                if (settings.type === 'line') {
                  // Safely extract numeric values with type checking
                  const firstItem = formattedData[0];
                  const keys = Object.keys(firstItem);
                  const numericKey = keys.find(key => typeof firstItem[key] === 'number') || keys[1];
                  
                  // Create strongly typed array of numbers
                  const dataPoints: number[] = formattedData.map(item => {
                    const value = item[numericKey];
                    return typeof value === 'number' ? value : 0;
                  });
                  
                  const trend = dataPoints[dataPoints.length - 1] > dataPoints[0] ? 'upward' : 'downward';
                  const startValue = dataPoints[0] || 0;
                  const endValue = dataPoints[dataPoints.length - 1] || 0;
                  
                  // Avoid division by zero
                  const growth = startValue !== 0 
                    ? ((endValue - startValue) / Math.abs(startValue) * 100).toFixed(1)
                    : '0.0';
                  
                  analysisText = `Looking at this line chart, I can see a ${trend} trend with approximately ${growth}% ${endValue > startValue ? 'growth' : 'decline'} from beginning to end. `;
                  
                  // Check for volatility
                  const max = Math.max(...dataPoints);
                  const min = Math.min(...dataPoints);
                  const volatility = max - min;
                  
                  if (max > 0 && volatility > (max * 0.3)) {
                    analysisText += `There's significant volatility in the data, suggesting potential instability or seasonal factors. `;
                  } else {
                    analysisText += `The trend appears relatively stable without major fluctuations. `;
                  }
                } else if (settings.type === 'bar') {
                  analysisText = `This bar chart shows ${title} data. `;
                  
                  // Find some basic metrics with type safety
                  const firstItem = formattedData[0];
                  const numericKey = Object.keys(firstItem).find(key => typeof firstItem[key] === 'number');
                  
                  if (numericKey) {
                    // Create a strongly typed array of numbers
                    const values: number[] = formattedData.map(item => {
                      const value = item[numericKey];
                      return typeof value === 'number' ? value : 0;
                    });
                    
                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                    
                    analysisText += `The values range from ${min} to ${max}, with an average of ${avg.toFixed(1)}. `;
                  }
                } else {
                  analysisText = `This ${settings.type} chart displays ${title} data. Based on the visualization, there are patterns and relationships that could be explored further. `;
                }
              } else {
                analysisText = `There is insufficient data to perform a detailed analysis of this visualization. Please ensure the chart has valid data to analyze.`;
              }
            } catch (error) {
              console.error('Error generating chart analysis:', error);
              analysisText = `I encountered an error while analyzing this chart. This could be due to unexpected data formats or missing values.`;
            }

            // Display a toast with the analysis
            toast.info(
              <div className="max-w-md">
                <h3 className="font-medium mb-1">Chart Analysis</h3>
                <p className="text-sm text-muted-foreground">{analysisText}</p>
              </div>,
              {
                duration: 8000,
              }
            );
          }}
          position="bottom-right"
          label="Analyze chart"
        />
      </div>
    );
  }

  // Render preview in chat mode
  return (
    <div className="relative w-full cursor-pointer">
      {/* Hitbox Layer */}
      <div
        className="size-full absolute top-0 left-0 rounded-xl z-10"
        onClick={handleExpand}
        role="presentation"
        aria-hidden="true"
      >
        <div className="w-full p-4 flex justify-end items-center">
          <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
            <FullscreenIcon />
          </div>
        </div>
      </div>
      
      {/* Document Header */}
      <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
        <div className="flex flex-row items-start sm:items-center gap-3">
          <div className="text-muted-foreground">
            <BarChart size={16} />
          </div>
          <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
        </div>
        <div className="w-8" />
      </div>
      
      {/* Document Content */}
      <div className="h-[257px] overflow-y-hidden border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700">
        <div className="flex items-center justify-center h-full pt-2 px-6 pr-8">
          {renderVisualization()}
        </div>
      </div>
    </div>
  );
}
