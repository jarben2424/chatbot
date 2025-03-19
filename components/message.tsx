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

// Add type declaration for debugArtifactOpener
declare global {
  interface Window {
    debugArtifactOpener?: {
      setArtifactForId: (id: string, title: string) => boolean | void;
      logCurrentState: () => void;
      forceVisibility: () => string;
    };
  }
}

// Add type for tool names
type ToolName = 'queryData' | 'visualizeData' | 'getWeather' | 'createDocument' | 'updateDocument' | 'requestSuggestions' | 'buildReport';

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
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.reasoning && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={message.reasoning}
              />
            )}

            {(message.content || message.reasoning) && mode === 'view' && (
              <div className="flex flex-row gap-2 items-start">
                {message.role === 'user' && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid={`edit-${message.role}-${index}`}
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cn('flex flex-col gap-4', {
                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                      message.role === 'user',
                  })}
                >
                  <Markdown>{message.content as string}</Markdown>
                </div>
              </div>
            )}

            {message.content && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => {
                  const { toolName, toolCallId, state, args } = toolInvocation;
                  const typedToolName = toolName as ToolName;

                  if (state === 'result') {
                    const { result } = toolInvocation;

                    if (typedToolName === 'queryData') {
                      return (
                        <div key={toolCallId} className="mt-4">
                          <QueryDisplay 
                            data={result.data} 
                            sql={result.sql}
                            title={result.title}
                            description={result.description}
                          />
                        </div>
                      );
                    } else if (typedToolName === 'visualizeData') {
                      return (
                        <div key={toolCallId} className="mt-4">
                          <VisualizationPanel 
                            data={result.data}
                            visualization={result.visualization}
                            title={result.title}
                            description={result.description}
                            artifactId={result.artifactId}
                            expandable={true}
                            onClose={() => {}} 
                          />
                        </div>
                      );
                    } else if (typedToolName === 'getWeather') {
                      return (
                        <div key={toolCallId}>
                          <Weather weatherAtLocation={result} />
                        </div>
                      );
                    } else if (typedToolName === 'createDocument') {
                      return (
                        <DocumentPreview
                          key={toolCallId}
                          isReadonly={isReadonly}
                          result={result}
                        />
                      );
                    } else if (typedToolName === 'updateDocument') {
                      return (
                        <DocumentToolResult
                          key={toolCallId}
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      );
                    } else if (typedToolName === 'requestSuggestions') {
                      return (
                        <DocumentToolResult
                          key={toolCallId}
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      );
                    } else if (typedToolName === 'buildReport') {
                      return (
                        <div key={toolCallId} className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                          <div className="flex flex-col">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">
                              📄 Report Generated: {result.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              A report has been created based on your conversation
                              {result.visualizations?.length > 0 && `, with ${result.visualizations.length} relevant visualizations included`}.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <a 
                                href={`/document/${result.documentId}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // Try to set the artifact via window.debugArtifactOpener if available
                                  if (window.debugArtifactOpener?.setArtifactForId) {
                                    window.debugArtifactOpener.setArtifactForId(result.documentId, result.title);
                                  } else {
                                    // Directly update location
                                    window.location.href = `/document/${result.documentId}`;
                                  }
                                }}
                              >
                                View Report
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <pre key={toolCallId}>{JSON.stringify(result, null, 2)}</pre>
                      );
                    }
                  }
                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(typedToolName),
                      })}
                    >
                      {typedToolName === 'getWeather' ? (
                        <Weather />
                      ) : typedToolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : typedToolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : typedToolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : typedToolName === 'buildReport' ? (
                        <div key={toolCallId} className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="rounded-full bg-blue-200 h-6 w-6 flex items-center justify-center">
                                <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <h3 className="text-sm font-medium text-blue-800">
                                  Generating Report: {args.title}
                                </h3>
                                <p className="text-xs text-gray-600">
                                  Creating comprehensive report on {args.topic}...
                                </p>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: '0%' }} // This will be animated by CSS
                              />
                            </div>
                            
                            {/* Status message */}
                            <p className="text-xs text-blue-700">
                              Analyzing conversation context and finding relevant visualizations...
                            </p>
                          </div>
                        </div>
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
  const role = 'assistant' as const;

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
