'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { IconMessage, IconPlus } from '@/components/ui/icons'
import { ChatList } from '@/components/chat-list'
import { SidebarActions } from '@/components/sidebar-actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { useSidebar } from '@/hooks/use-sidebar'
import Link from 'next/link'

interface SidebarMobileProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function SidebarMobile() {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6 border-b">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold"
              onClick={() => toggleSidebar(false)}
            >
              <IconMessage className="h-6 w-6" />
              <span>AI Chat</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8" asChild>
              <Link href="/" onClick={() => toggleSidebar(false)}>
                <IconPlus className="h-4 w-4" />
                <span className="sr-only">New Chat</span>
              </Link>
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="px-2 py-2">
              <ChatList />
            </div>
          </div>
          <div className="border-t p-4">
            <UserMenu mobile />
            <div className="mt-4 flex items-center justify-between">
              <ThemeToggle />
              <SidebarActions mobile />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 