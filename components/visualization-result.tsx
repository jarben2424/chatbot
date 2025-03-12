'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StandaloneChart } from '@/components/data-visualization/standalone-chart'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Maximize2, Share2 } from 'lucide-react'
import { VisualizationPanel } from './data-visualization/visualization-panel'
import { AnimatedTransition } from './ui/animated-transition'

interface VisualizationResultProps {
  data: any[]
  title: string
  type: string
  description?: string
}

export function VisualizationResult({
  data,
  title,
  type,
  description
}: VisualizationResultProps) {
  const [expanded, setExpanded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const handleExpand = () => {
    setExpanded(!expanded)
  }
  
  const handleFullscreen = () => {
    setFullscreen(true)
  }
  
  const handleClose = () => {
    setFullscreen(false)
  }

  return (
    <>
      <AnimatedTransition type="fade" duration={0.3}>
        <Card className="mt-4 overflow-hidden">
          <CardHeader className="p-4 bg-muted/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleExpand}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </CardHeader>
          <CardContent className={`p-0 transition-all ${expanded ? 'h-64' : 'h-40'}`}>
            <div className="h-full w-full">
              <StandaloneChart
                type={type}
                data={data}
                showLegend
                showGrid
                colors={['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']}
              />
            </div>
          </CardContent>
          <CardFooter className="p-2 border-t bg-muted/30 flex justify-between">
            <div className="text-xs text-muted-foreground">
              {data.length} data points
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleFullscreen}>
              <Share2 className="h-3 w-3 mr-1" />
              Expand
            </Button>
          </CardFooter>
        </Card>
      </AnimatedTransition>
      
      {fullscreen && (
        <VisualizationPanel
          data={data}
          visualization={type}
          title={title}
          description={description}
          forceExpanded
          onClose={handleClose}
        />
      )}
    </>
  )
} 