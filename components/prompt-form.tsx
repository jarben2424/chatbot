'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'

import { Button } from '@/components/ui/button'
import { IconArrowElbow } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'

export interface PromptProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  onSubmit: (value: string) => Promise<void>
}

export const PromptForm = React.forwardRef<HTMLFormElement, PromptProps>(
  ({ input, setInput, isLoading, onSubmit }, ref) => {
    const { formRef, onKeyDown } = useEnterSubmit()
    const inputRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => ({
      ...formRef.current,
      focus: () => {
        inputRef.current?.focus()
      }
    }))

    return (
      <form
        ref={formRef}
        onSubmit={async e => {
          e.preventDefault()
          if (!input?.trim()) {
            return
          }
          setInput('')
          await onSubmit(input)
        }}
        className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background sm:rounded-md sm:border sm:px-4 sm:py-2.5"
      >
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-4 sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || input === ''}
              >
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </form>
    )
  }
)
PromptForm.displayName = 'PromptForm' 