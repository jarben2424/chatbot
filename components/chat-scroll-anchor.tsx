'use client'

import * as React from 'react'
import { useInView } from 'react-intersection-observer'

export function ChatScrollAnchor({ trackVisibility }: { trackVisibility?: boolean }) {
  const { ref, inView, entry } = useInView({
    trackVisibility,
    delay: 100,
    rootMargin: '0px 0px -150px 0px'
  })

  React.useEffect(() => {
    if (inView && entry?.target) {
      entry.target.scrollIntoView({
        block: 'start'
      })
    }
  }, [inView, entry])

  return <div ref={ref} className="h-px w-full" />
} 