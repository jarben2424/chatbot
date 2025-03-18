'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from './color-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, BarChart, LineChart, PieChart, Table, BadgeInfo } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

interface VisualizationControlsProps {
  type: string;
  data: any[];
  settings: VisualizationSettings;
  onChange: (settings: VisualizationSettings) => void;
}

// Type for the SettingsToggle component props
interface SettingsToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

export function VisualizationControls({ type, data, settings, onChange }: VisualizationControlsProps) {
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'table', label: 'Table', icon: Table },
  ];
  
  // Color palette options using theme variables to match app theme
  const colorPalettes = [
    { 
      id: 'theme',
      name: 'Theme', 
      colors: [
        'hsl(var(--chart-1, 221 83% 53%))',
        'hsl(var(--chart-2, 358 84% 56%))',
        'hsl(var(--chart-3, 160 84% 39%))',
        'hsl(var(--chart-4, 45 93% 47%))',
        'hsl(var(--chart-5, 262 80% 63%))'
      ] 
    },
    { 
      id: 'default', 
      name: 'Vibrant',
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] 
    },
    { 
      id: 'pastels', 
      name: 'Pastels',
      colors: ['#93c5fd', '#fca5a5', '#6ee7b7', '#fcd34d', '#c4b5fd'] 
    },
    { 
      id: 'monochrome', 
      name: 'Blues',
      colors: ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6'] 
    },
    {
      id: 'greys',
      name: 'Greys',
      colors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af']
    }
  ];

  const handleChange = (update: Partial<VisualizationSettings>) => {
    const newSettings = { ...settings, ...update };
    onChange(newSettings);
  };

  const getAxisOptions = (): string[] => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return Object.keys(data[0]);
  };

  // Toggle switch component for consistent UI
  const SettingsToggle = ({ label, value, onChange, description }: SettingsToggleProps) => (
    <div className="flex flex-row items-start justify-between space-y-0 py-2">
      <div className="space-y-0.5">
        <div className="flex items-center">
          <Label className="font-medium text-sm">{label}</Label>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BadgeInfo className="h-4 w-4 ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      <Tabs defaultValue="chart-type" className="w-full">
        <div className="px-4 py-3 border-b sticky top-0 bg-card z-10">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart-type">Chart Type</TabsTrigger>
            <TabsTrigger value="appearance">Style</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-4">
          <TabsContent value="chart-type" className="mt-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {chartTypes.map((chartType) => {
                const Icon = chartType.icon;
                return (
                  <Button
                    key={chartType.id}
                    variant={settings.type === chartType.id ? "default" : "outline"}
                    className="h-20 flex flex-col items-center justify-center gap-2 relative"
                    onClick={() => handleChange({ type: chartType.id })}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{chartType.label}</span>
                    {settings.type === chartType.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-0 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Color Palette</Label>
                <div className="grid grid-cols-2 gap-2">
                  {colorPalettes.map((palette) => (
                    <Button
                      key={palette.id}
                      variant="outline"
                      size="sm"
                      className={`h-9 justify-start px-3 ${
                        JSON.stringify(settings.colors) === JSON.stringify(palette.colors) ? 'border-primary' : ''
                      }`}
                      onClick={() => handleChange({ colors: palette.colors })}
                    >
                      <div className="flex mr-2">
                        {palette.colors.slice(0, 3).map((color, i) => (
                          <div 
                            key={i} 
                            className="w-3 h-3 rounded-full" 
                            style={{ 
                              backgroundColor: color, 
                              marginLeft: i > 0 ? -1 : 0,
                              border: "1px solid rgba(0,0,0,0.1)" 
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs">{palette.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <SettingsToggle
                  label="Show Legend"
                  value={settings.showLegend}
                  onChange={(checked: boolean) => handleChange({ showLegend: checked })}
                  description="Display a legend explaining data series"
                />
                
                <SettingsToggle
                  label="Show Title"
                  value={settings.showTitle}
                  onChange={(checked: boolean) => handleChange({ showTitle: checked })}
                  description="Show the visualization title"
                />
                
                <SettingsToggle
                  label="Show Labels"
                  value={settings.showLabels}
                  onChange={(checked: boolean) => handleChange({ showLabels: checked })}
                  description="Display axis labels on the chart"
                />

                <SettingsToggle
                  label="Show Data Labels"
                  value={settings.showDataLabels}
                  onChange={(checked: boolean) => handleChange({ showDataLabels: checked })}
                  description="Show values directly on the chart elements"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            {data && data.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">X-Axis Field</Label>
                  <Select
                    value={settings.xAxis || getAxisOptions()[0]}
                    onValueChange={(value: string) => handleChange({ xAxis: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field for X-axis" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAxisOptions().map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which field to use for the X-axis of your chart.
                  </p>
                </div>
                
                <div className="border rounded-md p-3 bg-muted/20">
                  <h4 className="text-sm font-medium mb-2">Available Data Fields</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {getAxisOptions().map((field) => (
                        <div key={field} className="text-xs p-1.5 bg-background rounded flex justify-between">
                          <span className="font-medium">{field}</span>
                          <span className="text-muted-foreground">
                            {typeof data[0][field] === 'number' ? 'Number' : 'Text'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No data available
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 