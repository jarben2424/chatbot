'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'plaintext', className }: CodeBlockProps) {
  return (
    <div className={cn('rounded-md bg-muted overflow-x-auto', className)}>
      <pre className="p-4 text-sm">
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
