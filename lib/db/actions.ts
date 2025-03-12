'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { chats, messages } from '@/lib/db/schema'
import { nanoid } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveChatMessage({
  chatId,
  content,
  role,
  userId
}: {
  chatId: string
  content: string
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  userId: string
}) {
  try {
    // Check if the chat exists
    const existingChat = await db.query.chats.findFirst({
      where: (chats, { eq }) => eq(chats.id, chatId)
    })

    // If the chat doesn't exist, create it
    if (!existingChat) {
      await db.insert(chats).values({
        id: chatId,
        userId,
        title: content.substring(0, 100),
        createdAt: new Date()
      })
    }

    // Save the message
    await db.insert(messages).values({
      id: nanoid(),
      chatId,
      content,
      role,
      userId,
      createdAt: new Date()
    })

    revalidatePath(`/chat/${chatId}`)
    return { success: true }
  } catch (error) {
    console.error('Error saving chat message:', error)
    return { success: false, error: error.message }
  }
} 