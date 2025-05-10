'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

import { getChats, removeChat } from '@/lib/actions/chat'
import { cn } from '@/lib/utils'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { IconSpinner, IconMessage, IconTrash } from '@/components/ui/icons'
import Link from 'next/link'

export function ChatList() {
  const router = useRouter()
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null)

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => getChats()
  })

  const removeItem = async (id: string) => {
    setIsRemovingId(id)
    try {
      await removeChat(id)
      router.refresh()
    } catch (error) {
      console.error('Error removing chat:', error)
    } finally {
      setIsRemovingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <IconSpinner className="h-5 w-5 animate-spin" />
        </div>
      ) : chats?.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          <p>No chat history</p>
        </div>
      ) : (
        chats?.map(chat => (
          <div key={chat.id} className="relative group">
            <Link href={`/chat/${chat.id}`} passHref>
              <a className={cn(
                'flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-accent',
              )}>
                <IconMessage className="h-4 w-4" />
                <div className="flex-1 truncate">
                  {chat.title || 'New Chat'}
                </div>
              </a>
            </Link>
            <div className="absolute right-2 top-1 flex opacity-0 group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeItem(chat.id)
                    }}
                    disabled={isRemovingId === chat.id}
                  >
                    {isRemovingId === chat.id ? (
                      <IconSpinner className="h-3 w-3 animate-spin" />
                    ) : (
                      <IconTrash className="h-3 w-3" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete chat</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))
      )}
    </div>
  )
} 