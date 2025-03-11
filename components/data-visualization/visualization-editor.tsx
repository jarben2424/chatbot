'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { VisualizationControls } from './visualization-controls';
import { StandaloneChart } from './charts/standalone-chart';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@radix-ui/react-dialog';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Define dashboard types for clarity
type Dashboard = {
  id: string;
  name: string;
};

// List of demo dashboards
const DEMO_DASHBOARDS: Dashboard[] = [
  { id: 'monthly-revenue', name: 'Monthly Revenue' },
  { id: 'sales-performance', name: 'Sales Performance' },
  { id: 'customer-insights', name: 'Customer Insights' },
];

export function VisualizationEditor({ 
  data, 
  visualization = 'auto',
  title,
  onClose,
  onSave
}) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveOption, setSaveOption] = useState('new');
  const [dashboardName, setDashboardName] = useState('');
  const [settings, setSettings] = useState({
    type: visualization === 'auto' ? 'bar' : visualization,
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    showLegend: true,
    showLabels: true,
    title: title || 'Visualization'
  });

  // Parse data to ensure numbers are treated as numbers
  const parsedData = data?.map(item => {
    const result = { ...item };
    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'string' && !isNaN(parseFloat(result[key].replace(/[^0-9.-]+/g, '')))) {
        result[key] = parseFloat(result[key].replace(/[^0-9.-]+/g, ''));
      }
    });
    return result;
  });

  // Log visualization data for debugging
  useEffect(() => {
    console.log('VisualizationEditor mounted with:', {
      visualization: settings.type,
      dataLength: data?.length,
      dataSample: data?.[0],
      parsedSample: parsedData?.[0]
    });
  }, [data, settings.type, parsedData]);

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = () => {
    const savedViz = {
      id: crypto.randomUUID(),
      title: settings.title,
      type: settings.type,
      data: parsedData,
      settings,
      dashboardId: saveOption === 'new' ? 'new-' + Date.now() : saveOption,
      dashboardName: saveOption === 'new' ? dashboardName : DEMO_DASHBOARDS.find(d => d.id === saveOption)?.name
    };

    // Save the visualization
    if (onSave) {
      onSave(savedViz);
    }

    // Close dialog and show toast
    setShowSaveDialog(false);
    toast.success('Saved to Dashboards');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      <PanelGroup direction="horizontal">
        {/* Left Panel - Chat */}
        <Panel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Chat</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* Chat content would render here */}
              <div className="text-muted-foreground text-center p-6">
                Continue your conversation while editing the visualization.
              </div>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle />

        {/* Right Panel - Visualization Editor */}
        <Panel defaultSize={60}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Visualization Editor</h3>
              <Button variant="default" size="sm" onClick={handleSaveClick}>
                <Save className="h-4 w-4 mr-2" />
                Save to Dashboard
              </Button>
            </div>

            <div className="flex-1 flex">
              {/* Main Visualization Area */}
              <div className="flex-1 p-6 overflow-auto">
                <h2 className="text-xl font-semibold mb-4">{settings.title}</h2>
                {parsedData && (
                  <div className="border rounded-lg p-4 bg-card">
                    <StandaloneChart 
                      type={settings.type} 
                      data={parsedData}
                      height={400}
                    />
                  </div>
                )}
              </div>

              {/* Controls Panel */}
              <div className="w-80 border-l">
                <VisualizationControls 
                  data={parsedData}
                  settings={settings}
                  onChange={setSettings}
                />
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogTitle>Save Visualization to Dashboard</DialogTitle>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Save to:</label>
              <Select value={saveOption} onValueChange={setSaveOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dashboard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create New Dashboard</SelectItem>
                  {DEMO_DASHBOARDS.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {saveOption === 'new' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Dashboard Name:</label>
                <Input 
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="Enter dashboard name"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 