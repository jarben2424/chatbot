'use client'

import { useChat, type Message } from 'ai/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatMessage } from '@/components/chat-message'
import { toast } from 'sonner'
import { useArtifact } from '@/hooks/use-artifact'
import { extractFunctionCall } from '@/lib/utils'

export interface ChatProps extends React.ComponentProps<'div'> {
  id?: string
  initialMessages?: Message[]
}

export function Chat({ id, initialMessages = [] }: ChatProps) {
  const router = useRouter()
  const pathname = usePathname()
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [attachments, setAttachments] = useState<Array<any>>([])
  const { isVisible } = useArtifact()

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    stop,
    setMessages,
    setInput
  } = useChat({
    api: '/api/chat',
    id,
    initialMessages,
    onResponse(response) {
      if (response.status === 401) {
        toast.error('Please sign in to continue.')
      }
      
      // Handle function calls for document creation
      const reader = response.body?.getReader();
      if (!reader) return;
      
      const decoder = new TextDecoder();
      let content = '';
      
      (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value);
        }
        
        // Handle function calls
        const functionCall = extractFunctionCall(content);
        if (functionCall?.name === 'create_document' && functionCall.arguments) {
          const { title, kind } = functionCall.arguments;
          
          if (title && kind) {
            console.log(`Created document: ${title} (${kind})`);
          }
        }
      })();
    },
    onFinish() {
      if (!id) {
        const newId = response.headers.get('x-chat-id')
        if (newId && pathname === '/') {
          router.push(`/${newId}`)
        }
      }
    },
    onError(error) {
      toast.error('An error occurred during the chat.')
      console.error(error)
    }
  })

  // Focus on input when messages change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [messages])

  return (
    <div className={`flex flex-col h-full ${isVisible ? 'chat-with-artifact' : ''}`}>
      {messages.length ? (
        <div className="flex-1 overflow-auto">
          <div className="pb-[200px] pt-4 md:pt-10">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="thinking-indicator">
                <div className="dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyScreen
          setInput={handleInputChange}
          setMessages={setMessages}
          append={append}
        />
      )}
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        formRef={formRef}
        inputRef={inputRef}
        attachments={attachments}
        setAttachments={setAttachments}
      />
    </div>
  )
}
