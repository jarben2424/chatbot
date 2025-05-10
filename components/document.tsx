'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { DocumentPreview } from './document-preview';
import { AlertCircle, FileText } from 'lucide-react';

// Main component for rendering document tool results
export function DocumentToolResult({ type, result, isReadonly, args }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Check for document tool errors
  useEffect(() => {
    // If result is undefined or has error property, set error state
    if (!result || result.error) {
      setIsError(true);
    }
  }, [result]);
  
  // Make sure we handle empty or missing results
  if (isError || !result) {
    return (
      <div className="p-4 rounded-lg border bg-destructive/10">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
          <h3 className="font-medium text-destructive">Document Creation Failed</h3>
        </div>
        <p className="text-sm ml-7 text-muted-foreground">
          The document could not be created due to a server configuration issue.
        </p>
      </div>
    );
  }
  
  let title;
  switch(type) {
    case 'create':
      title = 'Document Created: ';
      break;
    case 'update':
      title = 'Document Updated: ';
      break;
    default:
      title = 'Document: ';
  }
  
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-medium">{title}{result.title || 'Untitled'}</h3>
      </div>
      <div className="mt-2">
        <DocumentPreview 
          isReadonly={isReadonly} 
          result={result} 
        />
      </div>
      <div className="flex justify-end mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
    </div>
  );
}

// Re-export DocumentToolCall directly from this file
export { DocumentToolCall } from './document-tool-call';

// Export both components from the document.tsx file
export { DocumentToolResult } from './document-tool-result';

// Also create a barrel export for easier imports
export { DocumentPreview } from './document-preview';
