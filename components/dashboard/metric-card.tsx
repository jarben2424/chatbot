import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  description?: string
  value: string
  change?: {
    value: number
    trend: "up" | "down" | "neutral"
  }
  chart?: {
    type: "bar" | "line" | "pie"
    data: any[]
    dataKey: string
    colors?: string[]
  }
  footer?: React.ReactNode
  className?: string
}

export function MetricCard({
  title,
  description,
  value,
  change,
  chart,
  footer,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center mt-1">
            {change.trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
            ) : change.trend === "down" ? (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            ) : null}
            <span className={cn(
              "text-xs",
              change.trend === "up" ? "text-emerald-500" : 
              change.trend === "down" ? "text-red-500" : ""
            )}>
              {change.value > 0 && "+"}
              {change.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last month</span>
          </div>
        )}
        
        {chart && (
          <div className="h-[80px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === "bar" ? (
                <BarChart data={chart.data}>
                  <Bar 
                    dataKey={chart.dataKey} 
                    fill="var(--primary)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : chart.type === "line" ? (
                <LineChart data={chart.data}>
                  <Line 
                    type="monotone" 
                    dataKey={chart.dataKey} 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              ) : chart.type === "pie" ? (
                <PieChart>
                  <Pie
                    data={chart.data}
                    dataKey={chart.dataKey}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={35}
                    fill="var(--primary)"
                  >
                    {chart.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={chart.colors?.[index % (chart.colors?.length || 1)] || `var(--primary)`} 
                      />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <div>No chart type selected</div>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
