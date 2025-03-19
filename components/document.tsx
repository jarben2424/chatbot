import { memo, useEffect } from 'react';
import Link from 'next/link';

import type { ArtifactKind } from './artifact';
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon, FullscreenIcon } from './icons';
import { toast } from 'sonner';
import { useArtifact } from '@/hooks/use-artifact';

const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
) => {
  switch (type) {
    case 'create':
      return tense === 'present' ? 'Creating' : 'Created';
    case 'update':
      return tense === 'present' ? 'Updating' : 'Updated';
    case 'request-suggestions':
      return tense === 'present'
        ? 'Adding suggestions'
        : 'Added suggestions to';
    default:
      return null;
  }
};

interface DocumentToolResultProps {
  type: 'create' | 'update' | 'request-suggestions';
  result: {
    id: string;
    title?: string;
    kind?: string;
    error?: string;
  };
  isReadonly: boolean;
}

export function DocumentToolResult({
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setArtifact } = useArtifact();
  
  // Show error toast on mount if error is present
  useEffect(() => {
    if (result.error) {
      setTimeout(() => {
        toast.info(result.error);
      }, 500);
    }
  }, [result.error]);

  return (
    <div className="border rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 chat-document-card">
      <style jsx>{`
        /* Responsive styles for document cards in chat when a document is expanded */
        @media (min-width: 768px) {
          :global(.expanded-document) .chat-document-card {
            max-width: calc(100% - 2rem);
            width: 100%;
          }
        }
      `}</style>
      <div className="p-4 flex justify-between items-center gap-2 border-b dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FileIcon />
          <div className="font-medium truncate">{result.title || ''}</div>
        </div>
        <div className="flex items-center">
          <Link
            href={`/document/${result.id}`}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-md"
            onClick={(e) => {
              // Try to use the debug-artifact-opener if it exists
              // @ts-ignore
              if (window?.debugArtifactOpener?.setArtifactForId) {
                e.preventDefault();
                // @ts-ignore
                window.debugArtifactOpener.setArtifactForId(
                  result.id,
                  result.title || '',
                );
              }
            }}
          >
            <FullscreenIcon size={18} />
          </Link>
        </div>
      </div>
      <div className="p-4 flex gap-2 justify-end">
        <div className="flex flex-1 justify-start">
          {/* Empty div to maintain spacing */}
        </div>
        <Link
          href={`/document/${result.id}`}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          onClick={(e) => {
            // Try to use the debug-artifact-opener if it exists
            // @ts-ignore
            if (window?.debugArtifactOpener?.setArtifactForId) {
              e.preventDefault();
              // @ts-ignore
              window.debugArtifactOpener.setArtifactForId(result.id, result.title || '');
            }
          }}
        >
          <span className="text-sm font-medium">Open Document</span>
        </Link>
      </div>
    </div>
  );
}

interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions';
  args: { 
    title?: string; 
    id?: string;
    error?: string;
  };
  isReadonly: boolean;
}

export function DocumentToolCall({
  type,
  args,
  isReadonly,
}: DocumentToolCallProps) {
  const { setArtifact } = useArtifact();

  return (
    <div className="border rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 chat-document-card">
      <style jsx>{`
        /* Responsive styles for document cards in chat when a document is expanded */
        @media (min-width: 768px) {
          :global(.expanded-document) .chat-document-card {
            max-width: calc(100% - 2rem);
            width: 100%;
          }
        }
      `}</style>
      <div className="p-4 flex justify-between items-center gap-2 border-b dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <LoaderIcon />
          </div>
          <div className="font-medium truncate">{args.title}</div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
          {type === 'create'
            ? 'Creating document...'
            : type === 'update'
              ? 'Updating document...'
              : 'Generating suggestions...'}
        </div>
      </div>
    </div>
  );
}
