'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatValue } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HighlightCardProps {
  title: string;
  description?: string | null;
  value: string | number;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
}

export function HighlightCard({ title, description, value, trend, className }: HighlightCardProps) {
  return (
    <Card className={cn("min-h-fit", className)}>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold">{formatValue(value)}</div>
            {trend && (
              <p className={`text-xs flex items-center ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {formatValue(trend.value)}
              </p>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
