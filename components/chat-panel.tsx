'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { IconArrowElbow, IconRefresh, IconStop } from '@/components/ui/icons'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { AttachmentButton } from './attachment-button'
import { Message } from 'ai'

export interface ChatPanelProps {
  id?: string
  isLoading: boolean
  stop: () => void
  append: (message: Message) => Promise<void>
  reload: () => Promise<void>
  input: string
  handleInputChange: (value: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  formRef: React.RefObject<HTMLFormElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
  messages: Message[]
  attachments?: any[]
  setAttachments?: (files: any[]) => void
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  handleInputChange,
  handleSubmit,
  formRef,
  inputRef,
  messages,
  attachments = [],
  setAttachments
}: ChatPanelProps) {
  const { formRef: enterFormRef, onKeyDown } = useEnterSubmit()
  const [isAtBottom, setIsAtBottom] = useState(true)
  
  useEffect(() => {
    if (formRef.current) {
      enterFormRef.current = formRef.current
    }
  }, [formRef, enterFormRef])

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-t from-background from-50% to-transparent to-100% z-10">
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="px-4 py-2 space-y-4 border-t bg-background sm:rounded-t-xl sm:border md:py-4">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex flex-row items-start w-full gap-2"
          >
            {setAttachments && (
              <AttachmentButton 
                attachments={attachments}
                setAttachments={setAttachments}
              />
            )}
            
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Send a message..."
              spellCheck={false}
              className="min-h-10 w-full resize-none bg-background px-3 py-2"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
            />
            
            <div className="flex flex-col gap-2">
              <Button type="submit" size="icon" disabled={isLoading || input === ''}>
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
              {isLoading ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={stop}
                  className="bg-background"
                >
                  <IconStop />
                  <span className="sr-only">Stop generating</span>
                </Button>
              ) : (
                messages?.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={reload}
                    className="bg-background"
                  >
                    <IconRefresh />
                    <span className="sr-only">Regenerate response</span>
                  </Button>
                )
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 