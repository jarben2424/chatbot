import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SidebarDesktop } from '@/components/sidebar-desktop'
import { SidebarMobile } from '@/components/sidebar-mobile'
import { SidebarToggle } from '@/components/sidebar-toggle'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { PageTransition } from '@/app/page-transition'

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'View and manage your data dashboards'
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <SidebarDesktop />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarToggle />
            <div className="flex-1" />
          </header>
          <SidebarMobile />
          <main className="flex flex-1 flex-col">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
} 