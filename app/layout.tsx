import '@/app/globals.css'
import { Inter as FontSans } from 'next/font/google'
import { cookies } from 'next/headers'

import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { siteConfig } from '@/config/site'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

interface RootLayoutProps {
  children: React.ReactNode
}

export const metadata = {
  title: 'AI Chat App',
  description: 'An AI chat application'
}

export const viewport = {
  themeColor: '#000000' // Move theme color here from metadata
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  )
}
