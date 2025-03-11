'use client';

import type { ChatRequestOptions, Message } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
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

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}-${index}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
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

          <div className="flex flex-col gap-4 w-full">
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
                  <Markdown>{message.content as string}</Markdown>
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

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-2 flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => {
                  const { toolCallId, toolName, args } = toolInvocation;
                  
                  if (toolInvocation.state === 'result') {
                    const result = toolInvocation.result;
                    
                    if (toolName === 'queryData') {
                      return (
                        <div key={`tool-result-${toolCallId}`} className="mt-4">
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
                        <div key={`tool-result-${toolCallId}`} className="mt-4">
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
                        <div key={`tool-result-${toolCallId}`}>
                          <DocumentToolResult
                            type="create"
                            args={args}
                            result={result}
                            isReadonly={isReadonly}
                          />
                        </div>
                      );
                    } else if (toolName === 'updateDocument') {
                      return (
                        <div key={`tool-result-${toolCallId}`}>
                          <DocumentToolResult
                            type="update"
                            args={args}
                            result={result}
                            isReadonly={isReadonly}
                          />
                        </div>
                      );
                    } else if (toolName === 'requestSuggestions') {
                      return (
                        <div key={`tool-result-${toolCallId}`}>
                          <DocumentToolResult
                            type="request-suggestions"
                            args={args}
                            result={result}
                            isReadonly={isReadonly}
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <div key={`tool-result-${toolCallId}`} className="p-4 rounded-lg bg-secondary">
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`tool-call-${toolCallId}`}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
      return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
