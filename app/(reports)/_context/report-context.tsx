'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our report state
interface ReportState {
  id?: string;
  title: string;
  description?: string;
  type: string;
  schedule: string;
  customSchedule?: string;
  isActive: boolean;
  content: any;
  recipients: Array<{ email: string; name?: string }>;
}

// Initialize with default values
const defaultReportState: ReportState = {
  title: '',
  description: '',
  type: 'dashboard_update',
  schedule: 'weekly',
  isActive: true,
  content: {},
  recipients: [],
};

// Define the context interface
interface ReportContextType {
  reportState: ReportState;
  updateReport: (data: Partial<ReportState>) => void;
  saveReport: () => Promise<void>;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
}

// Create the context
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Provider component
export function ReportProvider({ children }: { children: ReactNode }) {
  const [reportState, setReportState] = useState<ReportState>(defaultReportState);
  const [isDirty, setIsDirty] = useState(false);

  // Update report state
  const updateReport = (data: Partial<ReportState>) => {
    setReportState((prev) => ({ ...prev, ...data }));
    setIsDirty(true);
  };

  // Save report to backend
  const saveReport = async () => {
    try {
      // Save report logic will go here
      const method = reportState.id ? 'PUT' : 'POST';
      
      const response = await fetch('/api/reports', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportState),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save report');
      }
      
      const savedReport = await response.json();
      
      // Update the report state with the saved data
      setReportState((prev) => ({
        ...prev,
        id: savedReport.id,
      }));
      
      setIsDirty(false);
      return savedReport;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  };

  return (
    <ReportContext.Provider
      value={{
        reportState,
        updateReport,
        saveReport,
        isDirty,
        setIsDirty,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

// Hook to use the report context
export function useReportState() {
  const context = useContext(ReportContext);
  
  if (context === undefined) {
    throw new Error('useReportState must be used within a ReportProvider');
  }
  
  return context;
}
