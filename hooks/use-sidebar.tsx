'use client';

import React, { createContext, useContext, useState } from 'react';

type SidebarContextType = {
  isSidebarOpen: boolean;
  toggleSidebar: (value?: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isSidebarOpen: false,
  toggleSidebar: () => {}
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = (value?: boolean) => {
    setSidebarOpen(value !== undefined ? value : !isSidebarOpen);
  };

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 