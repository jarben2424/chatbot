'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Message } from 'ai'

import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

interface ChatMessageActionsProps {
  message: Message
}

export function ChatMessageActions({ message }: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  
  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
    toast.success('Message copied to clipboard')
  }

  return (
    <div className="flex items-center opacity-0 group-hover:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onCopy}
      >
        {isCopied ? <IconCheck /> : <IconCopy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
} 