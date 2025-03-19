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
  message: { role: string; content: string };
}) {
  const userContent =
    typeof message.content === 'string'
      ? message.content.substring(0, 100)
      : '';

  if (userContent?.length === 0 || message.role !== 'user') {
    return 'New chat';
  }

  const defaultTitle = userContent.length > 30
    ? `${userContent.substring(0, 30)}...`
    : userContent;

  try {
    const titleResponse = await generateText({
      model: myProvider.languageModel('gpt-3.5-turbo'),
      prompt: `Generate a short, concise title for a conversation that starts with this message: "${userContent}"`,
      maxTokens: 20,
    });

    return titleResponse || defaultTitle;
  } catch (error) {
    console.error('Error generating title:', error);
    return defaultTitle;
  }
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

// Add a new action to open an artifact
export async function openArtifact({
  documentId,
  title,
  kind,
}: {
  documentId: string;
  title: string;
  kind: string;
}) {
  // This is a server action that will be called from the client
  // It will return a script that will dispatch a custom event to open the artifact
  // Since we can't directly modify the client state from the server, we inject a script
  return {
    script: `
      try {
        const event = new CustomEvent('openArtifact', {
          detail: {
            documentId: '${documentId}',
            title: '${title}',
            kind: '${kind}',
            timestamp: ${Date.now()}
          }
        });
        console.log('Dispatching openArtifact event from server action');
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error dispatching event from server action:', error);
      }
    `
  };
}
