'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getDashboards, createDashboard } from '@/lib/actions/dashboard'
import { Button } from '@/components/ui/button'
import { IconPlus, IconSpinner } from '@/components/ui/icons'
import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { EmptyDashboards } from '@/components/dashboard/empty-dashboards'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DashboardList() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newDashboardName, setNewDashboardName] = useState('')
  
  const { data: dashboards, isLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => getDashboards()
  })
  
  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDashboardName.trim()) return
    
    setIsCreating(true)
    try {
      const dashboardId = await createDashboard(newDashboardName.trim())
      router.push(`/dashboard/${dashboardId}`)
      setNewDashboardName('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating dashboard:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <IconSpinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (!dashboards?.length) {
    return <EmptyDashboards onCreateClick={() => setIsDialogOpen(true)} />
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Dashboards</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new dashboard</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDashboard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dashboard name</Label>
                <Input
                  id="name"
                  placeholder="My awesome dashboard"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <Button type="submit" disabled={isCreating || !newDashboardName.trim()}>
                {isCreating ? (
                  <>
                    <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Dashboard'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <DashboardCard key={dashboard.id} dashboard={dashboard} />
        ))}
      </div>
    </div>
  )
} 