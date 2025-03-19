'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, BarChart } from 'lucide-react';
import { cn } from "@/lib/utils";

interface HighlightCardProps {
  value: string | number;
  label: string;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function HighlightCard({
  value,
  label,
  description,
  trend,
  icon,
  className,
}: HighlightCardProps) {
  // Format numeric values with commas and rounding
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format with commas and round to 2 decimal places if needed
      return val % 1 === 0 
        ? val.toLocaleString() 
        : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(val);
  };

  // Determine the trend icon and color
  const getTrendDisplay = () => {
    if (!trend) return null;
    
    const { value, direction, label } = trend;
    
    return (
      <div className="flex items-center mt-1">
        {direction === 'up' ? (
          <TrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
        ) : direction === 'down' ? (
          <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
        ) : null}
        
        <span className={cn(
          "text-xs font-medium",
          direction === 'up' ? "text-emerald-500" : 
          direction === 'down' ? "text-red-500" : 
          "text-muted-foreground"
        )}>
          {value > 0 && '+'}
          {formatValue(value)}%
        </span>
        
        {label && (
          <span className="text-xs text-muted-foreground ml-1">{label}</span>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          {icon || <BarChart className="h-4 w-4 text-muted-foreground" />}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatValue(value)}</div>
        {getTrendDisplay()}
      </CardContent>
    </Card>
  );
}
