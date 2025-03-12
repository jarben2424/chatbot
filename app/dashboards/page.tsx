import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';

export default async function DashboardsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // Redirect to the My Dashboard page by default
  redirect('/dashboards/my');
}
