'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconArrowElbow } from '@/components/ui/icons'

export function ButtonScrollToBottom({
  className,
  ...props
}: ButtonProps) {
  const [isAtBottom, setIsAtBottom] = React.useState(true)

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight

      const isBottom = scrollTop + clientHeight >= scrollHeight - 10
      setIsAtBottom(isBottom)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'absolute right-4 top-1 z-10 bg-background transition-opacity duration-300 sm:right-8 md:top-2',
        isAtBottom ? 'opacity-0' : 'opacity-100',
        className
      )}
      onClick={() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        })
      }
      {...props}
    >
      <IconArrowElbow />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  )
} 