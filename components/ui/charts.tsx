'use client'

import * as React from 'react'
import { 
  Area, 
  Bar, 
  CartesianGrid, 
  ComposedChart, 
  Legend, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  TooltipProps, 
  XAxis, 
  YAxis,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart
} from 'recharts'
import { cn } from '@/lib/utils'

const chartConfig = {
  width: 400,
  height: 400,
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  tooltip: true,
  legend: true,
  grid: true,
  xAxis: true,
  yAxis: true,
  secondaryAxis: false,
}

interface ChartConfig {
  width?: number
  height?: number
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  tooltip?: boolean
  legend?: boolean
  grid?: boolean
  xAxis?: boolean
  yAxis?: boolean
  secondaryAxis?: boolean
}

/**
 * A container for chart components
 */
export function ChartContainer({
  children,
  config,
  className,
}: {
  children: React.ReactElement
  config?: ChartConfig
  className?: string
}) {
  const mergedConfig = { ...chartConfig, ...config }

  return (
    <div className={cn('w-full h-full', className)}>
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        {children}
      </ResponsiveContainer>
    </div>
  )
}

/**
 * A styled chart tooltip component
 */
export function ChartTooltip({
  active,
  payload,
  label,
  className,
  formatter,
  labelFormatter,
}: TooltipProps<any, any> & {
  className?: string
  formatter?: (value: any, name: any, props: any) => React.ReactNode
  labelFormatter?: (label: any) => React.ReactNode
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-2 shadow-sm',
        className
      )}
    >
      <div className="grid gap-2">
        {labelFormatter ? (
          <div className="grid grid-flow-col items-center gap-2">
            <span className="text-sm font-medium">
              {labelFormatter(label)}
            </span>
          </div>
        ) : label ? (
          <div className="grid grid-flow-col items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
          </div>
        ) : null}
        <div className="grid gap-1">
          {payload.map((item: any, index: number) => (
            <div
              key={index}
              className="grid grid-flow-col items-center justify-start gap-2"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />
              <span className="text-xs font-medium tabular-nums">
                {item.name}
              </span>
              {formatter ? (
                <span className="text-xs font-medium tabular-nums">
                  {formatter(item.value, item.name, item)}
                </span>
              ) : (
                <span className="text-xs font-medium tabular-nums">
                  {typeof item.value === 'number'
                    ? item.value.toLocaleString()
                    : item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Line Chart Component
 */
export function LineChart({
  data,
  categories,
  index,
  colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ],
  className,
  chartConfig,
}: {
  data: any[]
  categories: string[]
  index: string
  colors?: string[]
  className?: string
  chartConfig?: ChartConfig
}) {
  const config = { ...chartConfig, ...chartConfig }
  
  return (
    <ChartContainer className={className} config={config}>
      <RechartsLineChart data={data} className="h-full w-full">
        {config.grid && (
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            className="stroke-muted"
          />
        )}
        {config.xAxis && (
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={10}
            className="text-xs text-muted-foreground"
            tickFormatter={(value) => {
              // Truncate long labels
              if (typeof value === 'string' && value.length > 10) {
                return value.substring(0, 10) + '...';
              }
              return value;
            }}
          />
        )}
        {config.yAxis && (
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-xs text-muted-foreground"
          />
        )}
        {config.tooltip && <Tooltip content={<ChartTooltip />} />}
        {config.legend && (
          <Legend
            verticalAlign="top"
            height={40}
            className="text-xs text-muted-foreground"
          />
        )}
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, className: 'fill-primary' }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}

/**
 * Bar Chart Component
 */
export function BarChart({
  data,
  categories,
  index,
  colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ],
  className,
  chartConfig,
}: {
  data: any[]
  categories: string[]
  index: string
  colors?: string[]
  className?: string
  chartConfig?: ChartConfig
}) {
  const config = { ...chartConfig, ...chartConfig }
  
  return (
    <ChartContainer className={className} config={config}>
      <RechartsBarChart data={data} className="h-full w-full">
        {config.grid && (
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            className="stroke-muted"
          />
        )}
        {config.xAxis && (
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={10}
            className="text-xs text-muted-foreground"
            tickFormatter={(value) => {
              // Truncate long labels
              if (typeof value === 'string' && value.length > 10) {
                return value.substring(0, 10) + '...';
              }
              return value;
            }}
          />
        )}
        {config.yAxis && (
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-xs text-muted-foreground"
          />
        )}
        {config.tooltip && <Tooltip content={<ChartTooltip />} />}
        {config.legend && (
          <Legend
            verticalAlign="top"
            height={40}
            className="text-xs text-muted-foreground"
          />
        )}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            radius={4}
            className="fill-primary"
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  )
}

/**
 * Highlight Card Component
 */
export function HighlightCard({
  title,
  value,
  description,
  className,
}: {
  title: string
  value: string | number
  description?: string
  className?: string
}) {
  // Format numbers with commas and decimal places if applicable
  const formattedValue = 
    typeof value === 'number' 
      ? new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2,
          notation: value > 1000000 ? 'compact' : 'standard',
        }).format(value)
      : value;
      
  return (
    <div className={cn("p-6 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col justify-center items-center", className)}>
      <h3 className="text-sm font-medium leading-none tracking-tight text-center mb-3">{title}</h3>
      <div className="text-3xl font-bold text-center">{formattedValue}</div>
      {description && <p className="text-xs text-muted-foreground mt-2 text-center">{description}</p>}
    </div>
  )
}
