'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Editor } from '@/components/text-editor';
import { CodeEditor } from '@/components/code-editor';
import { SpreadsheetEditor } from '@/components/sheet-editor';
import { ImageEditor } from '@/components/image-editor';
import { ChevronLeft } from 'lucide-react';

// Document page that can be accessed directly via URL
export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the document on page load
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/document?id=${documentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setDocument(data[0]);
        } else {
          setError('Document not found');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Error loading document');
      } finally {
        setLoading(false);
      }
    };
    
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);
  
  // Handle going back to the previous page
  const handleBack = () => {
    // Check if we have a stored previous URL
    const previousUrl = sessionStorage.getItem('previousUrl');
    
    if (previousUrl) {
      // Clear the stored URL
      sessionStorage.removeItem('previousUrl');
      router.push(previousUrl);
    } else {
      // Otherwise go to the main chat page
      router.push('/');
    }
  };
  
  // Save document changes
  const handleSaveContent = async (content: string) => {
    try {
      if (!document) return;
      
      await fetch(`/api/document?id=${documentId}`, {
        method: 'POST',
        body: JSON.stringify({
          title: document.title,
          content,
          kind: document.kind,
        }),
      });
    } catch (err) {
      console.error('Error saving document:', err);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-pulse w-full max-w-4xl">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-6">{error || 'Document not found'}</p>
          <Button onClick={handleBack}>Back to Chat</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold truncate">{document.title}</h1>
      </header>
      
      {/* Document Content */}
      <main className="flex-grow p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {document.kind === 'text' && (
            <Editor
              content={document.content || ''}
              onSaveContent={handleSaveContent}
              status="idle"
              isCurrentVersion={true}
              currentVersionIndex={0}
              suggestions={[]}
            />
          )}
          
          {document.kind === 'code' && (
            <CodeEditor
              content={document.content || ''}
              onSaveContent={handleSaveContent}
              status="idle"
              isCurrentVersion={true}
              currentVersionIndex={0}
              suggestions={[]}
            />
          )}
          
          {document.kind === 'sheet' && (
            <SpreadsheetEditor
              content={document.content || ''}
              status="idle"
              isCurrentVersion={true}
              currentVersionIndex={0}
              saveContent={handleSaveContent}
            />
          )}
          
          {document.kind === 'image' && (
            <ImageEditor
              title={document.title}
              content={document.content || ''}
              isCurrentVersion={true}
              currentVersionIndex={0}
              status="idle"
              isInline={false}
            />
          )}
          
          {document.kind === 'visualization' && (
            <div className="p-4 border rounded">
              <h2 className="text-lg font-medium mb-4">Visualization</h2>
              <p>Visualization documents are best viewed from the chat interface.</p>
              <Button onClick={handleBack} className="mt-4">Back to Chat</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 