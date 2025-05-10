'use client';

import { useEffect } from 'react';

export function SidebarDebug() {
  useEffect(() => {
    // Log the navigation items to console
    console.log('Sidebar navigation items:', sidebarNavItems);
  }, []);
  
  return null;
} 