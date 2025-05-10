'use client'

import { useState } from 'react'

export interface useCopyToClipboardProps {
  timeout?: number
}

export function useCopyToClipboard({
  timeout = 2000
}: useCopyToClipboardProps = {}) {
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const copyToClipboard = (text: string) => {
    if (typeof navigator === 'undefined') {
      return false
    }

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, timeout)
    })
  }

  return { isCopied, copyToClipboard }
} 