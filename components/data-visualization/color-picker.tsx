'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const defaultColors = [
    '#4f46e5', // indigo
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f97316', // orange
    '#22c55e', // green
    '#06aed4', // blue
    '#ef4444', // red
  ];

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    onChange(newColors);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {colors.map((color, index) => (
        <div key={index} className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(index, e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div 
            className={cn(
              "w-8 h-8 rounded-full border cursor-pointer"
            )}
            style={{ backgroundColor: color }}
          />
        </div>
      ))}
      
      {colors.length < 8 && (
        <button
          className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center"
          onClick={() => onChange([...colors, defaultColors[colors.length % defaultColors.length]])}
        >
          <span className="text-lg">+</span>
        </button>
      )}
    </div>
  );
} 