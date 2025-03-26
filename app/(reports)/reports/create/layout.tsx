'use client';

import { ReportHeader } from "../../_components/report-header";
import { ReportProvider } from "../../_context/report-context";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = 'force-dynamic';

export default function ReportCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportProvider>
      <div className="min-h-screen">
        <ReportHeader />
        <main className="w-full mx-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </ReportProvider>
  );
}
