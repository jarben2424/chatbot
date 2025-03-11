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

export function StandaloneChart({ 
  type = 'line', 
  data = fallbackData,
  height = 400,
  width = '100%'
}) {
  // Check data and log for debugging
  useEffect(() => {
    console.log('StandaloneChart received:', {
      type,
      data: data?.slice(0, 2) || [],
      keys: data && data.length > 0 ? Object.keys(data[0]) : []
    });
  }, [type, data]);

  // Ensure we have data
  const hasData = data && Array.isArray(data) && data.length > 0;
  if (!hasData) {
    return <div className="p-8 text-center text-muted-foreground">No data available</div>;
  }

  // Force parsing of data to ensure proper number handling
  const parsedData = data.map(item => {
    const result = {...item};
    // Convert string numbers to actual numbers
    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'string' && 
          !isNaN(parseFloat(result[key].replace(/[^0-9.-]+/g, '')))) {
        result[key] = parseFloat(result[key].replace(/[^0-9.-]+/g, ''));
      }
    });
    return result;
  });

  // Get all keys and determine the first string and first number
  const allKeys = Object.keys(data[0]);
  const firstStringKey = allKeys.find(key => typeof data[0][key] === 'string') || allKeys[0];
  const firstNumberKey = allKeys.find(key => typeof data[0][key] === 'number') || allKeys[allKeys.length > 1 ? 1 : 0];

  // Colors
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width={width} height={height}>
          <LineChart data={parsedData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={firstStringKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={firstNumberKey} 
              stroke={colors[0]} 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      );
    
    case 'bar':
      return (
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={parsedData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={firstStringKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={firstNumberKey} fill={colors[0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    
    case 'pie':
      // Get a key to use for category (string) and value (number)
      const categoryKey = firstStringKey;
      const valueKey = firstNumberKey;
      
      return (
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={parsedData}
              nameKey={categoryKey}
              dataKey={valueKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {parsedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
      
    default:
      return <div>Unknown chart type</div>;
  }
} 