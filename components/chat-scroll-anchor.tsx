'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

interface ChatScrollAnchorProps {
  trackVisibility?: boolean
}

export function ChatScrollAnchor({ trackVisibility }: ChatScrollAnchorProps) {
  const { ref, inView, entry } = useInView({
    trackVisibility,
    delay: 100,
    rootMargin: '0px 0px -150px 0px'
  })
  const hasScrolledToBottom = useRef(false)

  useEffect(() => {
    if (trackVisibility && !hasScrolledToBottom.current && entry?.isVisible) {
      setTimeout(() => {
        entry?.target.scrollIntoView({
          block: 'start'
        })
        hasScrolledToBottom.current = true
      }, 100)
    }
  }, [entry?.isVisible, trackVisibility, entry])

  return <div ref={ref} className="h-px w-full" />
} 