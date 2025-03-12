'use client'

import { Message } from 'ai'
import { useInView } from 'react-intersection-observer'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import { Message as MessageComponent } from './message'
import { Welcome } from './welcome'

export interface MessagesProps {
  messages: Message[]
  isLoading?: boolean
  showWelcome?: boolean
}

export function Messages({
  messages,
  isLoading,
  showWelcome = true
}: MessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { ref, inView } = useInView()

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const isEmpty = messages.length === 0

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex flex-col gap-4 h-full overflow-y-auto px-4',
        isEmpty ? 'justify-center' : 'justify-start pb-[80px] pt-4'
      )}
    >
      {isEmpty && !isLoading && showWelcome ? (
        <Welcome />
      ) : (
        messages.map((message, i) => {
          const isLastMessage = i === messages.length - 1
          return (
            <div key={message.id} ref={isLastMessage ? ref : undefined}>
              <MessageComponent message={message} />
            </div>
          )
        })
      )}
    </div>
  )
}
