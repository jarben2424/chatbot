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
  height?: number | string;
  width?: string | number;
  colors?: string[];
  startYAxisFromZero?: boolean;
  formatNumbers?: boolean;
  showLegend?: boolean;
  showDataLabels?: boolean;
  title?: string;
}

export function StandaloneChart({ 
  type = 'line', 
  data = [],
  height = 400,
  width = '100%',
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
  startYAxisFromZero = false,
  formatNumbers = false,
  showLegend = true,
  showDataLabels = false,
  title
}: StandaloneChartProps) {
  // Ensure we have data
  const hasData = data && Array.isArray(data) && data.length > 0;
  
  if (!hasData) {
    return <div className="h-full flex items-center justify-center text-center text-muted-foreground">No data available</div>;
  }

  // Log visualization data for debugging
  useEffect(() => {
    console.log('Chart data:', {
      type,
      dataLength: data.length,
      sampleRow: data[0],
      showLegend,
      showDataLabels,
      height
    });
  }, [type, data, showLegend, showDataLabels, height]);

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
      // Get the string values
      const aVal = String(a[dateOrMonthKey]);
      const bVal = String(b[dateOrMonthKey]);
      
      // Check if values contain month and year format (e.g., "Dec 2024")
      if (aVal.match(/[A-Za-z]{3,}\s+\d{4}/) && bVal.match(/[A-Za-z]{3,}\s+\d{4}/)) {
        // Parse month-year strings into Date objects for proper comparison
        const parseMonthYear = (str: string): Date | null => {
          const parts = str.split(' ');
          const monthStr = parts[0];
          const year = parseInt(parts[1]);
          
          // Convert month name to month number (0-11)
          const months: Record<string, number> = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
            'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5,
            'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
          };
          
          const monthKey = monthStr.toLowerCase();
          // Handle both short and full month names
          const monthIdx = months[monthKey];
          if (monthIdx !== undefined) {
            return new Date(year, monthIdx);
          } else if (monthKey === 'may') {
            // Special case for 'may' which appears in both short and full lists
            return new Date(year, 4);
          }
          return null;
        };
        
        const aDate = parseMonthYear(aVal);
        const bDate = parseMonthYear(bVal);
        
        if (aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        }
      }
      
      // Fallback to string comparison if not in month-year format
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
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
      // If it contains both month and year, format consistently
      if (strValue.match(/[A-Za-z]{3,}\s+\d{4}/)) {
        const parts = strValue.split(' ');
        // Format as "MMM YYYY" (e.g., "Jan 2025")
        if (parts.length === 2) {
          const monthStr = parts[0];
          const year = parts[1];
          
          // Ensure consistent capitalization: first letter cap, rest lowercase
          const formattedMonth = monthStr.substring(0, 1).toUpperCase() + 
                                 monthStr.substring(1, 3).toLowerCase();
          
          return `${formattedMonth} ${year}`;
        }
      }
      
      // For other date formats
      if (strValue.includes(' ') && strValue.length > 10) {
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

  // Set uniform margins for better appearance in the visualization card
  const chartMargins = { top: 5, right: 35, left: 15, bottom: 30 };
  
  switch (type) {
    case 'bar':
      return (
        <ResponsiveContainer width={width} height={height as number}>
          <BarChart 
            data={sortedData}
            margin={chartMargins}
            barSize={50}
            barGap={2}
            barCategoryGap={5}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey={dateOrMonthKey} 
              tick={{ fontSize: 11 }}
              tickFormatter={formatXAxisTick}
              interval={calculateInterval()}
            />
            <YAxis 
              padding={{ top: 10, bottom: 10 }}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11 }}
              allowDecimals={false}
              domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
              width={55}
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
              wrapperStyle={{ paddingTop: 12 }}
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
        <ResponsiveContainer width={width} height={height as number}>
          <LineChart 
            data={sortedData}
            margin={chartMargins}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey={dateOrMonthKey} 
              tick={{ fontSize: 11 }}
              tickFormatter={formatXAxisTick}
              interval={calculateInterval()}
            />
            <YAxis 
              padding={{ top: 10, bottom: 10 }}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11 }}
              allowDecimals={false}
              domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
              width={55}
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
              wrapperStyle={{ paddingTop: 12 }}
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
        <ResponsiveContainer width={width} height={height as number}>
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
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => formatXAxisTick(value)}
            />
          </PieChart>
        </ResponsiveContainer>
      );
      
    default:
      // Auto choose best visualization
      if (isTimeSeries) {
        return (
          <ResponsiveContainer width={width} height={height as number}>
            <LineChart 
              data={sortedData}
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey={dateOrMonthKey} 
                tick={{ fontSize: 11 }}
                tickFormatter={formatXAxisTick}
                interval={calculateInterval()}
              />
              <YAxis 
                padding={{ top: 10, bottom: 10 }}
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
                width={55}
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
                wrapperStyle={{ paddingTop: 12 }}
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
          <ResponsiveContainer width={width} height={height as number}>
            <BarChart 
              data={sortedData}
              margin={chartMargins}
              barSize={50}
              barGap={2}
              barCategoryGap={5}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey={dateOrMonthKey} 
                tick={{ fontSize: 11 }}
                tickFormatter={formatXAxisTick}
                interval={calculateInterval()}
              />
              <YAxis 
                padding={{ top: 10, bottom: 10 }}
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                domain={startYAxisFromZero ? [0, 'dataMax'] : undefined}
                width={55}
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
                wrapperStyle={{ paddingTop: 12 }}
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