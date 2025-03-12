'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconBarChart, IconTrash, IconSpinner } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { removeDashboard } from '@/lib/actions/dashboard'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { motion } from 'framer-motion'

interface DashboardCardProps {
  dashboard: {
    id: string
    title: string
    createdAt: Date
    visualizationCount?: number
  }
}

export function DashboardCard({ dashboard }: DashboardCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await removeDashboard(dashboard.id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting dashboard:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <IconBarChart className="h-5 w-5 text-primary" />
              <span className="truncate">{dashboard.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              <p>Created on {formatDate(dashboard.createdAt)}</p>
              <p className="mt-1">
                {dashboard.visualizationCount || 0} {dashboard.visualizationCount === 1 ? 'visualization' : 'visualizations'}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/30 px-6 py-4">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/${dashboard.id}`}>
                View Dashboard
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowDeleteAlert(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <IconSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <IconTrash className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dashboard and all its visualizations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 