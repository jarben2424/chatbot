import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface LineChartProps {
  data: any[];
  xAxisKey?: string;
  yAxisKeys?: string[];
  colors?: string[];
  showLegend?: boolean;
}

export function LineChart({ 
  data, 
  xAxisKey, 
  yAxisKeys, 
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  showLegend = true
}: LineChartProps) {
  // Ensure we have valid data
  if (!data || data.length === 0) {
    return <div className="w-full h-80 flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  // Determine xAxis and yAxis keys if not provided
  const xKey = xAxisKey || Object.keys(data[0])[0];
  const yKeys = yAxisKeys || Object.keys(data[0])
    .filter(key => typeof data[0][key] === 'number' || 
      (typeof data[0][key] === 'string' && !isNaN(Number(data[0][key].toString().replace(/[^0-9.-]+/g, '')))))
    .slice(0, 5); // Limit to 5 lines

  console.log('LineChart rendering with:', {
    data: data.slice(0, 2), // Log first two items for debugging
    xKey,
    yKeys,
    dataLength: data.length
  });

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey={xKey} 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          
          {yKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
              strokeWidth={2}
              name={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
} 