import type { Message, ToolInvocation } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { AddToDashboardButton } from './add-to-dashboard-button';

// Type definition for SQL tool invocation result
interface SqlToolResult {
  query: string;
  results: any;
}

// Extended type for tool invocations with results
interface ToolInvocationWithResult extends ToolInvocation {
  result?: any;
  args?: any;
}

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  currentVisualizationType,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  currentVisualizationType?: string;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;
  
  // Check if the message is a database query result based on messageType first, then toolInvocations
  const isDbQuery = message.messageType === 'db_query' || 
    message.toolInvocations?.some(ti => 
      (ti.toolName === 'businessDbQuery' || ti.toolName === 'textToSql') && 
      ti.state === 'result');
  
  // Get the database tool invocation if it exists
  const dbQueryTool = message.toolInvocations?.find(ti => 
    (ti.toolName === 'businessDbQuery' || ti.toolName === 'textToSql') && 
    ti.state === 'result') as ToolInvocationWithResult | undefined;
  
  // Only show the dashboard button when actual query results are available
  const hasQueryResults = dbQueryTool && 
                         dbQueryTool.result && 
                         typeof dbQueryTool.result === 'object';
  
  // Debug log to help troubleshoot the dashboard button rendering
  console.log('Dashboard button debug:', { 
    messageId: message.id,
    isDbQuery,
    hasQueryResults,
    toolInvocations: message.toolInvocations?.map(ti => ({ 
      toolName: ti.toolName, 
      state: ti.state,
      hasResult: !!(ti as ToolInvocationWithResult).result 
    }))
  });
  
  // We want to show the disabled state when it's a db query but lacks the necessary data for the dashboard
  const showDisabledDashboardButton = isDbQuery && !hasQueryResults;

  // If this message has tool invocations but is not a SQL query message, don't show any actions
  if (message.toolInvocations && message.toolInvocations.length > 0 && !isDbQuery) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                await copyToClipboard(message.content as string);
                toast('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'up',
                  }),
                });

                toast.promise(upvote, {
                  loading: 'Upvoting...',
                  success: 'Upvoted Response!',
                  error: 'Failed to upvote response.',
                });
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'down',
                  }),
                });

                toast.promise(downvote, {
                  loading: 'Downvoting...',
                  success: 'Downvoted Response!',
                  error: 'Failed to downvote response.',
                });
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>
        
        {/* Add the dashboard button for SQL queries */}
        {isDbQuery && hasQueryResults && (
          <AddToDashboardButton 
            question={(dbQueryTool?.args as any)?.question || ''}
            sqlQuery={hasQueryResults ? (dbQueryTool?.result as any).query || '' : ''}
            result={hasQueryResults ? (dbQueryTool?.result as any).rows || [] : []}
            initialVisualizationType={currentVisualizationType}
          />
        )}
        
        {/* Show message when dashboard button is not available after refresh */}
        {showDisabledDashboardButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                <div className="translate-y-[1px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Dashboard data unavailable after page refresh
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
