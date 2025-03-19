'use client';

import { exampleSetup } from 'prosemirror-example-setup';
import { inputRules } from 'prosemirror-inputrules';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { memo, useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';

import type { Suggestion } from '@/lib/db/schema';
import {
  documentSchema,
  handleTransaction,
  headingRule,
} from '@/lib/editor/config';
import {
  buildContentFromDocument,
  buildDocumentFromContent,
  createDecorations,
} from '@/lib/editor/functions';
import {
  projectWithPositions,
  suggestionsPlugin,
  suggestionsPluginKey,
} from '@/lib/editor/suggestions';
import { useArtifact } from '@/hooks/use-artifact';
import { toast } from 'sonner';

// Add imports for visualization handling
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { document as dbDocumentSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
  const editorRef = useRef<EditorView | null>(null);
  const { artifact } = useArtifact();

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
    if (containerRef.current && !editorRef.current) {
      const state = EditorState.create({
        doc: buildDocumentFromContent(content),
        plugins: [
          ...exampleSetup({ schema: documentSchema, menuBar: false }),
          inputRules({
            rules: [
              headingRule(1),
              headingRule(2),
              headingRule(3),
              headingRule(4),
              headingRule(5),
              headingRule(6),
            ],
          }),
          suggestionsPlugin,
        ],
      });

      editorRef.current = new EditorView(containerRef.current, {
        state,
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // NOTE: we only want to run this effect once
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setProps({
        dispatchTransaction: (transaction) => {
          handleTransaction({
            transaction,
            editorRef,
            onSaveContent,
          });
        },
      });
    }
  }, [onSaveContent]);

  useEffect(() => {
    if (editorRef.current && content) {
      // Process content for visualizations
      processMarkdownVisualizations(content).then(processedContent => {
        // Check if editor is still valid
        if (!editorRef.current) return;
        
        const currentContent = buildContentFromDocument(
          editorRef.current.state.doc,
        );

        if (status === 'streaming') {
          const newDocument = buildDocumentFromContent(processedContent);

          // Guard against null ref
          if (!editorRef.current) return;
          
          const transaction = editorRef.current.state.tr.replaceWith(
            0,
            editorRef.current.state.doc.content.size,
            newDocument.content,
          );

          transaction.setMeta('no-save', true);
          editorRef.current.dispatch(transaction);
          return;
        }

        if (currentContent !== processedContent) {
          const newDocument = buildDocumentFromContent(processedContent);

          // Guard against null ref
          if (!editorRef.current) return;
          
          const transaction = editorRef.current.state.tr.replaceWith(
            0,
            editorRef.current.state.doc.content.size,
            newDocument.content,
          );

          transaction.setMeta('no-save', true);
          editorRef.current.dispatch(transaction);
        }
      });
    }
  }, [content, status]);

  useEffect(() => {
    if (editorRef.current?.state.doc && content) {
      const projectedSuggestions = projectWithPositions(
        editorRef.current.state.doc,
        suggestions,
      ).filter(
        (suggestion) => suggestion.selectionStart && suggestion.selectionEnd,
      );

      const decorations = createDecorations(
        projectedSuggestions,
        editorRef.current,
      );

      const transaction = editorRef.current.state.tr;
      transaction.setMeta(suggestionsPluginKey, { decorations });
      editorRef.current.dispatch(transaction);
    }
  }, [suggestions, content]);

  return (
    <div className="relative">
      {/* Editor content */}
      <div className="relative prose dark:prose-invert max-w-none" ref={containerRef} />
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
