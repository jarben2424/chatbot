'use client';

import { Dashboard as DashboardUI } from '@/components/ui/dashboard';
import { type Message } from 'ai';

interface DashboardProps {
  message: Message;
}

export const Dashboard = ({ message }: DashboardProps) => {
  // Extract dashboard data from the message
  // The message will contain the data sent from the createDashboard tool
  const dashboardData = message.content?.dashboard;

  if (!dashboardData) {
    return null;
  }

  return (
    <DashboardUI
      title={dashboardData.title}
      description={dashboardData.description}
      metrics={dashboardData.metrics}
    />
  );
}; 