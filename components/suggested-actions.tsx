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
      title: 'Can you create an awesome looking 3D fractal animation?',
      action: 'Can you create an awesome looking 3D fractal animation?',
    },
    {
      title: 'Can you create a rocket simulation for a mission to mars using real orbital mechanics?',
      action: 'Can you create a rocket simulation for a mission to mars using real orbital mechanics?',
    },
    {
      title: 'Can you solve the "infinity long" problem?',
      action: 'Can you solve the "infinity long" problem?',
    },
    {
      title: 'What would happen to the Earth\'s climate if the planet\'s axial tilt were 0 degrees?',
      action: 'What would happen to the Earth\'s climate if the planet\'s axial tilt were 0 degrees?',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="flex flex-col gap-2 w-full max-w-xl mx-auto px-4"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <div
          key={`suggested-action-${index}`}
          className="opacity-80"
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
            className="text-left py-1.5 px-3 text-sm w-full h-auto justify-start items-start hover:bg-muted/20 text-foreground/70 transition-colors font-normal rounded-lg border-0 bg-gradient-to-r from-muted/10 to-transparent"
          >
            {suggestedAction.title}
          </Button>
        </div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
