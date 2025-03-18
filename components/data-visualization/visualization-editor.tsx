'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, ChevronDown, Edit2, Send, Undo, Redo } from 'lucide-react';
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
  onClose,
  onSave,
  children // For passing the chat content
}) {
  const [selectDashboardOpen, setSelectDashboardOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || 'Visualization');
  const titleInputRef = useRef(null);
  const [settings, setSettings] = useState({
    type: visualization === 'auto' ? 'bar' : visualization,
    colors: COLOR_PALETTES.default,
    colorPalette: 'default',
    showLegend: true,
    showLabels: true,
    showDataLabels: false,
    showTitle: true,
    title: initialTitle || 'Visualization'
  });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', content: 'Can you show me the monthly revenue data?' },
    { role: 'assistant', content: 'Here\'s the total monthly revenue for the past 5 months.' }
  ]);
  
  // State for undo/redo functionality
  const [versionHistory, setVersionHistory] = useState([{
    settings: settings
  }]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const isCurrentVersion = currentVersionIndex === versionHistory.length - 1;
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
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
    setSettings({
      ...settings,
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
        title: title
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
  
  // Handle settings change with version history
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    // Add to version history if different from current version
    if (JSON.stringify(newSettings) !== JSON.stringify(versionHistory[currentVersionIndex].settings)) {
      // Remove future versions if we're not at the latest version
      const updatedHistory = versionHistory.slice(0, currentVersionIndex + 1);
      setVersionHistory([...updatedHistory, { settings: newSettings }]);
      setCurrentVersionIndex(updatedHistory.length);
    }
  };

  // Undo function
  const handleUndo = () => {
    if (currentVersionIndex > 0) {
      setCurrentVersionIndex(currentVersionIndex - 1);
      setSettings(versionHistory[currentVersionIndex - 1].settings);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (currentVersionIndex < versionHistory.length - 1) {
      setCurrentVersionIndex(currentVersionIndex + 1);
      setSettings(versionHistory[currentVersionIndex + 1].settings);
    }
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
    
    // Handle analyze data command
    if (chatInput.toLowerCase().includes('analyze') || 
        chatInput.toLowerCase().includes('insights') ||
        chatInput.toLowerCase().includes('commentary')) {
      
      setTimeout(() => {
        let analysisText = '';
        const chartType = settings.type;
        
        // Generate analysis based on the chart type and data
        if (chartType === 'line') {
          const dataPoints = parsedData.map(item => Object.values(item)[1]);
          const trend = dataPoints[dataPoints.length - 1] > dataPoints[0] ? 'upward' : 'downward';
          const growth = dataPoints[dataPoints.length - 1] > dataPoints[0] 
            ? ((dataPoints[dataPoints.length - 1] - dataPoints[0]) / dataPoints[0] * 100).toFixed(1)
            : ((dataPoints[0] - dataPoints[dataPoints.length - 1]) / dataPoints[0] * 100).toFixed(1);
            
          analysisText = `Looking at this ${chartType} chart, I can see a clear ${trend} trend with approximately ${growth}% ${trend === 'upward' ? 'growth' : 'decline'} from beginning to end. `;
          
          // Check for volatility
          const volatility = Math.max(...dataPoints) - Math.min(...dataPoints);
          if (volatility > (Math.max(...dataPoints) * 0.3)) {
            analysisText += `There's significant volatility in the data, suggesting potential instability or seasonal factors. `;
          } else {
            analysisText += `The trend appears relatively stable without major fluctuations. `;
          }
          
          // Check for latest movement
          if (dataPoints[dataPoints.length - 1] > dataPoints[dataPoints.length - 2]) {
            analysisText += `The most recent period shows continued growth, which is a positive sign. `;
          } else {
            analysisText += `The most recent period shows a decline, which might be worth investigating. `;
          }
        } else if (chartType === 'bar') {
          const keys = Object.keys(parsedData[0]);
          const numericKey = Object.keys(parsedData[0]).find(key => typeof parsedData[0][key] === 'number');
          const categoryKey = keys.find(k => k !== numericKey);
          
          // Find highest and lowest values
          let highest = parsedData[0];
          let lowest = parsedData[0];
          parsedData.forEach(item => {
            if (item[numericKey] > highest[numericKey]) highest = item;
            if (item[numericKey] < lowest[numericKey]) lowest = item;
          });
          
          analysisText = `The bar chart shows ${keys[1]} by ${keys[0]}. ${highest[categoryKey]} has the highest value at ${highest[numericKey].toLocaleString()}, while ${lowest[categoryKey]} has the lowest at ${lowest[numericKey].toLocaleString()}. `;
          
          // Check distribution
          const sum = parsedData.reduce((acc, item) => acc + item[numericKey], 0);
          const average = sum / parsedData.length;
          const aboveAverage = parsedData.filter(item => item[numericKey] > average).length;
          
          analysisText += `${aboveAverage} out of ${parsedData.length} categories are above the average value of ${average.toLocaleString()}. `;
          
          // Check if values are concentrated
          if (highest[numericKey] > sum * 0.4) {
            analysisText += `There appears to be a significant concentration, with ${highest[categoryKey]} representing a large portion of the total. This suggests potential areas for deeper analysis. `;
          } else {
            analysisText += `The distribution appears relatively balanced across categories. `;
          }
        } else if (chartType === 'pie') {
          const keys = Object.keys(parsedData[0]);
          const numericKey = Object.keys(parsedData[0]).find(key => typeof parsedData[0][key] === 'number');
          const categoryKey = keys.find(k => k !== numericKey);
          
          // Total and percentages
          const total = parsedData.reduce((sum, item) => sum + item[numericKey], 0);
          const segments = parsedData.map(item => ({
            category: item[categoryKey],
            value: item[numericKey],
            percentage: ((item[numericKey] / total) * 100).toFixed(1)
          }));
          
          // Sort by highest percentage
          segments.sort((a, b) => b.value - a.value);
          
          analysisText = `This pie chart shows the distribution of ${title.toLowerCase()}. The largest segment is ${segments[0].category} at ${segments[0].percentage}% of the total. `;
          
          // Check if there's dominance
          if (segments[0].percentage > 50) {
            analysisText += `This segment represents more than half of the total, showing a clear dominance. `;
          } else if (segments[0].percentage > 30) {
            analysisText += `While significant, no single segment completely dominates the chart. `;
          } else {
            analysisText += `The distribution is fairly balanced, with no single segment dominating. `;
          }
          
          // Mention smallest segment
          analysisText += `The smallest segment is ${segments[segments.length - 1].category} at ${segments[segments.length - 1].percentage}%. `;
          
          // Top categories
          if (segments.length > 2) {
            const topThree = segments.slice(0, Math.min(3, segments.length));
            const topThreeSum = topThree.reduce((sum, segment) => sum + parseFloat(segment.percentage), 0);
            analysisText += `The top ${topThree.length} categories (${topThree.map(s => s.category).join(', ')}) account for ${topThreeSum.toFixed(1)}% of the total. `;
          }
        } else {
          analysisText = `This ${settings.type} visualization shows the data for ${title}. Based on the patterns visible, there are variations across the different categories or time periods shown. For more specific insights, I'd need to analyze the specific data points in detail.`;
        }
        
        analysisText += `\n\nTo gain more insights, you could ask about specific patterns, comparisons between categories, or potential factors affecting these trends.`;
        
        setChatMessages(prevMessages => [...prevMessages, {
          role: 'assistant',
          content: analysisText
        }]);
      }, 1000);
    } else {
      // Default response
      setTimeout(() => {
        setChatMessages(prevMessages => [...prevMessages, {
          role: 'assistant',
          content: "I'm continuing to show the visualization you requested. You can edit it using the controls on the right or ask me to analyze the data for insights."
        }]);
      }, 500);
    }
  };

  // Custom close handler to restore card in chat view
  const handleClose = () => {
    setIsClosing(true);
    
    // Add a slight delay for animations
    setTimeout(() => {
      if (onClose) {
        // Call the original onClose
        onClose();
        
        // Dispatch a custom event to restore the visualization card
        if (typeof window !== 'undefined') {
          try {
            // Include all necessary data to correctly restore the chart card
            window.dispatchEvent(new CustomEvent('restoreVisualization', {
              detail: { 
                data: parsedData,
                settings,
                type: settings.type,
                title,
                restoreChart: true // Flag to indicate we want to restore to chart view, not query view
              }
            }));
          } catch (error) {
            console.error('Error dispatching restore event:', error);
          }
        }
      }
      setIsClosing(false);
    }, 150);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-black/10 backdrop-blur-sm",
      "transition-all duration-300",
      isClosing ? "opacity-0" : "opacity-100 animate-in fade-in-0 zoom-in-95 duration-300"
    )}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="flex h-full w-full flex-col">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <PanelGroup direction="horizontal" className="h-full">
              {/* Chat panel (20% width) - only shown when toggle is active */}
              {showChatPanel && (
                <>
                  <Panel defaultSize={20} minSize={15} maxSize={25} className="h-full flex flex-col">
                    <div className="border-r h-full flex flex-col bg-background">
                      <div className="p-3 border-b bg-muted/20 flex justify-between items-center">
                        <h3 className="text-sm font-medium">Chat</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => setShowChatPanel(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1 overflow-auto p-4">
                        <div className="flex flex-col space-y-4">
                          {chatMessages.map((message, index) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-muted/20' 
                                  : 'bg-primary/10'
                              }`}
                            >
                              <p className="text-sm font-medium mb-1">
                                {message.role === 'user' ? 'You:' : 'AI Assistant:'}
                              </p>
                              <p className="text-sm whitespace-pre-line">{message.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Chat input */}
                      <div className="p-3 border-t">
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button 
                            size="icon" 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                  
                  <PanelResizeHandle className="w-1.5 bg-muted/30 hover:bg-muted transition" />
                </>
              )}
              
              {/* Visualization panel */}
              <Panel defaultSize={showChatPanel ? 80 : 100} className="h-full flex flex-col">
                <div className="h-full flex flex-col">
                  <div className="p-3 border-b bg-muted/20 flex-shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">Editor</h3>
                      <div className="flex items-center ml-4 gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleUndo} 
                          disabled={currentVersionIndex === 0}
                          className="h-7 w-7"
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleRedo} 
                          disabled={isCurrentVersion}
                          className="h-7 w-7"
                        >
                          <Redo className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChatPanel(!showChatPanel)}
                        className="ml-2"
                      >
                        {showChatPanel ? "Hide Chat" : "Show Chat"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="whitespace-nowrap" variant="purple">
                            <Save className="mr-2 h-4 w-4" />
                            Save<ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="w-56 bg-popover border shadow-md z-50" 
                          align="end" 
                          side="bottom" 
                          sideOffset={5}
                        >
                          <DropdownMenuItem 
                            onClick={() => setSelectDashboardOpen(true)}
                            className="cursor-pointer py-2 px-3 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            Save to Existing Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={saveToNew}
                            className="cursor-pointer py-2 px-3 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            Create New Dashboard
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button variant="ghost" size="icon" onClick={handleClose} className="ml-2">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex overflow-hidden">
                    {/* Main visualization area */}
                    <div className="flex-1 p-6 overflow-auto bg-background">
                      <div className="bg-card p-6 rounded-lg border shadow-sm">
                        <div className="flex justify-center items-center mb-6">
                          {titleEditing ? (
                            <div className="flex gap-2 max-w-md w-full">
                              <Input
                                ref={titleInputRef}
                                value={title}
                                onChange={handleTitleChange}
                                className="text-xl font-semibold"
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                              />
                              <Button size="sm" onClick={handleTitleSave} className="whitespace-nowrap">
                                Save
                              </Button>
                            </div>
                          ) : (
                            <h2 
                              className="text-xl font-semibold text-center cursor-pointer flex items-center gap-2 px-4 py-1 rounded hover:bg-muted/20 transition-colors"
                              onClick={() => setTitleEditing(true)}
                            >
                              {title}
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </h2>
                          )}
                        </div>
                        
                        {/* Main chart area */}
                        {parsedData && parsedData.length > 0 ? (
                          <div className="mx-auto max-w-4xl h-[400px] flex items-center justify-center">
                            <StandaloneChart 
                              type={settings.type} 
                              data={parsedData}
                              height={400}
                              width="100%"
                              colors={settings.colors}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                            No data available for visualization
                          </div>
                        )}
                      </div>
                      
                      {/* Data preview table */}
                      <div className="mt-6 border rounded-md overflow-hidden">
                        <div className="bg-muted/20 p-3 border-b">
                          <h3 className="text-sm font-medium">Data Preview</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/10 border-b">
                                {parsedData && parsedData.length > 0 && 
                                  Object.keys(parsedData[0]).map((key) => (
                                    <th key={key} className="text-left p-2 font-medium">{key}</th>
                                  ))
                                }
                              </tr>
                            </thead>
                            <tbody>
                              {parsedData && parsedData.slice(0, 5).map((row, index) => (
                                <tr key={index} className="border-b">
                                  {Object.values(row).map((value, i) => (
                                    <td key={i} className="p-2">
                                      {typeof value === 'number' 
                                        ? value.toLocaleString() 
                                        : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Controls panel */}
                    <div className="w-[300px] border-l bg-background overflow-auto">
                      <div className="p-3 border-b bg-muted/20">
                        <h3 className="text-sm font-medium">Chart Options</h3>
                      </div>
                      <div className="p-4">
                        <Tabs defaultValue="type" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="type">Chart Type</TabsTrigger>
                            <TabsTrigger value="appearance">Appearance</TabsTrigger>
                            <TabsTrigger value="data">Data Options</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="type" className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={settings.type === 'bar' ? "default" : "outline"}
                                className="flex flex-col h-auto py-4 justify-center items-center gap-2 w-full"
                                onClick={() => setSettings({...settings, type: 'bar'})}
                              >
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="12" width="4" height="8" rx="1" fill="currentColor" />
                                    <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
                                    <rect x="17" y="4" width="4" height="16" rx="1" fill="currentColor" />
                                  </svg>
                                </div>
                                <span className="text-sm">Bar Chart</span>
                              </Button>
                              
                              <Button
                                variant={settings.type === 'line' ? "default" : "outline"}
                                className="flex flex-col h-auto py-4 justify-center items-center gap-2 w-full"
                                onClick={() => setSettings({...settings, type: 'line'})}
                              >
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 16L8 11L13 16L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <span className="text-sm">Line Chart</span>
                              </Button>
                              
                              <Button
                                variant={settings.type === 'pie' ? "default" : "outline"}
                                className="flex flex-col h-auto py-4 justify-center items-center gap-2 w-full"
                                onClick={() => setSettings({...settings, type: 'pie'})}
                              >
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C17.1957 20.9464 14.6522 22 12 22C9.34784 22 6.8043 20.9464 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C6.8043 3.05357 9.34784 2 12 2Z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 2V12L19 19" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                </div>
                                <span className="text-sm">Pie Chart</span>
                              </Button>
                              
                              <Button
                                variant={settings.type === 'table' ? "default" : "outline"}
                                className="flex flex-col h-auto py-4 justify-center items-center gap-2 w-full"
                                onClick={() => setSettings({...settings, type: 'table'})}
                              >
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                    <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
                                    <path d="M3 15H21" stroke="currentColor" strokeWidth="2" />
                                    <path d="M9 3V21" stroke="currentColor" strokeWidth="2" />
                                    <path d="M15 3V21" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                </div>
                                <span className="text-sm">Table</span>
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="appearance" className="space-y-6">
                            {/* Color Palette Selection */}
                            <div className="space-y-3">
                              <label className="text-sm font-medium">Color Palette</label>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.keys(COLOR_PALETTES).map(palette => (
                                  <div 
                                    key={palette}
                                    className={`p-2 border rounded-md cursor-pointer ${
                                      settings.colorPalette === palette 
                                        ? 'border-primary ring-1 ring-primary' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={() => handlePaletteChange(palette)}
                                  >
                                    <p className="text-xs font-medium mb-1 capitalize">{palette}</p>
                                    <div className="flex">
                                      {COLOR_PALETTES[palette].slice(0, 5).map((color, i) => (
                                        <div 
                                          key={i} 
                                          className="w-5 h-5 rounded-full first:rounded-l-full last:rounded-r-full border border-border"
                                          style={{ backgroundColor: color }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Show Legend</label>
                                <div className="flex gap-2">
                                  <Button
                                    variant={settings.showLegend ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings({...settings, showLegend: true})}
                                  >
                                    On
                                  </Button>
                                  <Button
                                    variant={!settings.showLegend ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings({...settings, showLegend: false})}
                                  >
                                    Off
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Show Labels</label>
                                <div className="flex gap-2">
                                  <Button
                                    variant={settings.showLabels ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings({...settings, showLabels: true})}
                                  >
                                    On
                                  </Button>
                                  <Button
                                    variant={!settings.showLabels ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings({...settings, showLabels: false})}
                                  >
                                    Off
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Show Data Labels</label>
                                <div className="flex gap-2">
                                  <Button
                                    variant={settings.showDataLabels ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings({...settings, showDataLabels: true})}
                                  >
                                    On
                                  </Button>
                                  <Button
                                    variant={!settings.showDataLabels ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings({...settings, showDataLabels: false})}
                                  >
                                    Off
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="data" className="space-y-4">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Preview</label>
                                <div className="p-2 border rounded bg-muted/10 text-xs">
                                  <p>{parsedData?.length || 0} data points available</p>
                                  {parsedData && parsedData.length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium">Sample:</p>
                                      <pre className="mt-1 overflow-x-auto">
                                        {JSON.stringify(parsedData[0], null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        <div className="mt-6">
                          <Button 
                            onClick={() => {
                              setSettings({
                                ...settings,
                                title: title
                              });
                              toast.success('Chart options applied');
                            }}
                            className="w-full"
                            variant="purple"
                          >
                            Apply Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>
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