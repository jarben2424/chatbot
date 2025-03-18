import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

type LineChartCardProps = {
  data: any[]
  xKey?: string
  yKey?: string
  height?: number
  className?: string
}

export function LineChartComponent({
  data,
  xKey = "name",
  yKey = "value",
  height = 300,
  className,
}: LineChartCardProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey={xKey} 
            tickLine={false}
            axisLine={true}
            tick={{ fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            tickLine={false}
            axisLine={true}
            tick={{ fontSize: 12 }}
            width={30}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            content={(props) => {
              const { active, payload } = props;
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {payload[0]?.payload?.name}
                      </span>
                      <span className="font-bold text-foreground">
                        ${payload[0]?.value?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            strokeWidth={2}
            dataKey={yKey}
            activeDot={{
              r: 6,
              style: { fill: "var(--theme-primary)", opacity: 0.8 },
            }}
            style={{
              stroke: "var(--theme-primary)",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
