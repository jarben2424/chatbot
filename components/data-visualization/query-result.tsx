'use client';

import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

interface QueryResultProps {
  data: any;
  visualization?: 'table' | 'line' | 'bar' | 'pie';
  settings?: {
    colors: string[];
    title: string;
    showLegend: boolean;
    theme: 'light' | 'dark';
  };
}

export function QueryResult({ 
  data, 
  visualization = 'table',
  settings = {
    colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'],
    title: '',
    showLegend: true,
    theme: 'light'
  }
}: QueryResultProps) {
  if (!data || typeof data !== 'object') {
    return <div>No data available</div>;
  }

  // Handle array results (like our sales by category)
  if (Array.isArray(data)) {
    switch (visualization) {
      case 'bar':
        return (
          <div className="h-[400px] w-full">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={Object.keys(data[0])[0]} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={Object.keys(data[0])[1]} fill={settings.colors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div className="h-[400px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  nameKey={Object.keys(data[0])[0]}
                  dataKey={Object.keys(data[0])[1]}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={settings.colors[index % settings.colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div className="h-[400px] w-full">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={Object.keys(data[0])[0]} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={Object.keys(data[0])[1]} stroke={settings.colors[0]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
      default:
        return (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(data[0]).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((value: any, j) => (
                      <TableCell key={j}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
    }
  }

  // Handle single value or object results
  return (
    <div className="rounded-md border p-4">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 