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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
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
        // Use the correct API path
        const response = await fetch('/api/visualizations');
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

  // Function to handle sharing
  const handleShare = async (method: 'email' | 'link' | 'pdf') => {
    try {
      let message = '';
      
      switch (method) {
        case 'email':
          // Implement email sharing functionality here
          message = 'Share via email link copied to clipboard!';
          await navigator.clipboard.writeText(`${window.location.origin}/shared-report/${artifact.documentId}`);
          break;
        case 'link':
          // Generate and copy shareable link
          await navigator.clipboard.writeText(`${window.location.origin}/shared-report/${artifact.documentId}`);
          message = 'Shareable link copied to clipboard!';
          break;
        case 'pdf':
          // Implement PDF export functionality
          message = 'Report prepared for PDF export!';
          
          // Create a temporary link to download the report as PDF
          const reportContent = containerRef.current?.innerHTML || '';
          
          // Create a temporary container with proper styling
          const printContainer = document.createElement('div');
          printContainer.className = 'document-preview report-for-pdf';
          printContainer.innerHTML = reportContent;
          
          // Add the container to the document temporarily
          document.body.appendChild(printContainer);
          
          // Apply print-specific styles
          const printStyle = document.createElement('style');
          printStyle.innerHTML = `
            @media print {
              body * {
                visibility: hidden;
              }
              .report-for-pdf, .report-for-pdf * {
                visibility: visible;
              }
              .report-for-pdf {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 2rem;
                font-size: 12pt;
              }
              .report-for-pdf h1 {
                font-size: 18pt;
              }
              .report-for-pdf h2 {
                font-size: 16pt;
              }
              .report-for-pdf h3 {
                font-size: 14pt;
              }
              .report-for-pdf .report-visualization {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          `;
          document.head.appendChild(printStyle);
          
          // Trigger the print dialog
          setTimeout(() => {
            window.print();
            
            // Clean up
            setTimeout(() => {
              document.body.removeChild(printContainer);
              document.head.removeChild(printStyle);
            }, 1000);
          }, 500);
          
          break;
      }
      
      toast.success(message);
      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error('Failed to share report. Please try again.');
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

  // When dialog opens, fetch visualizations
  useEffect(() => {
    if (isDialogOpen) {
      fetchVisualizations();
    }
  }, [isDialogOpen]);

  return (
    <div className="relative">
      {/* Editor content */}
      <div className="relative prose dark:prose-invert max-w-none" ref={containerRef} />
      
      {/* Add a sharing and actions menu at the bottom right */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-2 z-10 tool-action-buttons">
        <style jsx>{`
          /* Adjust action buttons when document is expanded */
          :global(.expanded-document) .tool-action-buttons {
            right: calc(60% + 1.5rem);
            bottom: 6rem;
          }
          
          @media (max-width: 768px) {
            :global(.expanded-document) .tool-action-buttons {
              right: 1.5rem;
              bottom: 6rem;
            }
          }
        `}</style>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="rounded-full shadow-md">
              <LineChartIcon size={18} />
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
        
        <Button size="icon" variant="secondary" className="rounded-full shadow-md">
          <ImageIcon size={18} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="default" className="rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleShare('email')}>
              Share via Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('link')}>
              Copy Shareable Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('pdf')}>
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
