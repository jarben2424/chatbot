'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Hang
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
        <Button
          onClick={() => signIn(undefined, { callbackUrl: '/dashboard/chat' })}
        >
          Sign In (Development)
        </Button>
      </div>
    </div>
  );
}
