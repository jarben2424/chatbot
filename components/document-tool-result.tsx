'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DocumentToolResultProps {
  result: any;
  isReadonly?: boolean;
  type?: 'create' | 'update' | 'view';
}

export function DocumentToolResult({ 
  result, 
  isReadonly = false,
  type = 'create'
}: DocumentToolResultProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // If we have a newly created document, briefly show loading state
    if (result?.id && !isReadonly && type === 'create') {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [result?.id, isReadonly, type]);
  
  if (!result) {
    return (
      <div className="p-4 rounded-lg border bg-muted/50 text-muted-foreground">
        <p className="text-sm">Document information unavailable</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-sm">Preparing document...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (result.error || !result.id) {
    return (
      <div className="p-4 rounded-lg border bg-destructive/10 text-destructive">
        <h3 className="font-medium text-sm mb-1">Document Creation Failed</h3>
        <p className="text-xs">{result.error?.message || "An error occurred creating the document."}</p>
      </div>
    );
  }
  
  const handleOpenDocument = () => {
    if (!isReadonly && result.id) {
      router.push(`/artifacts/${result.id}`);
    }
  };
  
  const title = (() => {
    switch (type) {
      case 'create': return 'Document Created';
      case 'update': return 'Document Updated';
      case 'view': return 'Document';
      default: return 'Document';
    }
  })();
  
  return (
    <div className={cn(
      "p-4 rounded-lg border bg-card transition-colors",
      !isReadonly && "hover:bg-muted/50 cursor-pointer"
    )}>
      <div 
        className="flex items-center justify-between" 
        onClick={!isReadonly ? handleOpenDocument : undefined}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-medium">{title}: {result.title || 'Untitled'}</h3>
          {result.kind && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {result.kind}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {!isReadonly && (
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/artifacts/${result.id}`}>
                Open
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{result.kind || 'document'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{result.createdAt ? new Date(result.createdAt).toLocaleString() : 'Just now'}</span>
            </div>
            
            {result.description && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Description:</p>
                <p className="text-sm">{result.description}</p>
              </div>
            )}
            
            {result.content && typeof result.content === 'string' && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <div className="max-h-24 overflow-y-auto text-xs p-2 bg-muted/50 rounded">
                  {result.content.substring(0, 200)}
                  {result.content.length > 200 && '...'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 