'use client';

import { Chat } from '@/components/chat';
import type { Message } from 'ai';
import type { VisibilityType } from './visibility-selector';

interface ChatWrapperProps {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}

export function ChatWrapper(props: ChatWrapperProps) {
  return <Chat {...props} />;
} 