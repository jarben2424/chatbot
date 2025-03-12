import { Button } from '@/components/ui/button'
import { IconBarChart, IconPlus } from '@/components/ui/icons'

interface EmptyDashboardsProps {
  onCreateClick: () => void
}

export function EmptyDashboards({ onCreateClick }: EmptyDashboardsProps) {
  return (
    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <IconBarChart className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No dashboards</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have any dashboards yet. Create one to visualize your data.
        </p>
        <Button onClick={onCreateClick} className="mt-4">
          <IconPlus className="mr-2 h-4 w-4" />
          New Dashboard
        </Button>
      </div>
    </div>
  )
} 