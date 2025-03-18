'use client';

import { Chat } from '@/components/chat';
import type { Message } from 'ai';

interface ChatWrapperProps {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  isReadonly: boolean;
}

export function ChatWrapper(props: ChatWrapperProps) {
  return <Chat {...props} />;
} 