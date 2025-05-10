'use client';

import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const sampleData = {
  'sales-metrics': {
    title: 'Sales Metrics',
    data: Array.from({ length: 12 }, (_, i) => ({
      name: `Month ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
    })),
  },
  'user-analytics': {
    title: 'User Analytics',
    data: Array.from({ length: 6 }, (_, i) => ({
      name: `Category ${i + 1}`,
      value: Math.floor(Math.random() * 100),
    })),
  },
  'market-share': {
    title: 'Market Share',
    data: Array.from({ length: 4 }, (_, i) => ({
      name: `Product ${i + 1}`,
      value: Math.floor(Math.random() * 100),
    })),
  },
  'performance': {
    title: 'Performance Metrics',
    data: Array.from({ length: 24 }, (_, i) => ({
      name: `Hour ${i + 1}`,
      value: Math.floor(Math.random() * 100),
    })),
  },
};

export function DashboardView({ id }: { id: string }) {
  const dashboard = sampleData[id as keyof typeof sampleData];
  
  if (!dashboard) {
    return <div>Dashboard not found</div>;
  }

  const renderChart = () => {
    switch (id) {
      case 'sales-metrics':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dashboard.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'user-analytics':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={dashboard.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      case 'market-share':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={dashboard.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                fill="#8884d8"
              />
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dashboard.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{dashboard.title}</h2>
        {renderChart()}
      </Card>
    </div>
  );
} 