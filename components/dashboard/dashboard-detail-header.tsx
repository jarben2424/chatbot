'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/hooks/use-sidebar'

export function DashboardDetailHeader({ id }: { id: string }) {
  const { collapsed } = useSidebar()
  
  return (
    <div className="border-b">
      <div className="flex items-center h-[60px] px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}