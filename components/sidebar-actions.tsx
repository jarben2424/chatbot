'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@/components/ui/icons'
import { createChat } from '@/lib/actions/chat'

export function SidebarActions() {
  const router = useRouter()
  
  return (
    <div className="space-y-2">
      <Button
        variant="outline" 
        className="w-full justify-start"
        onClick={async () => {
          const id = await createChat()
          router.push(`/chat/${id}`)
        }}
      >
        <IconPlus className="mr-2" />
        New Chat
      </Button>
      
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
    </div>
  )
} 