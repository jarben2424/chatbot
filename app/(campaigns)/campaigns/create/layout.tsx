'use client';

import { Inter } from 'next/font/google';
import { CampaignHeader } from "../../_components/campaign-header";

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export default function CampaignCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <CampaignHeader />
      <main className="w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
