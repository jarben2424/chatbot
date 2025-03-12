import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { DashboardList } from '@/components/dashboard/dashboard-list'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <DashboardList />
      </div>
    </div>
  )
} 