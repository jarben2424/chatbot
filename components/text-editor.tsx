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
      // In a real implementation, fetch from an API endpoint
      // For now, we'll create a visualization object from the current artifact if one exists
      const visualizationList: VisualizationData[] = [];

      if (artifact?.kind === 'visualization' && artifact.documentId) {
        // Create a visualization object from the current artifact
        const chartElement = document.querySelector('.chart-container');
        
        if (chartElement) {
          try {
            // Capture the chart as an image
            const imageData = await htmlToImage.toPng(chartElement as HTMLElement, {
              quality: 0.95,
              backgroundColor: 'white'
            });

            const newVisualization = {
              id: artifact.documentId,
              title: artifact.title || 'Visualization',
              image: imageData, // Use the actual captured image
              createdAt: new Date().toISOString()
            };
            
            visualizationList.push(newVisualization);
          } catch (err) {
            console.error('Error capturing chart:', err);
            
            // Fallback to placeholder if capture fails
            const newVisualization = {
              id: artifact.documentId,
              title: artifact.title || 'Visualization',
              image: '/placeholder-chart.png', // Placeholder
              createdAt: new Date().toISOString()
            };
            
            visualizationList.push(newVisualization);
          }
        } else {
          // No chart element found, use placeholder
          const newVisualization = {
            id: artifact.documentId,
            title: artifact.title || 'Visualization',
            image: '/placeholder-chart.png', // Placeholder
            createdAt: new Date().toISOString()
          };
          
          visualizationList.push(newVisualization);
        }
      }
        
      setVisualizations(visualizationList);
    } catch (error) {
      console.error('Error fetching visualizations:', error);
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
      const currentContent = buildContentFromDocument(
        editorRef.current.state.doc,
      );

      if (status === 'streaming') {
        const newDocument = buildDocumentFromContent(content);

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content,
        );

        transaction.setMeta('no-save', true);
        editorRef.current.dispatch(transaction);
        return;
      }

      if (currentContent !== content) {
        const newDocument = buildDocumentFromContent(content);

        const transaction = editorRef.current.state.tr.replaceWith(
          0,
          editorRef.current.state.doc.content.size,
          newDocument.content,
        );

        transaction.setMeta('no-save', true);
        editorRef.current.dispatch(transaction);
      }
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
