'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';

import type { Suggestion } from '@/lib/db/schema';
import { useArtifact } from '@/hooks/use-artifact';
import { Markdown } from './markdown';

// Add imports for visualization handling
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { document as dbDocumentSchema } from '@/lib/db/schema';

type EditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  suggestions: Array<Suggestion>;
};

function PureEditor({
  content,
  onSaveContent,
  suggestions,
  status,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { artifact } = useArtifact();
  const [processedContent, setProcessedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableContent, setEditableContent] = useState<string>('');

  // Function to process markdown content and replace viz: URLs with visualization image data
  const processMarkdownVisualizations = async (content: string) => {
    // Early return if no content
    if (!content) return content;
    
    try {
      // Look for viz: URLs in the markdown
      const vizUrlRegex = /!\[.*?\]\(viz:([a-zA-Z0-9-]+)\)/g;
      const vizIds = [];
      let match;
      
      // Extract all visualization IDs
      while ((match = vizUrlRegex.exec(content)) !== null) {
        // Validate the ID is a proper UUID format
        const id = match[1];
        
        // Add the ID regardless of format for now - we'll validate at fetch time
        // This helps handle test IDs and fallbacks
        vizIds.push(id);
        console.log(`Found visualization reference: ${id}`);
      }
      
      if (vizIds.length === 0) {
        return content;
      }
      
      // If we have viz IDs, try to fetch them or use placeholders
      let processedContent = content;
      
      for (const vizId of vizIds) {
        // Skip IDs that don't look like UUIDs
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vizId)) {
          console.warn(`Skipping invalid visualization ID: ${vizId}`);
          continue;
        }
        
        const vizRegex = new RegExp(`!\\[.*?\\]\\(viz:${vizId}\\)`, 'g');
        
        // Create a nicely formatted visualization container
        const vizHtml = `
<div class="report-visualization">
  <div class="visualization-container">
    <img src="/api/visualization-image?id=${vizId}" alt="Visualization" title="Data Visualization" class="viz-image" />
  </div>
  <div class="viz-caption">Data Visualization</div>
</div>
`;

        // Replace the viz: URL with the HTML
        processedContent = processedContent.replace(vizRegex, vizHtml);
      }
      
      return processedContent;
    } catch (error) {
      console.error('Error processing visualization references:', error);
      return content;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Process any visualization references in the content
    const processContent = async () => {
      if (!content) return;
      
      try {
        // Process visualizations if any exist in the content
        const processed = await processMarkdownVisualizations(content);
        
        if (!mounted) return;
        
        setProcessedContent(processed);
        setEditableContent(processed);
      } catch (error) {
        console.error('Error processing content:', error);
        if (mounted) {
          setProcessedContent(content);
          setEditableContent(content);
        }
      }
    };

    processContent();

    return () => {
      mounted = false;
    };
  }, [content]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onSaveContent(editableContent, false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };

  // For streaming content or non-editable content, just display with Markdown
  if (status === 'streaming' || artifact?.status === 'streaming' || !isEditing) {
    return (
      <div className="relative">
        <div 
          className="relative prose dark:prose-invert max-w-none cursor-text" 
          ref={containerRef}
          onClick={handleEdit}
        >
          <Markdown>{processedContent || content}</Markdown>
        </div>
      </div>
    );
  }

  // For editable mode, show a textarea
  return (
    <div className="relative">
      <div className="relative prose dark:prose-invert max-w-none">
        <textarea
          className="w-full h-auto min-h-[300px] p-4 border rounded-md dark:bg-zinc-900 dark:text-white"
          value={editableContent}
          onChange={handleChange}
          autoFocus
        />
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  return (
    prevProps.suggestions === nextProps.suggestions &&
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.onSaveContent === nextProps.onSaveContent
  );
}

export const Editor = memo(PureEditor, areEqual);
