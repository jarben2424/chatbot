import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDashboardById, isDashboardOwner } from '@/lib/actions/dashboard'
import { DashboardDetail } from '@/components/dashboard/dashboard-detail'
import { DashboardDetailHeader } from '@/components/dashboard/dashboard-detail-header'

export interface DashboardPageProps {
  params: {
    id: string
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const dashboard = await getDashboardById(params.id)

  if (!dashboard || !isDashboardOwner(dashboard, session.user.id)) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardDetailHeader id={params.id} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <DashboardDetail dashboard={dashboard} />
      </div>
    </div>
  )
} 