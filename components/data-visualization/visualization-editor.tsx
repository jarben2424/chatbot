'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, ChevronDown, Edit2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { VisualizationControls } from './visualization-controls';
import { StandaloneChart } from './charts/standalone-chart';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { ColorPicker } from './color-picker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// List of demo dashboards
const DEMO_DASHBOARDS = [
  { id: 'monthly-revenue', name: 'Monthly Revenue' },
  { id: 'sales-performance', name: 'Sales Performance' },
  { id: 'customer-insights', name: 'Customer Insights' },
];

// Predefined color palettes
const COLOR_PALETTES = {
  default: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  pastel: ['#93c5fd', '#fca5a5', '#6ee7b7', '#fcd34d', '#c4b5fd'],
  vibrant: ['#1d4ed8', '#b91c1c', '#047857', '#92400e', '#6d28d9'],
  monochrome: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
  rainbowDark: ['#1e40af', '#9f1239', '#115e59', '#b45309', '#5b21b6']
};

export function VisualizationEditor({ 
  data, 
  visualization = 'auto',
  title: initialTitle,
  description: initialDescription,
  onClose,
  onSave,
  children // For passing the chat content
}) {
  const [selectDashboardOpen, setSelectDashboardOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || 'Visualization');
  const [description, setDescription] = useState(initialDescription || '');
  const titleInputRef = useRef(null);
  
  // Settings state - prevent too many re-renders
  const [settings, setSettings] = useState({
    type: visualization === 'auto' ? 'bar' : visualization,
    colors: COLOR_PALETTES.default,
    colorPalette: 'default',
    showLegend: true,
    showLabels: true,
    showDataLabels: false,
    showTitle: true,
    title: initialTitle || 'Visualization',
    description: initialDescription || '',
    showGrid: true,
  });
  
  // Store settings changes temporarily before applying
  const [pendingSettings, setPendingSettings] = useState(settings);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', content: 'Can you show me the monthly revenue data?' },
    { role: 'assistant', content: 'Here\'s the total monthly revenue for the past 5 months.' }
  ]);
  
  // Ensure data is properly formatted for visualization
  const parsedData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Provide fallback data for monthly revenue query
      if (title.toLowerCase().includes('monthly revenue')) {
        return [
          { month: 'January', revenue: 75000 },
          { month: 'February', revenue: 82500 },
          { month: 'March', revenue: 79800 },
          { month: 'April', revenue: 88000 },
          { month: 'May', revenue: 94200 }
        ];
      }
      return [];
    }
    
    return data.map(item => {
      const result = { ...item };
      Object.keys(result).forEach(key => {
        // Convert string numbers to actual numbers
        if (typeof result[key] === 'string') {
          const cleaned = result[key].replace(/[$,]/g, '');
          if (!isNaN(parseFloat(cleaned))) {
            result[key] = parseFloat(cleaned);
          }
        }
      });
      return result;
    });
  }, [data, title]);

  // Focus input when editing title
  useEffect(() => {
    if (titleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [titleEditing]);

  // Handle color palette change
  const handlePaletteChange = (palette) => {
    setPendingSettings({
      ...pendingSettings,
      colorPalette: palette,
      colors: COLOR_PALETTES[palette]
    });
  };

  // Save to existing dashboard
  const saveToExisting = (dashboardId) => {
    const dashboardName = DEMO_DASHBOARDS.find(d => d.id === dashboardId)?.name;
    handleSave(dashboardId, dashboardName);
    setSelectDashboardOpen(false);
  };

  // Save to new dashboard
  const saveToNew = () => {
    const autoName = `${title.replace(/[^a-zA-Z0-9\s]/g, ' ')} Dashboard`;
    const newId = `new-${Date.now()}`;
    handleSave(newId, autoName);
  };

  // Common save function
  const handleSave = (dashboardId, dashboardName) => {
    const savedViz = {
      id: crypto.randomUUID(),
      title: title,
      type: settings.type,
      data: parsedData,
      settings: {
        ...settings,
        title: title,
        description: description
      },
      dashboardId,
      dashboardName
    };

    if (onSave) {
      onSave(savedViz);
    }
    
    toast.success('Saved to Dashboard');
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleSave = () => {
    setTitleEditing(false);
  };
  
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    // Add user message
    setChatMessages([...chatMessages, {
      role: 'user',
      content: chatInput
    }]);
    
    // Clear input
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prevMessages => [...prevMessages, {
        role: 'assistant',
        content: "I'm continuing to show the visualization you requested. You can edit it using the controls on the right."
      }]);
    }, 500);
  };

  // Debounced function to apply pending settings to actual settings
  const applySettingsDebounced = useCallback(() => {
    // Apply pending changes when specifically needed (chart type change, etc.)
    if (JSON.stringify(settings) !== JSON.stringify(pendingSettings)) {
      setSettings(pendingSettings);
      // Show toast only when significant changes are made
      if (settings.type !== pendingSettings.type || 
          settings.colorPalette !== pendingSettings.colorPalette) {
        toast.success('Changes applied', {
          duration: 1000,
          position: 'bottom-right',
        });
      }
    }
  }, [settings, pendingSettings]);
  
  // Apply settings after a significant change
  const applySettings = (settingsUpdate) => {
    const newSettings = {
      ...pendingSettings,
      ...settingsUpdate,
    };
    setPendingSettings(newSettings);
    
    // Schedule the actual application
    setTimeout(() => {
      applySettingsDebounced();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header with just the close button */}
      <div className="flex items-center justify-between p-3 border-b bg-background shadow-sm">
        <div className="flex-1">
          {/* Empty space for alignment */}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="whitespace-nowrap" variant="purple">
                <Save className="mr-2 h-4 w-4" />
                Save<ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (onSave) {
                    onSave({
                      visualization: settings.type,
                      data,
                      title,
                      description,
                      settings
                    });
                  }
                  onClose();
                  toast.success('Visualization saved');
                }}
              >
                Save changes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (onSave) {
                    onSave({
                      visualization: settings.type,
                      data,
                      title,
                      description,
                      settings,
                      saveAsNew: true,
                    });
                  }
                  onClose();
                  toast.success('Saved as new visualization');
                }}
              >
                Save as new
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex flex-1 h-[calc(100vh-48px)] overflow-hidden">
        {/* Chat panel on the left (restored) */}
        <div className="w-1/3 p-4 overflow-auto border-r bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-4">Chat History</h3>
          
          <div className="flex flex-col gap-4 mb-4">
            {chatMessages.map((message, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-lg",
                  message.role === 'user' 
                    ? "bg-blue-100 dark:bg-blue-900 ml-8" 
                    : "bg-gray-100 dark:bg-gray-800 mr-8"
                )}
              >
                <div className="text-sm">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Visualization preview in center */}
        <div className="w-2/5 p-6 overflow-auto">
          <div className="mb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Visualization Title"
              className="text-xl font-bold mb-2"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description"
              className="text-sm text-muted-foreground"
            />
          </div>
          
          <div className="bg-card rounded-lg border h-[calc(100vh-200px)] flex items-center justify-center p-4">
            <StandaloneChart
              data={parsedData}
              type={settings.type}
              colors={settings.colors}
              showLegend={settings.showLegend}
              showGrid={settings.showGrid}
              title={title}
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Settings panel on right */}
        <div className="w-1/4 p-4 overflow-auto border-l">
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="chart" className="flex-1">Chart</TabsTrigger>
              <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>
              <TabsTrigger value="data" className="flex-1">Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={settings.type === 'bar' ? 'default' : 'outline'}
                  onClick={() => applySettings({ type: 'bar' })}
                  className="p-6"
                >
                  Bar Chart
                </Button>
                <Button
                  variant={settings.type === 'line' ? 'default' : 'outline'}
                  onClick={() => applySettings({ type: 'line' })}
                  className="p-6"
                >
                  Line Chart
                </Button>
                <Button
                  variant={settings.type === 'pie' ? 'default' : 'outline'}
                  onClick={() => applySettings({ type: 'pie' })}
                  className="p-6"
                >
                  Pie Chart
                </Button>
                <Button
                  variant={settings.type === 'scatter' ? 'default' : 'outline'}
                  onClick={() => applySettings({ type: 'scatter' })}
                  className="p-6"
                >
                  Scatter Plot
                </Button>
                <Button
                  variant={settings.type === 'table' ? 'default' : 'outline'}
                  onClick={() => applySettings({ type: 'table' })}
                  className="p-6"
                >
                  Data Table
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Chart Colors</Label>
                  <ColorPicker 
                    colors={settings.colors} 
                    onChange={(colors) => applySettings({ colors })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Show Legend</Label>
                  <Switch 
                    checked={settings.showLegend}
                    onCheckedChange={(checked) => 
                      applySettings({ showLegend: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Show Grid</Label>
                  <Switch 
                    checked={settings.showGrid}
                    onCheckedChange={(checked) => 
                      applySettings({ showGrid: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-medium mb-2">Data Preview</h3>
                  <div className="max-h-[300px] overflow-auto text-xs">
                    <pre>{JSON.stringify(parsedData, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Dashboard selection dialog */}
      <Dialog open={selectDashboardOpen} onOpenChange={setSelectDashboardOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Select Dashboard</DialogTitle>
          <div className="grid gap-4 py-4">
            {DEMO_DASHBOARDS.map(dashboard => (
              <Button 
                key={dashboard.id} 
                variant="outline" 
                className="justify-start h-auto py-3 px-4"
                onClick={() => saveToExisting(dashboard.id)}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">{dashboard.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date().toLocaleDateString()}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}