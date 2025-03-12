'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StandaloneChart } from '@/components/data-visualization/standalone-chart'
import { IconBarChart, IconEdit, IconTrash, IconExpand, IconExport } from '@/components/ui/icons'
import { exportChartAsImage, exportChartAsCSV } from '@/lib/utils/export-utils'
import { removeVisualizationFromDashboard } from '@/lib/actions/dashboard'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VisualizationControls } from '@/components/data-visualization/visualization-controls'

interface DashboardVisualizationProps {
  visualization: {
    id: string
    title: string
    type: string
    data: any[]
    settings?: any
  }
  dashboardId: string
}

export function DashboardVisualization({ visualization, dashboardId }: DashboardVisualizationProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState(visualization.settings || {})
  
  const { id, title, type, data } = visualization
  
  // Handle delete visualization
  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove this visualization?')) {
      setIsDeleting(true)
      try {
        const result = await removeVisualizationFromDashboard({
          dashboardId,
          visualizationId: id
        })
        
        if (result.success) {
          toast.success('Visualization removed')
        } else {
          toast.error(result.error || 'Failed to remove visualization')
        }
      } catch (error) {
        console.error('Error removing visualization:', error)
        toast.error('Failed to remove visualization')
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  // Export chart as image
  const handleExportImage = () => {
    exportChartAsImage(`viz-${id}`, title)
  }
  
  // Export data as CSV
  const handleExportCSV = () => {
    exportChartAsCSV(data, title)
  }
  
  // Save settings
  const handleSaveSettings = async (updatedSettings: any) => {
    setSettings(updatedSettings)
    // Implement save settings action
    setIsEditing(false)
    toast.success('Settings updated')
  }
  
  return (
    <>
      <Card className="w-full h-full overflow-hidden">
        <CardHeader className="bg-muted/50 py-2 px-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <IconBarChart className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-3 flex-grow">
          <div id={`viz-${id}`} className="h-full w-full">
            <StandaloneChart
              type={type}
              data={data}
              showLegend={settings.showLegend !== false}
              showGrid={settings.showGrid !== false}
              colors={settings.colors}
              xAxis={settings.xAxis}
              showLabels={settings.showLabels !== false}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end bg-muted/20 p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={handleExportImage}
          >
            <IconExport className="h-3.5 w-3.5" />
            <span className="sr-only">Export</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
          >
            <IconEdit className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <IconTrash className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Visualization</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <VisualizationControls
                data={data}
                settings={settings}
                onChange={setSettings}
              />
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleSaveSettings(settings)}>
                  Save Changes
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-card/50">
              <h3 className="text-sm font-medium mb-2">Preview</h3>
              <div className="h-72">
                <StandaloneChart
                  type={type}
                  data={data}
                  showLegend={settings.showLegend !== false}
                  showGrid={settings.showGrid !== false}
                  colors={settings.colors}
                  xAxis={settings.xAxis}
                  showLabels={settings.showLabels !== false}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 