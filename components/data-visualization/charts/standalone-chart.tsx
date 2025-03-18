import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, 
  Cell, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useEffect } from 'react';

const fallbackData = [
  { month: 'January', revenue: 10000 },
  { month: 'February', revenue: 15000 },
  { month: 'March', revenue: 12000 },
  { month: 'April', revenue: 18000 },
  { month: 'May', revenue: 20000 },
];

// Add proper TypeScript interface for chart props
interface StandaloneChartProps {
  type?: string;
  data: Record<string, any>[];
  height?: number;
  width?: string | number;
  colors?: string[];
  startYAxisFromZero?: boolean;
  formatNumbers?: boolean;
}

export function StandaloneChart({ 
  type = 'line', 
  data = [],
  height = 400,
  width = '100%',
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  startYAxisFromZero = false,
  formatNumbers = false
}: StandaloneChartProps) {
  // Ensure we have data
  const hasData = data && Array.isArray(data) && data.length > 0;
  
  if (!hasData) {
    return <div className="p-8 text-center text-muted-foreground">No data available</div>;
  }

  // Log visualization data for debugging
  useEffect(() => {
    console.log('Chart data:', {
      type,
      dataLength: data.length,
      sampleRow: data[0],
    });
  }, [type, data]);

  // Get all keys and determine the first string and first number
  const allKeys = Object.keys(data[0]);
  const stringKeys = allKeys.filter(key => typeof data[0][key] === 'string');
  const numberKeys = allKeys.filter(key => typeof data[0][key] === 'number');
  
  const firstStringKey = stringKeys[0] || allKeys[0];
  const firstNumberKey = numberKeys[0] || allKeys[allKeys.length > 1 ? 1 : 0];

  // Find date or month column if available
  const dateOrMonthKey = stringKeys.find(key => 
    key.toLowerCase().includes('date') || 
    key.toLowerCase().includes('month') ||
    key.toLowerCase().includes('year') ||
    key.toLowerCase().includes('time')
  ) || firstStringKey;

  // Find value columns
  const valueKeys = numberKeys.length > 0 ? numberKeys : [firstNumberKey];
  
  // Check for time series data
  const isTimeSeries = stringKeys.some(key => 
    key.toLowerCase().includes('date') || 
    key.toLowerCase().includes('month') ||
    key.toLowerCase().includes('year') ||
    key.toLowerCase().includes('time')
  );
  
  // Sort data if it's time series
  let sortedData = [...data];
  if (isTimeSeries) {
    sortedData = sortedData.sort((a, b) => {
      if (a[dateOrMonthKey] < b[dateOrMonthKey]) return -1;
      if (a[dateOrMonthKey] > b[dateOrMonthKey]) return 1;
      return 0;
    });
  }

  // Ensure all numeric values are properly parsed and rounded
  sortedData = sortedData.map(item => {
    const result = { ...item };
    valueKeys.forEach(key => {
      if (typeof result[key] === 'string') {
        const cleanValue = result[key].replace(/[$,]/g, '');
        const parsedValue = parseFloat(cleanValue);
        if (!isNaN(parsedValue)) {
          result[key] = Math.round(parsedValue); // Round to integers
        }
      } else if (typeof result[key] === 'number') {
        result[key] = Math.round(result[key]); // Round to integers
      }
    });
    return result;
  });

  // Determine if values are related to money
  const isMoneyData = valueKeys.some(key => 
    key.toLowerCase().includes('price') || 
    key.toLowerCase().includes('revenue') || 
    key.toLowerCase().includes('sales') || 
    key.toLowerCase().includes('income') ||
    key.toLowerCase().includes('cost') ||
    key.toLowerCase().includes('amount')
  );

  // Generate formatter function for numbers if formatNumbers is true
  const formatYAxis = (value: any): string => {
    // Convert to number if needed
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    if (!formatNumbers || isNaN(numValue)) return String(value);
    
    // Always format as currency if it appears to be monetary data
    if (isMoneyData) {
      // Format as currency
      if (numValue >= 1000000) {
        return `$${(numValue / 1000000).toFixed(1)}M`;
      } else if (numValue >= 1000) {
        return `$${(numValue / 1000).toFixed(0)}K`;
      } else {
        return `$${numValue}`;
      }
    } else {
      // Format regular numbers
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
      } else if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(0)}K`;
      } else {
        return String(numValue);
      }
    }
  };
  
  // Format the tooltip value
  const formatTooltipValue = (value: any, name: string) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return [value, name];
    
    // Format the tooltip for monetary values with comma separation
    if (isMoneyData) {
      return [`$${numValue.toLocaleString()}`, name.replace(/_/g, ' ')];
    } else {
      return [numValue.toLocaleString(), name.replace(/_/g, ' ')];
    }
  };
  
  // Function to format x-axis labels nicely
  const formatXAxisTick = (value: any) => {
    if (!value) return '';
    const strValue = String(value);
    
    // For dates, show only month or month+year
    if (isTimeSeries) {
      // If it contains both month and year, may need to format
      if (strValue.includes(' ') && strValue.length > 10) {
        const parts = strValue.split(' ');
        // Likely month and year
        if (parts.length === 2) {
          const month = parts[0].substring(0, 3); // First 3 chars of month
          const year = parts[1];
          return `${month} ${year}`;
        }
        return strValue.substring(0, 10) + '...'; // Truncate if too long
      }
    }
    
    // For non-dates, truncate if too long
    return strValue.length > 10 ? strValue.substring(0, 10) + '...' : strValue;
  };

  // Calculate xAxis interval to avoid crowding
  const calculateInterval = () => {
    const dataLength = sortedData.length;
    if (dataLength > 8) return Math.floor(dataLength / 6);
    return 0; // Show all ticks for fewer data points
  };

  // Set uniform margins for better appearance
  const chartMargins = { top: 10, right: 20, left: 20, bottom: 20 };
  
  switch (type) {
    case 'bar':
      return (
        <ResponsiveContainer width={width} height={height}>
          <BarChart 
            data={sortedData}
            margin={chartMargins}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey={dateOrMonthKey} 
              tick={{ fontSize: 12 }}
              tickFormatter={formatXAxisTick}
              interval={calculateInterval()}
            />
            <YAxis 
              padding={{ top: 15, bottom: 5 }}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
              width={50}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => value.replace(/_/g, ' ')}
            />
            {valueKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]} 
                name={key.replace(/_/g, ' ')}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
      
    case 'line':
      return (
        <ResponsiveContainer width={width} height={height}>
          <LineChart 
            data={sortedData}
            margin={chartMargins}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey={dateOrMonthKey} 
              tick={{ fontSize: 12 }}
              tickFormatter={formatXAxisTick}
              interval={calculateInterval()}
            />
            <YAxis 
              padding={{ top: 15, bottom: 5 }}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
              width={50}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => value.replace(/_/g, ' ')}
            />
            {valueKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]} 
                strokeWidth={2}
                dot={{ strokeWidth: 1, r: 4, fill: colors[index % colors.length] }}
                activeDot={{ r: 6 }}
                name={key.replace(/_/g, ' ')}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
      
    case 'pie':
      // For pie charts, we need a different data structure
      const pieData = data.map(item => ({
        name: item[dateOrMonthKey],
        value: item[valueKeys[0]]
      }));
      
      return (
        <ResponsiveContainer width={width} height={height}>
          <PieChart margin={chartMargins}>
            <Pie
              data={pieData}
              nameKey="name"
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => formatXAxisTick(entry.name)}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [formatTooltipValue(value, '')[0], '']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend 
              formatter={(value) => formatXAxisTick(value)}
              wrapperStyle={{ paddingTop: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
      
    default:
      // Auto choose best visualization
      if (isTimeSeries) {
        return (
          <ResponsiveContainer width={width} height={height}>
            <LineChart 
              data={sortedData}
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey={dateOrMonthKey} 
                tick={{ fontSize: 12 }}
                tickFormatter={formatXAxisTick}
                interval={calculateInterval()}
              />
              <YAxis 
                padding={{ top: 15, bottom: 5 }}
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
                width={50}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => value.replace(/_/g, ' ')}
              />
              {valueKeys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  dot={{ strokeWidth: 1, r: 4, fill: colors[index % colors.length] }}
                  activeDot={{ r: 6 }}
                  name={key.replace(/_/g, ' ')}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      } else {
        return (
          <ResponsiveContainer width={width} height={height}>
            <BarChart 
              data={sortedData}
              margin={chartMargins}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey={dateOrMonthKey} 
                tick={{ fontSize: 12 }}
                tickFormatter={formatXAxisTick}
                interval={calculateInterval()}
              />
              <YAxis 
                padding={{ top: 15, bottom: 5 }}
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
                width={50}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => value.replace(/_/g, ' ')}
              />
              {valueKeys.map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={colors[index % colors.length]} 
                  name={key.replace(/_/g, ' ')}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }
  }
} 