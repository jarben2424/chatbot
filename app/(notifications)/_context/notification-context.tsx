'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Notification type interface matching the database schema
export interface NotificationState {
  id?: string;
  title: string;
  description: string;
  type: 'dashboard_update' | 'anomaly_detection' | 'recommendation';
  content: any;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  customSchedule?: string;
  isActive: boolean;
  recipients: { id: string; email: string; name?: string }[];
  recipientCount?: number;
}

interface NotificationContextType {
  notification: NotificationState;
  setNotification: React.Dispatch<React.SetStateAction<NotificationState>>;
  updateNotificationField: <K extends keyof NotificationState>(field: K, value: NotificationState[K]) => void;
  saveNotification: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

// Initial state for a new notification
const initialNotificationState: NotificationState = {
  title: '',
  description: '',
  type: 'dashboard_update',
  content: { insights: [], metrics: [] },
  schedule: 'weekly',
  isActive: true,
  recipients: [],
  recipientCount: 0
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState>(initialNotificationState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Update a specific field in the notification
  const updateNotificationField = <K extends keyof NotificationState>(field: K, value: NotificationState[K]) => {
    setNotification(prev => ({ ...prev, [field]: value }));
  };

  // Save notification to database
  const saveNotification = async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const notificationData = { ...notification };
      
      // Make API request
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notification');
      }

      const savedNotification = await response.json();
      
      // Update state with saved ID
      setNotification(prev => ({ ...prev, id: savedNotification.id }));
      return savedNotification.id;
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the notification');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        setNotification,
        updateNotificationField,
        saveNotification,
        isLoading,
        error
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use the notification context
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
