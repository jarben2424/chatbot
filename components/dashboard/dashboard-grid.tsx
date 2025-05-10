'use client';

import { LineChart, BarChart, PieChart, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { motion, AnimatePresence } from 'framer-motion';

const ResponsiveGridLayout = WidthProvider(Responsive)

// Sample dashboard data
const sampleDashboards = [
  {
    id: 'sales-metrics',
    title: 'Sales Metrics',
    description: 'Monthly revenue and sales performance',
    icon: <LineChart className="h-8 w-8 text-blue-500" />,
    type: 'line',
  },
  {
    id: 'user-analytics',
    title: 'User Analytics',
    description: 'User engagement and activity metrics',
    icon: <BarChart className="h-8 w-8 text-green-500" />,
    type: 'bar',
  },
  {
    id: 'market-share',
    title: 'Market Share',
    description: 'Product market distribution',
    icon: <PieChart className="h-8 w-8 text-purple-500" />,
    type: 'pie',
  },
  {
    id: 'performance',
    title: 'Performance Metrics',
    description: 'System performance indicators',
    icon: <Activity className="h-8 w-8 text-orange-500" />,
    type: 'line',
  },
];

interface DashboardGridProps {
  children: React.ReactNode
  layouts: any
  onLayoutChange: (layout: any) => void
}

export function DashboardGrid({ children, layouts, onLayoutChange }: DashboardGridProps) {
  const [mounted, setMounted] = useState(false)
  
  // Prevents SSR layout issues
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={(layout, layouts) => onLayoutChange(layouts)}
          isDraggable
          isResizable
          margin={[16, 16]}
        >
          {children}
        </ResponsiveGridLayout>
      </motion.div>
    </AnimatePresence>
  )
}

export function DashboardGridOld() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sampleDashboards.map((dashboard) => (
        <Link 
          key={dashboard.id} 
          href={`/dashboards/${dashboard.id}`}
          className="block"
        >
          <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer relative z-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-background rounded-md border">
                  {dashboard.icon}
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{dashboard.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.description}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
} 