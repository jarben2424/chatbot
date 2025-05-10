'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions';
  args: any;
  isReadonly?: boolean;
}

export function DocumentToolCall({ type, args, isReadonly = false }: DocumentToolCallProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Simulate loading state
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm">
          {type === 'create' ? 'Creating document...' : 
           type === 'update' ? 'Updating document...' : 
           'Processing document...'}
        </span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-4 rounded-lg border bg-destructive/10">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="font-medium text-sm text-destructive">
            {type === 'create' ? 'Failed to create document' :
             type === 'update' ? 'Failed to update document' :
             'Document operation failed'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          There was an error processing your document. Please try again.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">
          {type === 'create' ? 'Creating document' :
           type === 'update' ? 'Updating document' :
           'Processing document'}
        </span>
      </div>
      
      <div className="bg-muted/30 p-3 rounded text-xs">
        {args.title && <p className="mb-1"><span className="text-muted-foreground">Title:</span> {args.title}</p>}
        {args.kind && <p><span className="text-muted-foreground">Type:</span> {args.kind}</p>}
        {args.id && <p><span className="text-muted-foreground">ID:</span> {args.id}</p>}
      </div>
    </div>
  );
} 