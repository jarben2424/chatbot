'use client'

import { Button } from '@/components/ui/button'
import { IconSidebar } from '@/components/ui/icons'
import { useSidebar } from '@/hooks/use-sidebar'

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => toggleSidebar()}
    >
      <IconSidebar className="h-6 w-6" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
