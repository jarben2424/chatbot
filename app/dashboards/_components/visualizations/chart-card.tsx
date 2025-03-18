'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartCardProps {
  title: string;
  description?: string | null;
  data: any[];
  chartType?: 'bar' | 'line' | 'area';
  categories: string[];
  index: string;
  className?: string;
}

export function ChartCard({
  title,
  description,
  data,
  chartType = 'line',
  categories,
  index,
  className
}: ChartCardProps) {
  // Format dates if the index field is a date
  const formattedData = data.map(item => {
    const newItem = { ...item };
    if (newItem[index] && typeof newItem[index] === 'string' && newItem[index].includes('T')) {
      try {
        const date = new Date(newItem[index]);
        newItem[index] = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      } catch (e) {
        // If date parsing fails, keep original
      }
    }
    return newItem;
  });

  // Color palette that matches the shadcn theme
  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--green-600))',
    'hsl(var(--indigo-600))',
    'hsl(var(--amber-600))',
    'hsl(var(--rose-600))'
  ];

  // Format large numbers for y-axis
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Format large numbers for tooltip
  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          
          {data && data.length > 0 ? (
            <div className="pt-1 h-48">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={index} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        return [formatTooltipValue(value), name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }} 
                    />
                    {categories.length > 1 && (
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconSize={10}
                        wrapperStyle={{ fontSize: '12px' }} 
                      />
                    )}
                    {categories.map((category, index) => (
                      <Bar 
                        key={category} 
                        dataKey={category} 
                        fill={colors[index % colors.length]} 
                        radius={[4, 4, 0, 0]} 
                      />
                    ))}
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={index} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        return [formatTooltipValue(value), name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }} 
                    />
                    {categories.length > 1 && (
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconSize={10}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    )}
                    {categories.map((category, index) => (
                      <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={index} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        return [formatTooltipValue(value), name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }} 
                    />
                    {categories.length > 1 && (
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconSize={10}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    )}
                    {categories.map((category, index) => (
                      <Area
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={colors[index % colors.length]}
                        fill={colors[index % colors.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
