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
  }>;
}

export default async function ChatPage({
  params,
  searchParams,
}: ChatPageProps) {
  const { id } = await params;
  const { model = DEFAULT_CHAT_MODEL } = await searchParams;
  
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
        isReadonly={false}
      />
    );
  }

  // Get messages for this chat
  const dbMessages = await getMessagesByChatId({ id });
  const messages = convertToUIMessages(dbMessages);

  if (chat.userId !== session.user.id) {
    return (
      <ChatWrapper
        id={id}
        initialMessages={messages}
        selectedChatModel={model}
        isReadonly={true}
      />
    );
  }

  return (
    <ChatWrapper
      id={id}
      initialMessages={messages}
      selectedChatModel={model}
      isReadonly={false}
    />
  );
}
