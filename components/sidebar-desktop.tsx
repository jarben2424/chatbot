import { Button } from '@/components/ui/button'
import { IconMessage, IconPlus } from '@/components/ui/icons'
import { ChatList } from '@/components/chat-list'
import { SidebarActions } from '@/components/sidebar-actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { auth } from '@/auth'
import Link from 'next/link'

export async function SidebarDesktop() {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  return (
    <div className="hidden border-r bg-background h-screen lg:flex lg:w-80 lg:flex-col">
      <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6 border-b">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
        >
          <IconMessage className="h-6 w-6" />
          <span>AI Chat</span>
        </Link>
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8" asChild>
          <Link href="/">
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
        <UserMenu user={session.user} />
        <div className="mt-4 flex items-center justify-between">
          <ThemeToggle />
          <SidebarActions />
        </div>
      </div>
    </div>
  )
} 