import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { TransitionLayout } from '@/components/transitions/transition-layout';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  return <TransitionLayout>{children}</TransitionLayout>;
} 