'use client'

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconBot, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { VisualizationDisplay } from '@/components/visualization-display'
import { QueryDisplay } from '@/components/data-visualization/query-display'
import { extractFunctionCall } from '@/lib/utils'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  // Check if the message contains a visualization function call
  const functionCall = extractFunctionCall(message.content);
  
  // Handle visualization content
  if (functionCall?.name === 'visualize_data' && functionCall.result) {
    const visualizationData = {
      id: functionCall.result.id,
      title: functionCall.result.title,
      type: functionCall.result.visualization,
      data: functionCall.arguments.data,
      settings: {
        xAxis: functionCall.arguments.xAxis,
        showGrid: true,
        showLabels: true,
        showLegend: true
      }
    };
    
    return (
      <div className={cn('group relative mb-4 flex flex-col')} {...props}>
        <div className="flex items-start">
          <div className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
            'bg-primary text-primary-foreground'
          )}>
            <IconBot />
          </div>
          <div className="ml-4 flex-1">
            <p className="mb-2">{functionCall.result.title}</p>
            <VisualizationDisplay visualization={visualizationData} />
          </div>
        </div>
      </div>
    );
  }
  
  // Handle query data content
  if (functionCall?.name === 'query_data' && functionCall.result) {
    return (
      <div className={cn('group relative mb-4 flex flex-col')} {...props}>
        <div className="flex items-start">
          <div className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
            'bg-primary text-primary-foreground'
          )}>
            <IconBot />
          </div>
          <div className="ml-4 flex-1">
            <p className="mb-2">{functionCall.result.description || 'Query Results'}</p>
            <QueryDisplay
              data={functionCall.result.result}
              query={functionCall.result.query}
              id={functionCall.result.id}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default message display
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser /> : <IconBot />}
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children && !Array.isArray(children) && 'type' in children) {
                return children
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
} 