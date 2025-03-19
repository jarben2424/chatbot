'use client';

import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Help me create a customer segmentation strategy for my e-commerce store',
      action: 'Help me create a customer segmentation strategy for my e-commerce store',
    },
    {
      title: 'Analyze this customer data and identify high-value segments',
      action: 'Analyze this customer data and identify high-value segments',
    },
    {
      title: 'Design an email campaign sequence for our new product launch',
      action: 'Design an email campaign sequence for our new product launch',
    },
    {
      title: 'Generate a dashboard to track customer engagement metrics over time',
      action: 'Generate a dashboard to track customer engagement metrics over time',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="flex flex-col gap-2 w-full max-w-xl mt-4 pl-[24px] pr-4"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <div
          key={`suggested-action-${index}`}
          className="opacity-85"
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);
              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left py-1.5 pl-3 pr-3 text-sm w-full h-auto justify-start items-start hover:bg-muted/20 text-gray-500 transition-colors font-normal rounded-lg border-0"
          >
            {suggestedAction.title}
          </Button>
        </div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
