import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar className="w-64 border-r" />
      <main className="flex-1">{children}</main>
    </div>
  );
} 