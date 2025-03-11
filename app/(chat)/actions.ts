'use server';

import { generateText } from 'ai';
import { cookies } from 'next/headers';
import { myProvider } from '@/lib/ai/providers';
import { updateChatVisiblityById } from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
} from '@/lib/db/queries';

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
