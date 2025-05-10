'use client'

import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconPlus, IconBarChart } from '@/components/ui/icons'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DashboardGrid } from './dashboard-grid'
import { DashboardVisualization } from './dashboard-visualization'

interface DashboardDetailProps {
  dashboard: {
    id: string
    title: string
    visualizations: Array<{
      id: string
      title: string
      type: string
      data: any[]
      settings?: any
      position?: {
        x: number
        y: number
        width: number
        height: number
      }
    }>
  }
}

export function DashboardDetail({ dashboard }: DashboardDetailProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // State for grid layout
  const [layout, setLayout] = useState(() => 
    dashboard.visualizations.map(viz => ({
      i: viz.id,
      x: viz.position?.x || 0,
      y: viz.position?.y || 0,
      w: viz.position?.width || 2,
      h: viz.position?.height || 2,
    }))
  )
  
  // Handle layout change
  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout)
    // Save layout to backend (implement this)
    // saveLayout(dashboard.id, newLayout)
  }
  
  return (
    <div className="space-y-4">
      {dashboard.visualizations.length === 0 ? (
        <div className="flex h-64 items-center justify-center border border-dashed rounded-lg">
          <div className="text-center space-y-4">
            <IconBarChart className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">No visualizations yet</p>
              <p className="text-sm text-muted-foreground">
                Create visualizations with AI and add them to this dashboard.
              </p>
            </div>
            <Button onClick={() => router.push('/chat')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Create with AI
            </Button>
          </div>
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <DashboardGrid 
            layouts={{ lg: layout }} 
            onLayoutChange={handleLayoutChange}
          >
            {dashboard.visualizations.map(visualization => (
              <div key={visualization.id}>
                <DashboardVisualization 
                  visualization={visualization}
                  dashboardId={dashboard.id}
                />
              </div>
            ))}
          </DashboardGrid>
        </DndProvider>
      )}
    </div>
  )
} 