'use client';

import type { ChatRequestOptions, Message } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect, useRef } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon, UserIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { DataVisualization } from './data-visualization';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { QueryDisplay } from './data-visualization/query-display';
import { VisualizationPanel } from './data-visualization/visualization-panel';
import { useArtifactSelector } from '@/hooks/use-artifact';
import ReactMarkdown from 'react-markdown';
import { DocumentToolResult as NewDocumentToolResult } from './document-tool-result';
import { ChatInput } from './chat-input';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { CodeBlock } from '@/components/ui/codeblock';
import { MemoizedReactMarkdown } from '@/components/markdown';
import { IconBot, IconUser } from '@/components/ui/icons';
import { ChatMessageActions } from '@/components/chat-message-actions';
import { VisualizationResult } from './visualization-result';

interface MessageProps {
  message: Message;
  isLoading?: boolean;
  isUser?: boolean;
  timestamp?: Date;
  isReadonly?: boolean;
  showFeedback?: boolean;
  onFeedback?: (feedback: 'like' | 'dislike') => void;
}

export const MessageComponent = memo(function MessageComponent({
  message,
  isLoading = false,
  isUser = false,
  timestamp,
  isReadonly = false,
  showFeedback = false,
  onFeedback
}: MessageProps) {
  const [expanded, setExpanded] = useState(true);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Extract function call from message if present
  const functionCall = message.function_call ? {
    name: message.function_call.name,
    arguments: typeof message.function_call.arguments === 'string'
      ? JSON.parse(message.function_call.arguments || '{}')
      : message.function_call.arguments
  } : null;
  
  // Scroll into view when message appears
  useEffect(() => {
    if (messageRef.current && !isUser && !isLoading) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isUser, isLoading, message.content]);
  
  // Handle feedback
  const handleFeedback = (type: 'like' | 'dislike') => {
    if (onFeedback) {
      onFeedback(type);
    }
  };
  
  return (
    <div 
      ref={messageRef}
      className={cn(
        "py-4 px-3 flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-3xl",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground ml-3" : "bg-secondary text-secondary-foreground mr-3"
        )}>
          {isUser ? (
            <UserIcon className="w-4 h-4" />
          ) : (
            <SparklesIcon className="w-4 h-4" />
          )}
        </div>
        
        {/* Message content */}
        <div className={cn(
          "flex flex-col space-y-2",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "px-4 py-3 rounded-lg",
            isUser ? "bg-primary text-primary-foreground" : "bg-card"
          )}>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-150" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MemoizedReactMarkdown
                  className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  components={{
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>
                    },
                    code({ node, inline, className, children, ...props }) {
                      if (children.length) {
                        if (children[0] == '▍') {
                          return (
                            <span className="mt-1 animate-pulse cursor-default">▍</span>
                          )
                        }

                        children[0] = (children[0] as string).replace('`▍`', '▍')
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
                    },
                    // Custom component for visualizations
                    VisualizationResult: ({ data, title, type }) => {
                      return (
                        <VisualizationResult 
                          data={data} 
                          title={title} 
                          type={type}
                        />
                      )
                    }
                  }}
                >
                  {message.content as string}
                </MemoizedReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          {timestamp && (
            <div className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          
          {/* Function call results */}
          {!isLoading && (
            <>
              {message.function_call && message.function_call.name === 'create_document' && (
                <div className="mt-3">
                  <DocumentToolResult 
                    result={functionCall?.arguments}
                    isReadonly={isReadonly}
                  />
                </div>
              )}
              
              {message.function_call && message.function_call.name === 'query_data' && (
                <div className="mt-3">
                  <QueryDisplay 
                    query={functionCall?.arguments.query}
                    description={functionCall?.arguments.description}
                    result={functionCall?.arguments.data}
                  />
                </div>
              )}
              
              {message.function_call && message.function_call.name === 'visualize_data' && (
                <div className="mt-3">
                  <VisualizationPanel 
                    title={functionCall?.arguments.title || 'Visualization'}
                    visualization={functionCall?.arguments.visualization}
                    data={functionCall?.arguments.data}
                    description={functionCall?.arguments.description}
                  />
                </div>
              )}
            </>
          )}
          
          {/* Feedback buttons */}
          {showFeedback && !isUser && !isLoading && (
            <div className="flex space-x-2 mt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleFeedback('like')}
              >
                👍
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleFeedback('dislike')}
              >
                👎
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export function ThinkingMessage() {
  return (
    <div className="py-4 px-3 flex">
      <div className="flex max-w-3xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground mr-3">
          <SparklesIcon className="w-4 h-4" />
        </div>
        <div className="px-4 py-3 rounded-lg bg-card">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-150" />
          </div>
        </div>
      </div>
    </div>
  );
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  index,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  index: number;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const { data: votes } = useSWR<Array<Vote>>(
    chatId ? `/chat?chatId=${chatId}` : null,
    fetcher
  );

  // Extract function call from content if present
  const functionCall = message.function_call ? {
    name: message.function_call.name,
    arguments: JSON.parse(message.function_call.arguments || '{}')
  } : null;

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}-${index}`}
        className="w-full mx-auto max-w-3xl px-3 py-2 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments-${index}`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment, i) => (
                  <PreviewAttachment
                    key={`attachment-${i}`}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.reasoning && (
              <MessageReasoning
                reasoning={message.reasoning}
                isLoading={isLoading}
              />
            )}

            {mode === 'view' && message.content && (
              <div className="hidden-scrollbar -mr-4 overflow-auto pb-2 pr-4 md:block">
                <div
                  className={cx(
                    'min-h-[60px] min-w-[1px] w-full md:pb-4 whitespace-pre-wrap font-normal',
                    {
                      'break-words': message.role === 'assistant',
                    },
                  )}
                >
                  <ReactMarkdown
                    components={{
                      pre: ({ node, ...props }) => (
                        <pre className="bg-black/10 dark:bg-white/10 rounded-md p-2 overflow-auto my-2" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-black/10 dark:bg-white/10 rounded-md px-1" {...props} />
                      )
                    }}
                  >
                    {message.content as string}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {mode === 'edit' && (
              <div className="flex flex-col pb-2 gap-2">
                <div className="hidden-scrollbar -mr-4 overflow-auto pb-2 pr-4 grow ml-6">
                  <MessageEditor
                    initialContent={message.content as string}
                    onSave={(content) => {
                      setMode('view');
                      setMessages((messages) =>
                        messages.map((m) =>
                          m.id === message.id
                            ? {
                                ...m,
                                content,
                              }
                            : m,
                        ),
                      );
                    }}
                    onCancel={() => {
                      setMode('view');
                    }}
                  />
                </div>
              </div>
            )}

            {message.content && !isReadonly && message.role === 'user' && (
              <div className="flex flex-row items-center justify-end gap-2 h-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setMode('edit')}
                    >
                      <PencilEditIcon size={12} />
                      <span className="sr-only">Edit Message</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit message</TooltipContent>
                </Tooltip>
              </div>
            )}

            {message.visualization && (
              <div className="mt-4">
                <VisualizationPanel
                  type={message.visualization}
                  content={message.content as string}
                  data={message.data}
                />
              </div>
            )}

            {message.data?.type === 'query' && (
              <div className="mt-2">
                <QueryDisplay
                  query={message.data.query}
                  result={message.data.result}
                />
              </div>
            )}

            {message.data?.visualization && (
              <div className="mt-2">
                <DataVisualization
                  data={message.data.data}
                  visualization={message.data.visualization}
                  title={message.data.title}
                  description={message.data.description}
                />
              </div>
            )}

            {message.toolInvocations?.map((toolInvocation) => {
              const { id: toolCallId, name: toolName, args = {} } = toolInvocation;
              
              if (toolInvocation.state === 'result') {
                const result = toolInvocation.result;
                
                if (toolName === 'queryData') {
                  return (
                    <div key={`tool-result-${toolCallId}`} className="mt-3">
                      <QueryDisplay 
                        data={result.data} 
                        query={result.sql}
                        title={result.title}
                        description={result.description}
                      />
                    </div>
                  );
                } else if (toolName === 'visualizeData') {
                  return (
                    <div key={`tool-result-${toolCallId}`} className="mt-3">
                      <VisualizationPanel 
                        data={result.data}
                        type={result.visualization}
                        title={result.title}
                        description={result.description}
                      />
                    </div>
                  );
                } else if (toolName === 'getWeather') {
                  return (
                    <div key={`tool-result-${toolCallId}`}>
                      <Weather weatherAtLocation={result} />
                    </div>
                  );
                } else if (toolName === 'createDocument') {
                  return (
                    <div key={`tool-result-${toolCallId}`} className="document-tool-container">
                      <DocumentToolResult
                        type="create"
                        result={result}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                } else if (toolName === 'updateDocument') {
                  return (
                    <div key={`tool-result-${toolCallId}`} className="document-tool-container">
                      <DocumentToolResult
                        type="update"
                        result={result}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                } else if (toolName === 'requestSuggestions') {
                  return (
                    <div key={`tool-result-${toolCallId}`} className="document-tool-container">
                      <DocumentToolResult
                        type="request-suggestions"
                        result={result}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              } else {
                if (toolName === 'createDocument') {
                  return (
                    <div key={`tool-call-${toolCallId}`} className="document-tool-container">
                      <DocumentToolCall
                        type="create"
                        args={args}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                } else if (toolName === 'updateDocument') {
                  return (
                    <div key={`tool-call-${toolCallId}`} className="document-tool-container">
                      <DocumentToolCall
                        type="update"
                        args={args}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                } else if (toolName === 'requestSuggestions') {
                  return (
                    <div key={`tool-call-${toolCallId}`} className="document-tool-container">
                      <DocumentToolCall
                        type="request-suggestions"
                        args={args}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }
              
              return null;
            })}

            {/* Show document tool results */}
            {message.function_call && message.function_call.name === 'create_document' && (
              <div className="mt-3">
                <DocumentToolResult 
                  result={typeof message.function_call.arguments === 'string'
                    ? JSON.parse(message.function_call.arguments || '{}')
                    : message.function_call.arguments} 
                />
              </div>
            )}

            {message.function_call && message.function_call.name === 'query_data' && (
              <div className="mt-3">
                <QueryDisplay 
                  result={typeof message.function_call.arguments === 'string'
                    ? JSON.parse(message.function_call.arguments || '{}')
                    : message.function_call.arguments}
                />
              </div>
            )}

            {message.function_call && message.function_call.name === 'visualize_data' && (
              <div className="mt-3">
                <VisualizationPanel 
                  result={typeof message.function_call.arguments === 'string'
                    ? JSON.parse(message.function_call.arguments || '{}')
                    : message.function_call.arguments}
                />
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`