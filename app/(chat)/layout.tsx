import { Metadata } from 'next'

import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { SidebarDesktop } from '@/components/sidebar-desktop'
import { SidebarMobile } from '@/components/sidebar-mobile'
import { SidebarToggle } from '@/components/sidebar-toggle'

export const experimental_ppr = true;

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Chat with AI assistant.'
}

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  if (!session?.user) {
    return <>{children}</>
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
            <Script
              src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
              strategy="beforeInteractive"
            />
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
