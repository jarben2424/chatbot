'use client';

import { ReactNode } from 'react';
import { NotificationHeader } from '@/app/(notifications)/_components/notification-header';

export default function NotificationCreateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh flex flex-col bg-background">
      <NotificationHeader />
      <div className="flex-1">
        {children}
      </div>
    </main>
  );
}
