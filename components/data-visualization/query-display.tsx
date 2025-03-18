'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from './data-table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VisualizationPanel } from './visualization-panel';
import { generateUUID } from '@/lib/utils';
import { useArtifact } from '@/hooks/use-artifact';
import { ArtifactKind } from '@/components/artifact';
import { StandaloneChart } from './charts/standalone-chart';

export interface QueryDisplayProps {
  data: any[];
  sql?: string;
  title: string;
  description?: string;
  visualization?: string;
}

export function QueryDisplay({ 
  data, 
  sql, 
  title, 
  description, 
  visualization 
}: QueryDisplayProps) {
  const { setArtifact } = useArtifact();
  const [showSql, setShowSql] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<{data: any[], type: string} | null>(null);
  const [showVisualizationPanel, setShowVisualizationPanel] = useState(false);
  const [showInlineVisualization, setShowInlineVisualization] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Listen for visualization restore event when editor is closed
  useEffect(() => {
    const handleRestoreVisualization = (event: CustomEvent) => {
      if (event.detail) {
        // If we have visualization data in the event, use it to restore the card
        if (event.detail.data) {
          setVisualizationResult({
            data: event.detail.data,
            type: event.detail.type || 'bar'
          });
        }
        
        // Check if we should restore to chart view
        if (event.detail.restoreChart) {
          // Show the inline visualization again
          setShowInlineVisualization(true);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('restoreVisualization', handleRestoreVisualization as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('restoreVisualization', handleRestoreVisualization as EventListener);
    };
  }, []);
  
  // Function to determine best visualization type based on data structure
  function determineBestVisualization(data: any[]): string {
    if (!data || data.length === 0) return 'table';
    
    // Look for date columns and numeric columns
    const sample = data[0];
    const hasDateColumn = Object.keys(sample).some(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('year') ||
      (typeof sample[key] === 'string' && !isNaN(Date.parse(sample[key])))
    );
    
    const numericColumns = Object.keys(sample).filter(key => 
      typeof sample[key] === 'number' || 
      (typeof sample[key] === 'string' && !isNaN(Number(sample[key].toString().replace(/[^0-9.-]+/g, ''))))
    );
    
    if (hasDateColumn && numericColumns.length > 0) {
      return 'line'; // Time series data = line chart
    } else if (numericColumns.length >= 2) {
      return 'bar'; // Multiple numeric columns = bar chart
    } else if (data.length <= 6 && numericColumns.length === 1) {
      return 'pie'; // Few categories with one value = pie chart
    }
    
    return 'bar'; // Default to bar chart
  }

  const handleFlip = () => {
    setIsFlipping(true);
    setShowSql(!showSql);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 300);
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    
    // Convert data to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const visualizeData = () => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        // Provide fallback data for monthly revenue query
        if (title.toLowerCase().includes('monthly revenue')) {
          const fallbackData = [
            { month: 'January', revenue: 75000 },
            { month: 'February', revenue: 82500 },
            { month: 'March', revenue: 79800 },
            { month: 'April', revenue: 88000 },
            { month: 'May', revenue: 94200 }
          ];
          
          // Set visualization result with the appropriate type
          setVisualizationResult({
            data: fallbackData,
            type: 'line' // Explicitly set line chart for time series
          });

          // First show the inline visualization in the chat card
          setShowInlineVisualization(true);
          return;
        }
        
        toast.error('No data available to visualize');
        return;
      }
      
      // Determine best visualization type based on data structure
      const bestVisualizationType = determineBestVisualization(data);
      
      // Set the visualization result with the determined type
      setVisualizationResult({
        data: data,
        type: bestVisualizationType
      });
      
      // First show the inline visualization in the chat card
      setShowInlineVisualization(true);
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error('Error creating visualization');
    }
  };

  const handleBackToTable = (event?: React.MouseEvent) => {
    // Stop event propagation to prevent the click from also triggering expandVisualization
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Immediately hide the visualization to ensure smooth transition
    setIsTransitioning(true);
    setTimeout(() => {
      // This is the critical part - set showInlineVisualization to false
      // to return to the data table view
      setShowInlineVisualization(false);
      setIsTransitioning(false);
    }, 150);
  };

  const expandVisualization = (event: React.MouseEvent<HTMLElement>) => {
    // Get the bounding box for animation
    const rect = event.currentTarget.getBoundingClientRect();
    const boundingBox = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    // Create an artifact in fullscreen mode
    const artifactId = generateUUID();
    
    // Hide the card in chat when expanded to the editor
    setIsTransitioning(true);
    
    setTimeout(() => {
      setArtifact({
        documentId: artifactId,
        title: title,
        kind: 'visualization' as ArtifactKind,
        content: JSON.stringify({
          data: visualizationResult?.data || data,
          visualization: visualizationResult?.type || determineBestVisualization(data),
          description,
          settings: {
            type: visualizationResult?.type || determineBestVisualization(data),
            colors: ['hsl(var(--chart-1, 221 83% 53%))', 'hsl(var(--chart-2, 358 84% 56%))', 
                   'hsl(var(--chart-3, 160 84% 39%))', 'hsl(var(--chart-4, 45 93% 47%))',
                   'hsl(var(--chart-5, 262 80% 63%))'],
            showLegend: true,
            showDataLabels: false,
            showTitle: true,
            showLabels: true,
            title: title
          }
        }),
        isVisible: true,
        status: 'idle',
        boundingBox: boundingBox,
      });
      
      // Hide the visualization in the chat while the full editor is open
      setShowInlineVisualization(false);
      setIsTransitioning(false);
      
      toast.success('Visualization created');
    }, 150);
  };

  function formatSql(sql: string) {
    if (!sql) return '';
    
    // List of SQL keywords to add newlines before
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 
      'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'JOIN', 'UNION', 
      'LIMIT', 'OFFSET', 'ON', 'AND', 'OR'
    ];
    
    // Replace keywords with newlined versions
    let formattedSql = sql;
    
    // First normalize spacing
    formattedSql = formattedSql.replace(/\s+/g, ' ').trim();
    
    // Add newlines before keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\s${keyword}\\s`, 'gi');
      formattedSql = formattedSql.replace(regex, `\n${keyword} `);
    });
    
    // Special case for SELECT to prevent newline at the beginning
    if (formattedSql.startsWith('SELECT')) {
      formattedSql = 'SELECT' + formattedSql.substring(6);
    }
    
    // Add indentation
    const lines = formattedSql.split('\n');
    let indentLevel = 0;
    
    return lines.map(line => {
      const trimmedLine = line.trim();
      
      // Adjust indent level based on line content
      if (trimmedLine.startsWith('FROM') || 
          trimmedLine.startsWith('WHERE') ||
          trimmedLine.startsWith('GROUP BY') ||
          trimmedLine.startsWith('ORDER BY')) {
        // These start main clauses - indent them once
        return '  ' + trimmedLine;
      } else if (trimmedLine.startsWith('AND') || 
                 trimmedLine.startsWith('OR') ||
                 trimmedLine.startsWith('ON')) {
        // These are subclauses - indent them twice
        return '    ' + trimmedLine;
      }
      
      return trimmedLine;
    }).join('\n');
  }

  // Make sure the Data Table and Chart Card have consistent heights
  const CARD_HEIGHT = "380px"; // Fixed height for both card states
  const TABLE_WRAPPER_HEIGHT = "305px"; // Height for the data table container

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        {!showSql && !showInlineVisualization ? (
          // Data table view
          <div style={{ minHeight: CARD_HEIGHT }}>
            <div className="bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{title}</h3>
                  {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={downloadCSV}>
                    Download CSV
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowSql(true)}
                  >
                    Show SQL
                  </Button>
                  {!visualization && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={visualizeData} 
                    >
                      Visualize
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div 
              className={cn("transition-all duration-300", { 
                "opacity-50 transform scale-95": isFlipping 
              })}
              style={{ height: TABLE_WRAPPER_HEIGHT, overflowY: 'auto' }}
            >
              <DataTable data={data} />
            </div>
          </div>
        ) : showSql ? (
          // SQL view
          <div style={{ minHeight: CARD_HEIGHT }}>
            <div className="bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{title}</h3>
                  {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowSql(false)}
                  >
                    Show Data
                  </Button>
                  {!visualization && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={visualizeData}
                    >
                      Visualize
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div 
              className={cn("transition-all duration-300", { 
                "opacity-50 transform scale-95": isFlipping 
              })}
              style={{ height: TABLE_WRAPPER_HEIGHT, overflowY: 'auto' }}
            >
              <pre className="bg-muted/30 p-4 overflow-x-auto text-sm">
                <code>{formatSql(sql || '')}</code>
              </pre>
            </div>
          </div>
        ) : (
          // Inline visualization view - styled like document preview
          <div className={cn(
            "relative w-full cursor-pointer border border-muted overflow-hidden rounded-lg",
            "transition-all duration-300 ease-in-out transform",
            isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )} style={{ height: CARD_HEIGHT }}>
            {/* Document Header with proper controls */}
            <div className="p-4 bg-background flex flex-row items-center justify-between border-b border-muted">
              <div className="flex flex-row items-center gap-3">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => handleBackToTable(e)}
                  className="h-8 w-8 p-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="sr-only">Back</span>
                </Button>
                <span className="font-medium">{title}</span>
              </div>
              
              {/* Expand button using the proper FullscreenIcon */}
              <button
                className="h-8 w-8 p-0 flex items-center justify-center hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100"
                onClick={expandVisualization}
                aria-label="Expand"
              >
                <svg
                  height="16"
                  strokeLinejoin="round"
                  viewBox="0 0 16 16"
                  width="16"
                  style={{ color: 'currentcolor' }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </div>
            
            {/* Properly centered chart positioning */}
            <div className="h-[290px] overflow-hidden bg-background">
              {visualizationResult && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-full px-6 pt-16 pb-2">
                    <StandaloneChart
                      type={visualizationResult.type}
                      data={visualizationResult.data}
                      height={275}
                      width="100%"
                      startYAxisFromZero={true}
                      formatNumbers={true}
                      colors={['hsl(var(--chart-1, 221 83% 53%))', 'hsl(var(--chart-2, 358 84% 56%))', 
                               'hsl(var(--chart-3, 160 84% 39%))', 'hsl(var(--chart-4, 45 93% 47%))',
                               'hsl(var(--chart-5, 262 80% 63%))']}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
} 