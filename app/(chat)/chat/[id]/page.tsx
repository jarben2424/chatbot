import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { ChatWrapper } from '@/components/chat-wrapper';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { QueryResult } from '@/components/data-visualization/query-result';
import { redirect } from 'next/navigation';

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ 
    model?: string;
    visibility?: string;
  }>;
}

export default async function ChatPage({
  params,
  searchParams,
}: ChatPageProps) {
  const { id } = await params;
  const { model = DEFAULT_CHAT_MODEL, visibility = 'private' } = await searchParams;
  
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const chat = await getChatById({ id });

  if (!chat) {
    return (
      <ChatWrapper
        id={id}
        initialMessages={[]}
        selectedChatModel={model}
        selectedVisibilityType={visibility}
        isReadonly={false}
      />
    );
  }

  if (chat.userId !== session.user.id) {
    return (
      <ChatWrapper
        id={id}
        initialMessages={chat.messages}
        selectedChatModel={model}
        selectedVisibilityType={visibility}
        isReadonly={true}
      />
    );
  }

  return (
    <ChatWrapper
      id={id}
      initialMessages={chat.messages}
      selectedChatModel={model}
      selectedVisibilityType={visibility}
      isReadonly={false}
    />
  );
}
