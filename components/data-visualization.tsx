'use client';

import {
  LineChart,
  BarChart as RechartsBarChart,
  Line,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DataVisualizationProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  columns: string[];
}

export function DataVisualization({ data, type, columns }: DataVisualizationProps) {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={columns[0]} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={columns[1]} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={columns[0]} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={columns[1]} fill="#82ca9d" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey={columns[1]}
                nameKey={columns[0]}
                cx="50%"
                cy="50%"
                fill="#8884d8"
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return renderChart();
} 