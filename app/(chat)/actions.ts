'use server';

import { generateText } from 'ai';
import { cookies } from 'next/headers';
import { myProvider } from '@/lib/ai/providers';
import { updateChatVisiblityById } from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { chat, message } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { saveMessages, getChats, getChatMessages } from '@/lib/db/queries';
import { customAlphabet } from 'nanoid';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
} from '@/lib/db/queries';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: { content: string };
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('gpt-3.5-turbo'),
    system: `
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    `,
    messages: [{ role: 'user', content: message.content }],
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function getInitialChats() {
  return await getChats();
}

export async function createNewChat() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const id = nanoid();
  await db.insert(chat).values({
    id,
    userId: session.user.id,
    title: 'New Chat',
    createdAt: new Date()
  });
  
  revalidatePath('/');
  return id;
}
