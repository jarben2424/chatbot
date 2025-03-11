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
import { VisualizationEditor } from './visualization-editor';

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
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState(null);
  const [showVisualizationPanel, setShowVisualizationPanel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedVisualizations, setSavedVisualizations] = useState([]);

  // Move determineBestVisualization out of visualizeData function to component level
  function determineBestVisualization(data) {
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
    setIsVisualizing(true);
    
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        toast.error('No data available to visualize');
        setIsVisualizing(false);
        return;
      }
      
      // Determine best visualization type
      const bestVisualizationType = determineBestVisualization(data);
      
      // Show the preview panel in regular chat
      setShowVisualizationPanel(true);
      
      // Auto-expand after a short delay to split-screen editor
      setTimeout(() => {
        setIsExpanded(true);
      }, 500);
      
      toast.success('Visualization created');
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error('Error creating visualization');
    } finally {
      setIsVisualizing(false);
    }
  };

  // Add a function to handle saving visualizations
  const handleSaveVisualization = (vizData) => {
    // Here you would save to your database
    console.log('Saving visualization to dashboard:', vizData);
    
    // For demo, just add to local state
    setSavedVisualizations([...savedVisualizations, vizData]);
    
    // Show success toast
    toast.success('Visualization saved to dashboard');
    
    // Close the expanded view
    setIsExpanded(false);
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
                  {!visualization && (
                    <Button 
                      size="sm" 
                      onClick={visualizeData} 
                      disabled={isVisualizing}
                    >
                      {isVisualizing ? 'Creating...' : 'Visualize'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowSql(true)}
                    className="ml-2"
                  >
                    Show SQL
                  </Button>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-auto">
              <DataTable data={data} />
            </div>
          </div>
        ) : (
          // SQL view
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

      {/* Add visualization panel */}
      {showVisualizationPanel && !isExpanded && (
        <div className="mt-6">
          <VisualizationPanel
            data={data}
            visualization={visualization || 'auto'}
            title={title}
            expandable={true}
            onClose={() => setShowVisualizationPanel(false)}
            onExpand={() => setIsExpanded(true)}
          />
        </div>
      )}

      {isExpanded && (
        <VisualizationEditor
          data={data}
          visualization={visualization || determineBestVisualization(data)}
          title={title}
          onClose={() => {
            setIsExpanded(false);
            setShowVisualizationPanel(true);
          }}
          onSave={(savedViz) => {
            // Save the visualization to the dashboard
            console.log('Saving visualization:', savedViz);
            
            // Close the editor after saving
            setIsExpanded(false);
            setShowVisualizationPanel(false);
            toast.success('Saved to Dashboard');
          }}
        >
          <div className="text-muted-foreground">
            <h3 className="font-medium mb-2">Current Query</h3>
            <p className="text-sm mb-4">
              {title}
            </p>
            {sql && (
              <div className="text-xs mt-2 p-2 bg-muted/30 rounded">
                <code>{sql.substring(0, 80)}...</code>
              </div>
            )}
          </div>
        </VisualizationEditor>
      )}
    </>
  );
} 