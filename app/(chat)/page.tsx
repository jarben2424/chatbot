import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Chat } from '@/components/chat'

export default async function ChatPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <Chat id={undefined} initialMessages={[]} />
}
