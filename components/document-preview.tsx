'use client';

import {
  memo,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { ArtifactKind, UIArtifact } from './artifact';
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from './icons';
import { cn, fetcher } from '@/lib/utils';
import { Document } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import useSWR from 'swr';
import { Editor } from './text-editor';
import { DocumentToolCall, DocumentToolResult } from './document';
import { CodeEditor } from './code-editor';
import { useArtifact } from '@/hooks/use-artifact';
import equal from 'fast-deep-equal';
import { SpreadsheetEditor } from './sheet-editor';
import { ImageEditor } from './image-editor';
import { Markdown } from './markdown';

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: any;
  args?: any;
}

export function DocumentPreview({
  isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  const { artifact, setArtifact } = useArtifact();

  // Add global styles for report visualizations
  useEffect(() => {
    // Add a style tag to force apply visualization styles
    const styleTag = globalThis.document.createElement('style');
    styleTag.id = 'report-visualization-styles';
    styleTag.innerHTML = `
      .report-visualization {
        margin: 2.5rem 0;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
      }
      
      .visualization-container {
        background-color: #f8fafc;
        padding: 1.5rem;
        display: flex;
        justify-content: center;
      }
      
      .viz-image {
        max-width: 100%;
        height: auto;
      }
      
      .viz-caption {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: #4b5563;
        border-top: 1px solid #e2e8f0;
        background-color: #f8fafc;
      }
      
      .dark .report-visualization {
        border-color: #2d2d2d;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      }
      
      .dark .visualization-container,
      .dark .viz-caption {
        background-color: #2d2d2d;
        border-color: #3d3d3d;
        color: #d1d1d1;
      }
    `;
    
    // Only add if it doesn't exist
    if (!globalThis.document.getElementById('report-visualization-styles')) {
      globalThis.document.head.appendChild(styleTag);
    }
    
    return () => {
      // Clean up on unmount
      const existingStyle = globalThis.document.getElementById('report-visualization-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Add a class to the body when document is expanded to help with responsive layouts
  useEffect(() => {
    if (artifact.isVisible) {
      // Add class to body
      globalThis.document.body.classList.add('expanded-document');
    } else {
      // Remove class from body
      globalThis.document.body.classList.remove('expanded-document');
    }
    
    return () => {
      // Clean up
      globalThis.document.body.classList.remove('expanded-document');
    };
  }, [artifact.isVisible]);

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Array<Document>
  >(result ? `/api/document?id=${result.id}` : null, fetcher);

  const previewDocument = useMemo(() => documents?.[0], [documents]);
  const hitboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();

    if (artifact.documentId && boundingBox) {
      setArtifact((artifact) => ({
        ...artifact,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }
  }, [artifact.documentId, setArtifact]);

  if (artifact.isVisible) {
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ id: result.id, title: result.title, kind: result.kind }}
          isReadonly={isReadonly}
        />
      );
    }

    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title }}
          isReadonly={isReadonly}
        />
      );
    }
  }

  if (isDocumentsFetching) {
    return <LoadingSkeleton artifactKind={result.kind ?? args.kind} />;
  }

  const document: Document | null = previewDocument
    ? previewDocument
    : artifact.status === 'streaming'
      ? {
          title: artifact.title,
          kind: artifact.kind,
          content: artifact.content,
          id: artifact.documentId,
          createdAt: new Date(),
          userId: 'noop',
          chatId: null,
          previousVersion: null,
        }
      : null;

  if (!document) return <LoadingSkeleton artifactKind={artifact.kind} />;

  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer
        hitboxRef={hitboxRef}
        result={result}
        setArtifact={setArtifact}
      />
      <DocumentHeader
        title={document.title}
        kind={document.kind}
        isStreaming={artifact.status === 'streaming'}
      />
      <DocumentContent document={document} />
    </div>
  );
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full">
    <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700 border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>
    {artifactKind === 'image' ? (
      <div className="overflow-y-scroll border rounded-b-2xl bg-muted border-t-0 dark:border-zinc-700">
        <div className="animate-pulse h-[257px] bg-muted-foreground/20 w-full" />
      </div>
    ) : (
      <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

const PureHitboxLayer = ({
  hitboxRef,
  result,
  setArtifact,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  result: any;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();

      setArtifact((artifact) =>
        artifact.status === 'streaming'
          ? { ...artifact, isVisible: true }
          : {
              ...artifact,
              title: result.title,
              documentId: result.id,
              kind: result.kind,
              isVisible: true,
              boundingBox: {
                left: boundingBox.x,
                top: boundingBox.y,
                width: boundingBox.width,
                height: boundingBox.height,
              },
            },
      );
    },
    [setArtifact, result],
  );

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl z-10"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (!equal(prevProps.result, nextProps.result)) return false;
  return true;
});

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
}) => (
  <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
    <div className="flex flex-row items-start sm:items-center gap-3">
      <div className="text-muted-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : kind === 'image' ? (
          <ImageIcon />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;

  return true;
});

const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact } = useArtifact();

  // Check if this is a report document by looking for report markers in the content
  const isReport = document.content?.includes('## Executive Summary') || 
                  document.content?.includes('class="report-visualization"') ||
                  document.content?.includes('report-content');

  // Create appropriate props based on document type
  const baseProps = {
    content: document.content ?? '',
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: artifact.status,
    suggestions: [],
  };

  // Props for different editor types
  const editorProps = {
    ...baseProps,
    onSaveContent: () => {},
  };

  const codeEditorProps = {
    ...baseProps,
    onSaveContent: () => {},
  };

  const sheetEditorProps = {
    ...baseProps,
    saveContent: () => {},
  };

  const imageEditorProps = {
    ...baseProps,
    title: document.title,
    isInline: true,
  };

  // Check if content contains markdown formatting
  const hasMarkdownFormatting = document.content?.includes('#') || 
                               document.content?.includes('**') || 
                               document.content?.includes('*') || 
                               document.content?.includes('- ') ||
                               document.content?.includes('1. ');

  // Add enhanced styling for reports or markdown content
  if ((isReport || hasMarkdownFormatting) && document.kind === 'text') {
    // Extract inner content from report-content div if it exists
    let contentToRender = document.content ?? '';
    
    // Check if content is wrapped in report-content div
    const reportContentMatch = contentToRender.match(/<div class="report-content">([\s\S]*?)<\/div>/i);
    if (reportContentMatch && reportContentMatch[1]) {
      contentToRender = reportContentMatch[1].trim();
    }
    
    return (
      <div className="report-container h-[257px] overflow-y-auto border rounded-b-2xl border-t-0 p-6 dark:border-zinc-700">
        <style jsx global>{`
          .report-container {
            background-color: white;
            color: #1e293b;
          }
          
          .document-preview {
            padding: 1.5rem 2rem;
            max-width: 100%;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          
          .document-preview h1 {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.75rem;
          }
          
          .document-preview h2 {
            font-size: 1.4rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #334155;
          }
          
          .document-preview h3 {
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: #475569;
          }
          
          .document-preview p {
            margin-bottom: 1rem;
            line-height: 1.6;
            color: #334155;
            font-size: 1rem;
          }
          
          .document-preview ul, .document-preview ol {
            margin-left: 1.75rem;
            margin-bottom: 1rem;
            color: #334155;
          }
          
          .document-preview li {
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
          
          .document-preview blockquote {
            border-left: 4px solid #94a3b8;
            padding: 1rem 1rem 1rem 1.5rem;
            margin: 1.5rem 0;
            background-color: #f8fafc;
            color: #475569;
            font-style: italic;
            border-radius: 0.375rem;
          }
          
          .document-preview .report-visualization {
            margin: 2.5rem 0;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
          }
          
          .document-preview .visualization-container {
            background-color: #f8fafc;
            padding: 1.5rem;
            display: flex;
            justify-content: center;
          }
          
          .document-preview .viz-image {
            max-width: 100%;
            height: auto;
          }
          
          .document-preview .viz-caption {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: #4b5563;
            border-top: 1px solid #e2e8f0;
            background-color: #f8fafc;
          }
          
          /* Executive summary special styling */
          .document-preview h2:first-of-type {
            margin-top: 1.5rem;
            color: #1e40af;
            font-size: 1.5rem;
            font-weight: 700;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.5rem;
          }
          
          .document-preview h2:first-of-type + p {
            font-size: 1.1rem;
            line-height: 1.7;
            margin-top: 1rem;
            color: #1f2937;
          }
          
          /* Key Findings section styling */
          .document-preview h2:nth-of-type(2) {
            color: #1e40af;
          }
          
          /* Conclusion special styling */
          .document-preview h2:nth-last-of-type(2) {
            color: #1e40af;
            border-top: 1px solid #e2e8f0;
            padding-top: 1.5rem;
            margin-top: 3rem;
          }
          
          /* Data Visualization section */
          .document-preview h2:last-of-type {
            margin-top: 2.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e2e8f0;
            color: #1e40af;
          }
          
          /* Table styling */
          .document-preview table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
          }
          
          .document-preview th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            text-align: left;
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
          }
          
          .document-preview td {
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            color: #334155;
          }
          
          .document-preview tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .dark .report-container {
            background-color: #1e1e1e;
            color: #e4e4e4;
          }
          
          .dark .document-preview h1,
          .dark .document-preview h2,
          .dark .document-preview h3 {
            color: #e4e4e4;
            border-color: #2d2d2d;
          }
          
          .dark .document-preview p,
          .dark .document-preview li,
          .dark .document-preview td {
            color: #d1d1d1;
          }
          
          .dark .document-preview blockquote {
            background-color: #2d2d2d;
            color: #a1a1a1;
            border-color: #4b4b4b;
          }
          
          .dark .document-preview .report-visualization {
            border-color: #2d2d2d;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          }
          
          .dark .document-preview .visualization-container,
          .dark .document-preview .viz-caption {
            background-color: #2d2d2d;
            border-color: #3d3d3d;
          }
          
          .dark .document-preview th {
            background-color: #2d2d2d;
            color: #e4e4e4;
            border-color: #3d3d3d;
          }
          
          .dark .document-preview td {
            border-color: #3d3d3d;
          }
          
          .dark .document-preview tr:nth-child(even) {
            background-color: #2a2a2a;
          }
          
          /* For print styling */
          @media print {
            .document-preview {
              font-size: 12pt;
            }
            
            .document-preview h1 {
              font-size: 18pt;
            }
            
            .document-preview h2 {
              font-size: 16pt;
            }
            
            .document-preview h3 {
              font-size: 14pt;
            }
            
            .document-preview .report-visualization {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}</style>
        <div className="document-preview">
          {/* Use direct Markdown rendering for reports instead of the Editor */}
          <Markdown>{contentToRender}</Markdown>
        </div>
      </div>
    );
  }

  // For non-report documents
  const containerClassName = cn(
    'h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700',
    {
      'p-4 sm:px-14 sm:py-16': document.kind === 'text',
      'p-0': document.kind === 'code',
    },
  );

  return (
    <div className={containerClassName}>
      {document.kind === 'text' ? (
        <Editor {...editorProps} />
      ) : document.kind === 'code' ? (
        <CodeEditor {...codeEditorProps} />
      ) : document.kind === 'sheet' ? (
        <SpreadsheetEditor {...sheetEditorProps} />
      ) : document.kind === 'image' ? (
        <ImageEditor {...imageEditorProps} />
      ) : null}
    </div>
  );
};
