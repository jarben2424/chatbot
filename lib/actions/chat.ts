'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

import { Chat, chat, message } from '@/lib/db/schema'

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
)

export async function getChats() {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  const result = await db
    .select({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt
    })
    .from(chat)
    .where(eq(chat.userId, session.user.id))
    .orderBy(chat.createdAt)

  return result
}

export async function getChatById(id: string) {
  const session = await auth()
  if (!session?.user) {
    return null
  }

  const chat = await db
    .select()
    .from(chat)
    .where(eq(chat.id, id))
    .then(res => res[0] || null)

  if (!chat) {
    return null
  }

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.chatId, chat.id))
    .orderBy(message.createdAt)

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
  await db.insert(chat).values({
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

  const chatRecord = await db
    .select()
    .from(chat)
    .where(eq(chat.id, id))
    .then(res => res[0] || null)

  if (!chatRecord || chatRecord.userId !== session.user.id) {
    return {
      error: 'Chat not found'
    }
  }

  await db.delete(message).where(eq(message.chatId, id))
  
  await db.delete(chat).where(eq(chat.id, id))

  revalidatePath('/')
  return {}
}

export async function isChatOwner(chat: Chat, userId: string) {
  return chat.userId === userId
} 