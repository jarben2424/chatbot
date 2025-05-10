import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getChatById, isChatOwner } from '@/lib/actions/chat'
import { Chat } from '@/components/chat'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const chat = await getChatById(params.id)

  if (!chat || (!isChatOwner(chat, session.user.id) && !chat.sharePath)) {
    notFound()
  }

  return <Chat id={chat.id} initialMessages={[]} />
} 