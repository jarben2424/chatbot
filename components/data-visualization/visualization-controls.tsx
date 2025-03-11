'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from './color-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Check, BarChart, LineChart, PieChart, Table } from 'lucide-react';

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

export function VisualizationControls({ type, data, settings, onChange }: VisualizationControlsProps) {
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'table', label: 'Table', icon: Table },
  ];
  
  // Color palette options
  const colorPalettes = [
    { id: 'default', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] },
    { id: 'pastels', colors: ['#67e8f9', '#a5b4fc', '#fda4af', '#99f6e4', '#fcd34d'] },
    { id: 'monochrome', colors: ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6'] },
  ];

  const handleChange = (update: Partial<VisualizationSettings>) => {
    const newSettings = { ...settings, ...update };
    onChange(newSettings);
  };

  const handleSave = () => {
    // Save to "Custom Views" in dashboard
    console.log('Saving visualization', settings);
    // Animation would be triggered here
  };

  return (
    <div className="space-y-6 p-4">
      <Tabs defaultValue="chart-type">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="chart-type">Chart Type</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart-type" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant={settings.type === type.id ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleChange({ type: type.id })}
                >
                  <Icon className="h-6 w-6" />
                  <span>{type.label}</span>
                  {settings.type === type.id && (
                    <Check className="h-4 w-4 absolute top-2 right-2" />
                  )}
                </Button>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {colorPalettes.map((palette) => (
                <Button
                  key={palette.id}
                  variant="outline"
                  className="h-10 flex items-center gap-2 justify-center"
                  onClick={() => handleChange({ colors: palette.colors })}
                >
                  <div className="flex">
                    {palette.colors.slice(0, 3).map((color, i) => (
                      <div 
                        key={i} 
                        className="w-4 h-4 rounded-full border" 
                        style={{ backgroundColor: color, marginLeft: i > 0 ? -4 : 0 }}
                      />
                    ))}
                  </div>
                  {palette.id.charAt(0).toUpperCase() + palette.id.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Show Legend</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleChange({ showLegend: !settings.showLegend })}
              >
                {settings.showLegend ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Show Title</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleChange({ showTitle: !settings.showTitle })}
              >
                {settings.showTitle ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Show Labels</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleChange({ showLabels: !settings.showLabels })}
              >
                {settings.showLabels ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <div className="space-y-2">
            <Label>X-Axis</Label>
            <Select
              value={settings.xAxis || Object.keys(data[0])[0]}
              onValueChange={(value) => handleChange({ xAxis: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select X-Axis" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(data[0]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
      
      <Button className="w-full" onClick={handleSave}>
        Save Visualization
      </Button>
    </div>
  );
} 