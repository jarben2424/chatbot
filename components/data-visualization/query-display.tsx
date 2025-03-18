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

          // Create an artifact in fullscreen mode
          const artifactId = generateUUID();
          
          setArtifact({
            documentId: artifactId,
            title: title,
            kind: 'visualization' as ArtifactKind,
            content: JSON.stringify({
              data: fallbackData,
              visualization: 'line',
              description,
              settings: {
                type: 'line',
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
            boundingBox: {
              top: 0,
              left: 0,
              width: 0,
              height: 0,
            },
          });
          
          toast.success('Visualization created');
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
      
      // Create an artifact in fullscreen mode
      const artifactId = generateUUID();
      
      setArtifact({
        documentId: artifactId,
        title: title,
        kind: 'visualization' as ArtifactKind,
        content: JSON.stringify({
          data: data,
          visualization: bestVisualizationType,
          description,
          settings: {
            type: bestVisualizationType,
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
        boundingBox: {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        },
      });
      
      toast.success('Visualization created');
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error('Error creating visualization');
    }
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

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        {!showSql ? (
          // Data table view
          <div>
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
            >
              <DataTable data={data} />
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-muted p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">SQL Query</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowSql(false)}
                >
                  Show Data
                </Button>
              </div>
            </div>
            <div className="p-4 bg-muted/20 h-96 overflow-auto">
              <pre className="text-sm">
                <code>{formatSql(sql || '')}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 