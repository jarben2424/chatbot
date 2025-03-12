'use client';

import React from 'react';

interface HighlightProps {
  data: any[];
  title?: string;
}

export function Highlight({ data, title }: HighlightProps) {
  // For highlight, we're expecting a single value - extract it
  const getValue = () => {
    if (!data || data.length === 0) return null;
    
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    if (keys.length === 0) return null;
    
    // Get the first value from the first row
    const value = firstRow[keys[0]];
    
    // Format numbers with commas and decimal places if applicable
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        notation: value > 1000000 ? 'compact' : 'standard',
      }).format(value);
    }
    
    return value;
  };
  
  const formattedValue = getValue();
  
  return (
    <div className="flex flex-col items-center justify-center p-4 h-40">
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        {title || 'Result'}
      </h3>
      <div className="text-4xl font-bold">
        {formattedValue}
      </div>
    </div>
  );
}
