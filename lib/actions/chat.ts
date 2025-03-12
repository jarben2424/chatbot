'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { type Chat } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { chats, messages as dbMessages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from '@/lib/utils'

export async function getChats() {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  const result = await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt
    })
    .from(chats)
    .where(eq(chats.userId, session.user.id))
    .orderBy(chats.createdAt)

  return result
}

export async function getChatById(id: string) {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, id))
    .then(res => res[0] || null)

  if (!chat) {
    return null
  }

  const messages = await db
    .select()
    .from(dbMessages)
    .where(eq(dbMessages.chatId, chat.id))
    .orderBy(dbMessages.createdAt)

  return {
    ...chat,
    messages
  }
}

export async function createChat() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const id = nanoid()
  await db.insert(chats).values({
    id,
    userId: session.user.id,
    title: 'New Chat'
  })

  revalidatePath('/')
  return id
}

export async function removeChat(id: string) {
  const session = await auth()
  if (!session?.user) {
    return {
      error: 'Unauthorized'
    }
  }

  // Check if the chat exists and belongs to the user
  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, id))
    .then(res => res[0] || null)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Chat not found'
    }
  }

  // Delete messages first (foreign key constraint)
  await db.delete(dbMessages).where(eq(dbMessages.chatId, id))
  
  // Then delete the chat
  await db.delete(chats).where(eq(chats.id, id))

  revalidatePath('/')
  return {}
}

export function isChatOwner(chat: Chat, userId: string) {
  return chat.userId === userId
} 