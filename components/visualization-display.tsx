'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StandaloneChart } from '@/components/data-visualization/standalone-chart'
import { IconBarChart, IconExpand, IconExport, IconPlus } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDashboards, addVisualizationToDashboard } from '@/lib/actions/dashboard'
import { toast } from 'sonner'
import { exportChartAsImage, exportChartAsCSV } from '@/lib/utils/export-utils'
import { ErrorBoundary } from '@/components/error-handling/error-boundary'
import { VisualizationErrorFallback } from '@/components/error-handling/visualization-error'
import { AnimatedTransition } from '@/components/ui/animated-transition'
import { motion, AnimatePresence } from 'framer-motion'

interface VisualizationDisplayProps {
  visualization: {
    id: string
    title: string
    type: string
    data: any[]
    settings?: {
      xAxis?: string
      showGrid?: boolean
      showLabels?: boolean
      showLegend?: boolean
      colors?: string[]
    }
  }
}

export function VisualizationDisplay({ visualization }: VisualizationDisplayProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddToDashboardOpen, setIsAddToDashboardOpen] = useState(false)
  const [dashboards, setDashboards] = useState<Array<{id: string, title: string}>>([])
  const [selectedDashboardId, setSelectedDashboardId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  const { id, title, type, data, settings = {} } = visualization
  
  // Load dashboards when dialog opens
  const handleOpenDashboardDialog = async () => {
    try {
      const dashboardList = await getDashboards()
      setDashboards(dashboardList)
      setIsAddToDashboardOpen(true)
    } catch (error) {
      console.error('Error loading dashboards:', error)
      toast.error('Failed to load dashboards')
    }
  }
  
  // Add visualization to selected dashboard
  const handleAddToDashboard = async () => {
    if (!selectedDashboardId) {
      toast.error('Please select a dashboard')
      return
    }
    
    setIsAdding(true)
    try {
      const result = await addVisualizationToDashboard({
        dashboardId: selectedDashboardId,
        visualizationId: id,
        position: { x: 0, y: 0, width: 2, height: 2 } // Default position
      })
      
      if (result.success) {
        toast.success('Added to dashboard')
        setIsAddToDashboardOpen(false)
        // Optional: navigate to the dashboard
        // router.push(`/dashboard/${selectedDashboardId}`)
      } else {
        toast.error(result.error || 'Failed to add to dashboard')
      }
    } catch (error) {
      console.error('Error adding to dashboard:', error)
      toast.error('Failed to add visualization to dashboard')
    } finally {
      setIsAdding(false)
    }
  }
  
  // Export chart as image
  const handleExportImage = () => {
    exportChartAsImage(`chart-${id}`, title)
  }
  
  // Export data as CSV
  const handleExportCSV = () => {
    exportChartAsCSV(data, title)
  }
  
  // View visualization in fullscreen
  const handleViewFullscreen = () => {
    router.push(`/artifacts/${id}`)
  }
  
  return (
    <AnimatedTransition type="fade" duration={0.4}>
      <Card className="w-full overflow-hidden">
        <CardHeader className="bg-muted/50 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <IconBarChart className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4">
          <ErrorBoundary
            errorComponent={(error, reset) => (
              <VisualizationErrorFallback 
                error={error} 
                reset={reset} 
                type="chart" 
              />
            )}
            context={`chart-${id}`}
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              id={`chart-${id}`} 
              className="h-[250px]"
            >
              <StandaloneChart
                type={type}
                data={data}
                showLegend={settings.showLegend}
                showGrid={settings.showGrid}
                colors={settings.colors}
                xAxis={settings.xAxis}
                showLabels={settings.showLabels}
              />
            </motion.div>
          </ErrorBoundary>
        </CardContent>
        
        <CardFooter className="flex justify-between bg-muted/20 p-2">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={handleExportImage}
            >
              <IconExport className="h-4 w-4 mr-1" />
              PNG
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={handleExportCSV}
            >
              <IconExport className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
          
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={handleViewFullscreen}
            >
              <IconExpand className="h-4 w-4 mr-1" />
              View
            </Button>
            
            <Dialog open={isAddToDashboardOpen} onOpenChange={setIsAddToDashboardOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={handleOpenDashboardDialog}
                >
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add to Dashboard
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Dashboard</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select Dashboard</p>
                    
                    {dashboards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        You don't have any dashboards yet. Create one first.
                      </p>
                    ) : (
                      <Select 
                        value={selectedDashboardId} 
                        onValueChange={setSelectedDashboardId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dashboard" />
                        </SelectTrigger>
                        <SelectContent>
                          {dashboards.map((dashboard) => (
                            <SelectItem key={dashboard.id} value={dashboard.id}>
                              {dashboard.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      disabled={!selectedDashboardId || isAdding || dashboards.length === 0}
                      onClick={handleAddToDashboard}
                    >
                      {isAdding ? 'Adding...' : 'Add to Dashboard'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>
    </AnimatedTransition>
  )
} 