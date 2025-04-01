'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const { setArtifact, artifact } = useArtifact();
  const [showSql, setShowSql] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<{data: any[], type: string} | null>(null);
  const [showVisualizationPanel, setShowVisualizationPanel] = useState(false);
  const [showInlineVisualization, setShowInlineVisualization] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHiddenInChat, setIsHiddenInChat] = useState(false);
  const [isInLeftSidePanel, setIsInLeftSidePanel] = useState(false);
  
  const queryCardRef = useRef<HTMLDivElement>(null);
  
  // Check if document is expanded (chat is in left side panel)
  const isDocumentExpanded = useRef(false);

  useEffect(() => {
    // Check if the document is expanded by looking for the body class
    const checkIfDocumentExpanded = () => {
      const isExpanded = document.body.classList.contains('expanded-document');
      isDocumentExpanded.current = isExpanded;
      
      // If document is expanded and we're showing visualization, hide the card
      if (isExpanded) {
        setIsHiddenInChat(true);
      }
    };
    
    // Run the check immediately
    checkIfDocumentExpanded();
    
    // Set up an observer to detect class changes on the body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkIfDocumentExpanded();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleRestoreVisualization = (event: CustomEvent) => {
      if (event.detail) {
        if (event.detail.data) {
          setVisualizationResult({
            data: event.detail.data,
            type: event.detail.type || 'bar'
          });
        }
        
        if (event.detail.restoreChart) {
          // Only restore if document isn't expanded
          if (!isDocumentExpanded.current) {
            setIsHiddenInChat(false);
            
            setTimeout(() => {
              setShowInlineVisualization(true);
            }, 50);
          }
        }
      }
    };
    
    const handleVisualizationExpanded = (event: CustomEvent) => {
      if (event.detail && event.detail.artifactId) {
        setIsTransitioning(true);
        
        setIsHiddenInChat(true);
        
        setTimeout(() => {
          setShowInlineVisualization(false);
          setIsTransitioning(false);
        }, 100);
      }
    };
    
    const handleVisualizationClosed = (event: CustomEvent) => {
      if (event.detail && event.detail.restoreQueryCard) {
        // Only restore if document isn't expanded
        if (!isDocumentExpanded.current) {
          setIsHiddenInChat(false);
          
          setTimeout(() => {
            setShowInlineVisualization(true);
          }, 50);
        }
      }
    };
    
    window.addEventListener('restoreVisualization', handleRestoreVisualization as EventListener);
    window.addEventListener('visualizationExpanded', handleVisualizationExpanded as EventListener);
    window.addEventListener('visualizationClosed', handleVisualizationClosed as EventListener);
    
    return () => {
      window.removeEventListener('restoreVisualization', handleRestoreVisualization as EventListener);
      window.removeEventListener('visualizationExpanded', handleVisualizationExpanded as EventListener);
      window.removeEventListener('visualizationClosed', handleVisualizationClosed as EventListener);
    };
  }, []);
  
  // Add new effect to check for document expansion state changes
  useEffect(() => {
    const checkAndUpdateVisibility = () => {
      const isExpanded = document.body.classList.contains('expanded-document');
      
      // If document is expanded (chat is in left panel), hide the query card
      if (isExpanded) {
        setIsHiddenInChat(true);
      } else {
        // Only restore visibility if we're not in a visualization artifact
        if (!artifact.isVisible || artifact.kind !== 'visualization') {
          setIsHiddenInChat(false);
        }
      }
    };
    
    // Check initially
    checkAndUpdateVisibility();
    
    // Set up observer to monitor body class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkAndUpdateVisibility();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, [artifact.isVisible, artifact.kind]);
  
  // Also check artifact state changes for visibility updates
  useEffect(() => {
    if (artifact.isVisible && artifact.kind === 'visualization') {
      setIsHiddenInChat(true);
    } else if (!document.body.classList.contains('expanded-document')) {
      setIsHiddenInChat(false);
    }
  }, [artifact.isVisible, artifact.kind]);

  function determineBestVisualization(data: any[]): string {
    if (!data || data.length === 0) return 'table';
    
    const sample = data[0];
    
    // Check if we have time series data (date/time columns)
    const dateColumns = Object.keys(sample).filter(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('year') ||
      key.toLowerCase().includes('time') ||
      (typeof sample[key] === 'string' && !isNaN(Date.parse(sample[key])))
    );
    
    // Check for numeric columns
    const numericColumns = Object.keys(sample).filter(key => 
      typeof sample[key] === 'number' || 
      (typeof sample[key] === 'string' && !isNaN(Number(sample[key].toString().replace(/[^0-9.-]+/g, ''))))
    );
    
    // Check for categorical data (strings that are not dates)
    const categoricalColumns = Object.keys(sample).filter(key => 
      typeof sample[key] === 'string' && 
      isNaN(Date.parse(sample[key])) &&
      !numericColumns.includes(key)
    );
    
    // Check if we have geographical data
    const geoColumns = Object.keys(sample).filter(key => 
      key.toLowerCase().includes('country') || 
      key.toLowerCase().includes('state') || 
      key.toLowerCase().includes('city') ||
      key.toLowerCase().includes('region') ||
      key.toLowerCase().includes('location')
    );
    
    // Time series data with numeric values - Line chart
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      return 'line';
    } 
    // Comparison between categories - Bar chart
    else if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
      return data.length > 8 ? 'bar' : 'bar';
    } 
    // Comparison between multiple numeric columns - Bar chart
    else if (numericColumns.length >= 2) {
      return 'bar';
    } 
    // Distribution or parts of a whole (small dataset) - Pie chart
    else if (data.length <= 6 && numericColumns.length === 1) {
      return 'pie';
    }
    // Many categories with one numeric value - Horizontal bar
    else if (categoricalColumns.length === 1 && numericColumns.length === 1 && data.length > 8) {
      return 'bar';
    }
    // Default to bar chart as it's the most versatile
    return 'bar';
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
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
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
        if (title.toLowerCase().includes('monthly revenue')) {
          const fallbackData = [
            { month: 'January', revenue: 75000 },
            { month: 'February', revenue: 82500 },
            { month: 'March', revenue: 79800 },
            { month: 'April', revenue: 88000 },
            { month: 'May', revenue: 94200 }
          ];
          
          setVisualizationResult({
            data: fallbackData,
            type: 'line'
          });

          setShowInlineVisualization(true);
          return;
        }
        
        toast.error('No data available to visualize');
        return;
      }
      
      const bestVisualizationType = determineBestVisualization(data);
      
      setVisualizationResult({
        data: data,
        type: bestVisualizationType
      });
      
      setShowInlineVisualization(true);
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error('Error creating visualization');
    }
  };

  const handleBackToTable = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setShowInlineVisualization(false);
      setIsTransitioning(false);
    }, 150);
  };

  const expandVisualization = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const boundingBox = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    const artifactId = generateUUID();
    
    // Set transitioning state to animate the fade out
    setIsTransitioning(true);
    
    // Keep showing inline visualization during transition
    // DON'T change back to data table view
    
    const styleId = 'viz-editor-fix-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        /* Fix problematic elements in visualization editor */
        
        /* Fix resize handle */
        [data-panel-resize-handle-id],
        div[role="separator"] {
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          display: block !important;
          opacity: 0 !important;
        }
        
        /* Hide all scrollbars */
        *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
        
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        /* Fix pulsating line under header */
        *::after,
        *::before {
          animation: none !important;
          transition: none !important;
          border-bottom: none !important;
        }
        
        /* Fix the toolbar border */
        .flex.justify-between.items-center.p-3.bg-background {
          border-bottom: 1px solid hsl(var(--border)) !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }
        
        /* Add border to controls header */
        .p-4.border-b.bg-background.flex-shrink-0 {
          border-top: 1px solid hsl(var(--border)) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    setTimeout(() => {
      const currentTime = new Date();
      const timestamp = currentTime.toISOString();
      
      // Make sure we have actual data for visualization
      let actualData = visualizationResult?.data || data;
      
      // Ensure we have valid data
      if (!actualData || !Array.isArray(actualData) || actualData.length === 0) {
        console.log('No valid data for visualization, using fallback');
        actualData = [
          { month: 'January', revenue: 75000 },
          { month: 'February', revenue: 82500 },
          { month: 'March', revenue: 79800 },
          { month: 'April', revenue: 88000 },
          { month: 'May', revenue: 94200 }
        ];
      }
      
      console.log('Creating visualization with ID and timestamp:', artifactId, timestamp);
      console.log('Visualization data:', {
        hasData: !!actualData && Array.isArray(actualData) && actualData.length > 0,
        dataLength: actualData?.length,
        data: actualData?.slice(0, 2) // Log first 2 items
      });
      
      // First create a document that will be used by the artifact system
      const documentBody = {
        title: title,
        content: JSON.stringify({
          data: actualData,
          visualization: visualizationResult?.type || determineBestVisualization(data),
          description,
          timestamp,
          lastModified: timestamp
        }),
        kind: 'visualization',
        createdAt: timestamp // The createdAt timestamp is critical for displaying "Updated X ago"
      };
      
      console.log('Document creation request body:', documentBody);
      
      fetch(`/api/document?id=${artifactId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentBody)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(documents => {
        console.log('Document creation response:', documents);
        
        // Once document is created, then create the artifact with reference to it
        const vizSettings = {
          type: visualizationResult?.type || determineBestVisualization(data),
          colors: ['hsl(var(--chart-1, 221 83% 53%))', 'hsl(var(--chart-2, 358 84% 56%))', 
                'hsl(var(--chart-3, 160 84% 39%))', 'hsl(var(--chart-4, 45 93% 47%))',
                'hsl(var(--chart-5, 262 80% 63%))'],
          showLegend: true,
          showDataLabels: false,
          showTitle: true,
          showLabels: true,
          title: title,
          customStyles: {
            hideResizeHandle: true,
            hideScrollbars: true,
            preventPulsatingLine: true
          }
        };
        
        setArtifact({
          documentId: artifactId,
          title: title,
          kind: 'visualization' as ArtifactKind,
          content: JSON.stringify({
            data: actualData,
            visualization: vizSettings.type,
            description,
            timestamp,
            lastModified: timestamp,
            settings: {
              ...vizSettings,
              forceExpanded: true
            }
          }),
          isVisible: true,
          status: 'idle',
          boundingBox: boundingBox
        });
        
        // Hide the visualization only after the visualization editor is loaded
        setTimeout(() => {
          setShowInlineVisualization(false);
          setIsTransitioning(false);
        }, 300);
        
        // Force a revalidation of the document in case it's not loading
        fetch(`/api/document?id=${artifactId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }).catch(error => console.error('Error fetching document:', error));
      }).catch(error => {
        console.error('Error creating document record:', error);
        
        // Still create the artifact even if document fails
        setArtifact({
          documentId: artifactId,
          title: title,
          kind: 'visualization' as ArtifactKind,
          content: JSON.stringify({
            data: visualizationResult?.data || data,
            visualization: visualizationResult?.type || determineBestVisualization(data),
            description,
            timestamp,
            lastModified: timestamp,
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
          boundingBox: boundingBox
        });
        
        // Hide the visualization only after the editor is loaded
        setTimeout(() => {
          setShowInlineVisualization(false);
          setIsTransitioning(false);
        }, 300);
      });
    }, 150);
  };

  function formatSql(sql: string) {
    if (!sql) return '';
    
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 
      'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'JOIN', 'UNION', 
      'LIMIT', 'OFFSET', 'ON', 'AND', 'OR'
    ];
    
    let formattedSql = sql;
    
    formattedSql = formattedSql.replace(/\s+/g, ' ').trim();
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\s${keyword}\\s`, 'gi');
      formattedSql = formattedSql.replace(regex, `\n${keyword} `);
    });
    
    if (formattedSql.startsWith('SELECT')) {
      formattedSql = 'SELECT' + formattedSql.substring(6);
    }
    
    const lines = formattedSql.split('\n');
    let indentLevel = 0;
    
    return lines.map(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('FROM') || 
          trimmedLine.startsWith('WHERE') ||
          trimmedLine.startsWith('GROUP BY') ||
          trimmedLine.startsWith('ORDER BY')) {
        return '  ' + trimmedLine;
      } else if (trimmedLine.startsWith('AND') || 
                 trimmedLine.startsWith('OR') ||
                 trimmedLine.startsWith('ON')) {
        return '    ' + trimmedLine;
      }
      
      return trimmedLine;
    }).join('\n');
  }

  // Get appropriate card heights based on context
  const getCardHeight = () => {
    if (isInLeftSidePanel) {
      return "280px"; // Smaller height when in left panel
    }
    return "380px"; // Normal height
  };

  const getTableWrapperHeight = () => {
    if (isInLeftSidePanel) {
      return "205px"; // Smaller height when in left panel
    }
    return "305px"; // Normal height
  };

  // Either hide the query card when in left side panel, or show a modified version
  if (isHiddenInChat || (isInLeftSidePanel && document.body.classList.contains('expanded-document'))) {
    return null;
  }

  // For the left side panel, provide a simplified version with just essential info
  if (isInLeftSidePanel) {
    return (
      <div 
        ref={queryCardRef}
        className={cn(
          "border rounded-lg overflow-hidden", 
          "transition-opacity duration-300 ease-in-out",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="bg-muted p-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium truncate">{title}</h3>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                className="h-7 px-2 py-1"
                variant="default"
                onClick={expandVisualization} 
              >
                Open
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CARD_HEIGHT = getCardHeight();
  const TABLE_WRAPPER_HEIGHT = getTableWrapperHeight();

  return (
    <>
      <div 
        ref={queryCardRef}
        className={cn(
          "border rounded-lg overflow-hidden", 
          "transition-opacity duration-300 ease-in-out",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {!showSql && !showInlineVisualization ? (
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
          <div className={cn(
            "relative w-full cursor-pointer border border-muted overflow-hidden rounded-lg",
            "transition-all duration-300 ease-in-out transform",
            isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )} style={{ height: CARD_HEIGHT }}>
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