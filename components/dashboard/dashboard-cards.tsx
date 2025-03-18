import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts"
import { VisualizationType } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

// Demo data generator helpers
function generateDemoData(points = 12) {
  return Array.from({ length: points }).map((_, i) => ({
    name: String.fromCharCode(65 + i),
    value: Math.floor(Math.random() * 100) + 20,
  }))
}

type DashboardCardProps = {
  title: string
  description?: string
  value?: string | number
  visualizationType: VisualizationType
  data?: any[]
  className?: string
  onDelete?: () => void
  id?: string
}

export function DashboardCard({
  title,
  description,
  value,
  visualizationType,
  data = generateDemoData(),
  className,
  onDelete,
  id,
}: DashboardCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-70 hover:opacity-100 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visualizationType === "highlight" ? (
          <div>
            <div className="text-3xl font-bold mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value || '0'}
            </div>
            <p className="text-sm text-muted-foreground">
              {description || `Count of ${title.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <>
            {value && (
              <div className="text-2xl font-bold mb-2">
                {typeof value === 'number' ? value.toLocaleString() : value || '0'}
              </div>
            )}
            
            <div className="h-[180px]">
              {visualizationType === "bar-chart" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <Bar
                      dataKey="value"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {visualizationType === "line-chart" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              
              {visualizationType === "table" && (
                <div className="space-y-2">
                  {data.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between pb-2 last:pb-0">
                      <div className="text-sm">{item.name}</div>
                      <div className="font-medium">{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
