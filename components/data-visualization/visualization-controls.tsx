'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from './color-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Check, BarChart, LineChart, PieChart, Table } from 'lucide-react';
import { VisualizationSettings } from '@/lib/types/visualization';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VisualizationControlsProps {
  data: any[];
  settings: VisualizationSettings;
  onChange: (settings: VisualizationSettings) => void;
}

export function VisualizationControls({
  data,
  settings,
  onChange
}: VisualizationControlsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState('type');
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  
  // Update parent when settings change
  useEffect(() => {
    onChange(localSettings);
  }, [localSettings, onChange]);
  
  // Get available data keys for axis selection
  const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Handle type change
  const handleTypeChange = (type: string) => {
    setLocalSettings(prev => ({
      ...prev,
      type
    }));
  };
  
  // Handle color change
  const handleColorChange = (color: string) => {
    const newColors = [...localSettings.colors];
    newColors[activeColorIndex] = color;
    setLocalSettings(prev => ({
      ...prev,
      colors: newColors
    }));
  };
  
  // Handle toggle settings
  const handleToggle = (key: keyof VisualizationSettings, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle x-axis change
  const handleXAxisChange = (value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      xAxis: value
    }));
  };
  
  return (
    <div className="visualization-controls">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="type">Chart Type</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="type" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {['bar', 'line', 'pie', 'scatter', 'table'].map(type => (
              <Button
                key={type}
                variant={localSettings.type === type ? "default" : "outline"}
                className="text-sm capitalize"
                onClick={() => handleTypeChange(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Colors</Label>
              <div className="flex gap-2 flex-wrap">
                {localSettings.colors.map((color, index) => (
                  <Popover key={index}>
                    <PopoverTrigger asChild>
                      <button
                        className="w-8 h-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: color }}
                        onClick={() => setActiveColorIndex(index)}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <HexColorPicker 
                        color={localSettings.colors[activeColorIndex]} 
                        onChange={handleColorChange} 
                      />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="showLegend">Show Legend</Label>
                <Switch
                  id="showLegend"
                  checked={localSettings.showLegend !== false}
                  onCheckedChange={(value) => handleToggle('showLegend', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showLabels">Show Labels</Label>
                <Switch
                  id="showLabels"
                  checked={localSettings.showLabels !== false}
                  onCheckedChange={(value) => handleToggle('showLabels', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showGrid">Show Grid</Label>
                <Switch
                  id="showGrid"
                  checked={localSettings.showGrid !== false}
                  onCheckedChange={(value) => handleToggle('showGrid', value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="xAxis">X Axis</Label>
              <Select
                value={localSettings.xAxis || ''}
                onValueChange={handleXAxisChange}
              >
                <SelectTrigger id="xAxis">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {dataKeys.map(key => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 