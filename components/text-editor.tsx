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
import { Button } from '@/components/ui/button';
import { ImageIcon, LineChartIcon } from '@/components/icons';
import { useArtifact } from '@/hooks/use-artifact';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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

// Interface for visualization data
interface VisualizationData {
  id: string;
  title: string;
  image: string; // Base64 or URL
  createdAt: string;
}

function PureEditor({
  content,
  onSaveContent,
  suggestions,
  status,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const [visualizations, setVisualizations] = useState<VisualizationData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { artifact } = useArtifact();

  // Function to fetch available visualizations
  const fetchVisualizations = async () => {
    try {
      // First try to use any visualization in the current artifact
      let visualizationList: VisualizationData[] = [];
      
      if (artifact?.kind === 'visualization' && artifact.documentId) {
        // Create a visualization object from the current artifact
        const chartElement = document.querySelector('.chart-container');
        
        try {
          // Try to capture the chart as an image if it exists
          if (chartElement) {
            const imageData = await htmlToImage.toPng(chartElement as HTMLElement, {
              quality: 0.95,
              backgroundColor: 'white'
            });
            
            visualizationList.push({
              id: artifact.documentId,
              title: artifact.title || 'Visualization',
              image: imageData,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('Error capturing chart:', err);
        }
      }
      
      // Then fetch visualizations from the API
      try {
        const response = await fetch('/api/document/visualizations');
        if (response.ok) {
          const data = await response.json();
          
          // Add any visualizations from the API that aren't already in the list
          data.forEach((viz: any) => {
            if (!visualizationList.some(v => v.id === viz.id)) {
              visualizationList.push({
                id: viz.id,
                title: viz.title,
                image: viz.preview || '/placeholder-chart.png',
                createdAt: viz.createdAt
              });
            }
          });
        }
      } catch (apiError) {
        console.error('Error fetching visualizations from API:', apiError);
      }
      
      // If no visualizations were found, add a fallback
      if (visualizationList.length === 0) {
        visualizationList.push({
          id: 'fallback',
          title: 'Sample Visualization',
          image: '/placeholder-chart.png',
          createdAt: new Date().toISOString()
        });
      }
      
      setVisualizations(visualizationList);
    } catch (error) {
      console.error('Error in fetchVisualizations:', error);
      
      // Provide a fallback visualization
      setVisualizations([{
        id: 'fallback',
        title: 'Sample Visualization',
        image: '/placeholder-chart.png',
        createdAt: new Date().toISOString()
      }]);
    }
  };

  // Function to insert a visualization into the editor
  const insertVisualization = (visualization: VisualizationData) => {
    if (editorRef.current) {
      const { state } = editorRef.current;
      
      // Create an image node with the visualization data
      const imageNode = documentSchema.nodes.image.create({
        src: visualization.image,
        alt: visualization.title,
        title: visualization.title,
        chartId: visualization.id
      });
      
      // Insert the image at the cursor position
      const transaction = state.tr.replaceSelectionWith(imageNode);
      editorRef.current.dispatch(transaction);
      
      setIsDialogOpen(false);
      toast.success('Visualization inserted into document');
    }
  };

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
      
      // Create a database connection
      try {
        const db = drizzle(neon(process.env.DATABASE_URL!), { schema: { document: dbDocumentSchema } });
        
        // Build a map of visualization IDs to their image data
        const vizMap = new Map();
        
        for (const vizId of vizIds) {
          // Skip IDs that don't look like UUIDs
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vizId)) {
            console.warn(`Skipping invalid visualization ID: ${vizId}`);
            continue;
          }
          
          // Fetch the visualization from the database
          try {
            const visualizations = await db
              .select({
                id: dbDocumentSchema.id,
                title: dbDocumentSchema.title,
                content: dbDocumentSchema.content
              })
              .from(dbDocumentSchema)
              .where(eq(dbDocumentSchema.id, vizId))
              .limit(1);
            
            if (visualizations.length > 0 && visualizations[0].content) {
              console.log(`Found visualization data for ${vizId}`);
              vizMap.set(vizId, {
                id: visualizations[0].id,
                title: visualizations[0].title,
                content: visualizations[0].content
              });
            } else {
              console.warn(`No visualization found for ID: ${vizId}`);
            }
          } catch (error) {
            console.error(`Error fetching visualization ${vizId}:`, error);
          }
        }
        
        // Replace viz: URLs with placeholders or images
        let processedContent = content;
        
        // Process each found visualization
        for (const [vizId, vizData] of vizMap.entries()) {
          const vizRegex = new RegExp(`!\\[.*?\\]\\(viz:${vizId}\\)`, 'g');
          processedContent = processedContent.replace(
            vizRegex, 
            `![Visualization: ${vizData.title || 'Chart'}](https://via.placeholder.com/640x480?text=Visualization+${encodeURIComponent(vizData.title || 'Chart')})`
          );
        }
        
        // Handle any remaining viz: URLs
        const remainingVizRegex = /!\[.*?\]\(viz:[a-zA-Z0-9-]+\)/g;
        processedContent = processedContent.replace(
          remainingVizRegex,
          '![Visualization not found](https://via.placeholder.com/640x480?text=Visualization+Not+Found)'
        );
        
        return processedContent;
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        
        // Fallback - replace all viz URLs with placeholders
        const fallbackContent = content.replace(
          vizUrlRegex,
          '![Visualization placeholder](https://via.placeholder.com/640x480?text=Visualization)'
        );
        
        return fallbackContent;
      }
    } catch (error) {
      console.error('Error in processMarkdownVisualizations:', error);
      return content; // Return original content in case of errors
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
        const currentContent = buildContentFromDocument(
          editorRef.current.state.doc,
        );

        if (status === 'streaming') {
          const newDocument = buildDocumentFromContent(processedContent);

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

  // When dialog opens, fetch visualizations
  useEffect(() => {
    if (isDialogOpen) {
      fetchVisualizations();
    }
  }, [isDialogOpen]);

  return (
    <div className="relative">
      {/* Editor Toolbar */}
      <div className="flex gap-2 mb-2 border-b pb-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-2">
              <LineChartIcon size={16} />
              <span>Insert Visualization</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Visualization</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {visualizations.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  No visualizations available. Create visualizations first using the data visualization tool.
                </div>
              ) : (
                <div className="grid gap-2">
                  {visualizations.map((viz) => (
                    <div 
                      key={viz.id} 
                      className="p-2 border rounded flex items-center gap-2 cursor-pointer hover:bg-muted"
                      onClick={() => insertVisualization(viz)}
                    >
                      <div className="h-12 w-12 bg-muted flex items-center justify-center">
                        <LineChartIcon size={20} />
                      </div>
                      <div>
                        <div className="font-medium">{viz.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(viz.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        <Button size="sm" variant="ghost" className="gap-2">
          <ImageIcon size={16} />
          <span>Insert Image</span>
        </Button>
      </div>
      
      <div className="relative prose dark:prose-invert" ref={containerRef} />
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
