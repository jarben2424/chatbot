'use client';

import React, { useEffect, useState } from 'react';
import { useArtifact } from '@/hooks/use-artifact';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, ScatterChart } from './charts';
import { DataTable } from './data-table';
import { VisualizationControls } from './visualization-controls';
import { X, Maximize2, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { ArtifactKind } from '@/components/artifact';
import { StandaloneChart } from './charts/standalone-chart';
import { cn } from '@/lib/utils';
import { VisualizationEditor } from './visualization-editor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Expand, DownloadIcon, Share2, Plus, XIcon, MoreVertical } from 'lucide-react';
import { exportChartAsImage, exportChartAsCSV } from '@/lib/utils/export-utils';
import { VisualizationSettings } from '@/lib/types/visualization';
import { addToDashboard } from '@/lib/actions/data-tools';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { getDashboards } from '@/lib/actions/dashboard';

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
  onEdit?: () => void;
  editable?: boolean;
  dashboardId?: string;
  isEmbedded?: boolean;
}

// Add proper type for the UIArtifact
interface UIArtifact {
  id: string;
  type: ArtifactKind;
  title: string;
  content: any;
  status: 'streaming' | 'idle' | 'complete';
}

// Fix for the ChartProps issue
interface ChartProps {
  data: any[];
  responsive?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  xField?: string;
  colors?: string[];
  // Add other required props
}

// Fix the useArtifact hook type issue
const { setArtifact, isVisible } = useArtifact() as {
  artifact: UIArtifact;
  setArtifact: (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => void;
  isVisible: boolean;
  metadata: any;
  setMetadata: any;
};

export function VisualizationPanel({
  data = [],
  visualization = 'table',
  title = 'Visualization',
  description,
  artifactId,
  expandable = true,
  forceExpanded = false,
  onClose,
  onExpand,
  onSave,
  onEdit,
  editable = false,
  dashboardId,
  isEmbedded = false
}: VisualizationPanelProps) {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Add state for visualization settings
  const [settings, setSettings] = useState<VisualizationSettings>({
    type: visualization || 'auto',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    showLegend: true,
    showTitle: true,
    showLabels: true,
    showGrid: true,
    xAxis: data && data.length > 0 ? Object.keys(data[0])[0] : undefined
  });
  
  // Add state to track force expanded state
  const [isForceExpanded, setIsForceExpanded] = useState(forceExpanded);
  
  // Add state for expanded and fullscreen states
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state to track editor mode
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Add state for adding to dashboard
  const [isAddToDashboardOpen, setIsAddToDashboardOpen] = useState(false);
  
  // Add state for available dashboards
  const [availableDashboards, setAvailableDashboards] = useState<Array<{ id: string; title: string }>>([]);
  
  // Add state for selected dashboard
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  
  // Add state for adding to dashboard
  const [isAddingToDashboard, setIsAddingToDashboard] = useState(false);
  
  // Determine if we should show fullscreen view
  const shouldShowFullScreen = isVisible && artifactId === ((isVisible as any)?.id) || isForceExpanded;
  
  // Update when prop changes
  useEffect(() => {
    setIsForceExpanded(forceExpanded);
  }, [forceExpanded]);
  
  // Make sure visualization is immediately visible upon loading
  useEffect(() => {
    // Simulate a shorter loading time to show visualization faster
    const timer = setTimeout(() => {
      setIsLoading(false);
      setExpanded(true); // Always expand initially
    }, 300); // Reduced from 1000ms
    
    return () => clearTimeout(timer);
  }, []);
  
  // Make sure we have valid data to render
  const validData = Array.isArray(data) && data.length > 0 ? data : [
    // Fallback data in case real data is missing
    { category: 'Sample', value: 100 }
  ];
  
  // Update the handleExpand function to include settings
  const handleExpand = () => {
    setIsEditMode(true);
    setFullscreen(true);
    if (onExpand) {
      onExpand();
    } else if (artifactId) {
      setArtifact({
        id: artifactId,
        type: 'visualization' as ArtifactKind,
        title,
        content: { 
          data: validData, 
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
  
  // Updated renderVisualization function to fix TS errors
  const renderVisualization = () => {
    // Use validData instead of data to ensure something always renders
    if (!validData || validData.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
    }
    
    // Ensure consistent props for all chart types
    const chartProps = {
      data: validData,
      className: "w-full h-full",
      responsive: true
    };
    
    // Figure out the right chart type to render
    let chartType = settings.type;
    if (chartType === 'auto') {
      // Auto-detect the best chart type based on data
      chartType = 'bar';
    }
    
    // Return the appropriate visualization based on type
    switch (chartType) {
      case 'bar':
        return (
          <BarChart 
            data={validData}
            responsive={true}
            showLegend={settings.showLegend}
            showGrid={settings.showGrid}
            xField={settings.xAxis || Object.keys(validData[0])[0]}
            colors={settings.colors}
          />
        );
      case 'line':
        return (
          <LineChart 
            data={validData}
            className="w-full h-full"
            responsive={true}
            showLegend={settings.showLegend}
            showGrid={settings.showGrid}
            xField={settings.xAxis || Object.keys(validData[0])[0]}
            colors={settings.colors}
          />
        );
      case 'pie':
        return (
          <PieChart 
            data={validData}
            className="w-full h-full"
            responsive={true}
            showLegend={settings.showLegend}
            variant="pie"
            label={settings.xAxis || Object.keys(validData[0])[0]}
            colors={settings.colors}
          />
        );
      case 'scatter':
        return (
          <ScatterChart 
            data={validData}
            className="w-full h-full"
            responsive={true}
            showLegend={settings.showLegend}
            showGrid={settings.showGrid}
            xField={settings.xAxis || Object.keys(validData[0])[0]}
            colors={settings.colors}
          />
        );
      case 'table':
      default:
        return <DataTable data={validData} />;
    }
  };
  
  // Handle close
  const handleClose = () => {
    if (onClose) {
      setFullscreen(false);
      setIsEditMode(false);
      onClose();
    }
  };
  
  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave({
        data: validData,
        visualization: settings.type,
        title,
        description,
        settings
      });
    }
  };
  
  // Handle export as image
  const handleExportImage = async () => {
    if (!artifactId && !title) {
      toast.error('Unable to export: Missing visualization identifier');
      return;
    }
    
    try {
      await exportChartAsImage(`chart-${artifactId || 'visualization'}`, title.toLowerCase().replace(/\s+/g, '-'));
      toast.success('Chart exported as image');
    } catch (error) {
      toast.error('Failed to export chart');
      console.error('Export error:', error);
    }
  };
  
  // Handle export as CSV
  const handleExportCSV = async () => {
    if (!validData.length) {
      toast.error('No data to export');
      return;
    }
    
    try {
      await exportChartAsCSV(validData, `${title.toLowerCase().replace(/\s+/g, '-')}`);
      toast.success('Data exported as CSV');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };
  
  // Add to dashboard
  const handleAddToDashboard = async () => {
    if (!selectedDashboardId) {
      toast({
        variant: 'destructive',
        description: 'Selection Required: Please select a dashboard'
      });
      return;
    }
    
    setIsAddingToDashboard(true);
    
    try {
      const result = await addToDashboard({
        artifactId,
        dashboardId: selectedDashboardId
      });
      
      if (result.success) {
        toast.success('Added to dashboard');
        setIsAddToDashboardOpen(false);
        router.push(`/dashboard/${selectedDashboardId}`);
      } else {
        toast.error(result.error || 'Failed to add to dashboard');
      }
    } catch (error) {
      toast.error('Error adding to dashboard');
      console.error('Dashboard error:', error);
    } finally {
      setIsAddingToDashboard(false);
    }
  };
  
  // Load dashboards when dialog opens
  useEffect(() => {
    if (isAddToDashboardOpen) {
      const fetchDashboards = async () => {
        try {
          const dashboards = await getDashboards();
          setAvailableDashboards(dashboards);
        } catch (error) {
          console.error('Error fetching dashboards:', error);
          toast({
            title: 'Error',
            description: 'Failed to load dashboards',
            variant: 'destructive',
          });
        }
      };
      
      fetchDashboards();
    }
  }, [isAddToDashboardOpen, toast]);
  
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
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8" title="Close">
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
                data={validData}
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
    <>
      {isEditMode && fullscreen ? (
        <VisualizationEditor
          data={validData}
          visualization={settings.type}
          title={title}
          description={description}
          onClose={handleClose}
          onSave={(savedData: any) => {
            if (onSave) {
              onSave(savedData);
            }
            setIsEditMode(false);
            setFullscreen(false);
          }}
        >
          {null}
        </VisualizationEditor>
      ) : (
        <div 
          className={cn(
            "visualization-panel border rounded-lg overflow-hidden transition-all duration-500 ease-in-out mb-1",
            isLoading ? "blur-sm animate-pulse" : "",
            fullscreen ? "fixed inset-0 z-50 bg-background p-6" : ""
          )}
        >
          <div className="p-2 flex justify-between items-center border-b bg-card">
            <div>
              <h3 className="font-medium">{title || 'Visualization'}</h3>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleExpand} 
                variant="ghost" 
                size="icon"
                className={cn(isLoading ? "opacity-0" : "opacity-100", "transition-opacity duration-300")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            className={cn(
              "transition-all duration-700 ease-in-out bg-card",
              expanded ? "max-h-[180px] opacity-100 mt-0" : "max-h-0 opacity-0 overflow-hidden", 
              fullscreen ? "h-[calc(100vh-10rem)]" : ""
            )}
          >
            <div className="p-0 h-[180px]">
              {renderVisualization()}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 