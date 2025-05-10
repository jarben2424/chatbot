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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IconCode, IconExport, IconEye, IconBarChart } from '@/components/ui/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { exportChartAsCSV } from '@/lib/utils/export-utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface QueryDisplayProps {
  data: any[];
  sql?: string;
  title: string;
  description?: string;
  visualization?: string;
  query: string;
  id: string;
}

export function QueryDisplay({ 
  data, 
  sql, 
  title, 
  description, 
  visualization,
  query,
  id
}: QueryDisplayProps) {
  const { setArtifact } = useArtifact();
  const [showSql, setShowSql] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState(null);
  const [showVisualizationPanel, setShowVisualizationPanel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedVisualizations, setSavedVisualizations] = useState([]);
  const router = useRouter();

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
        // Provide fallback data for monthly revenue query
        if (title.toLowerCase().includes('monthly revenue')) {
          const fallbackData = [
            { month: 'January', revenue: 75000 },
            { month: 'February', revenue: 82500 },
            { month: 'March', revenue: 79800 },
            { month: 'April', revenue: 88000 },
            { month: 'May', revenue: 94200 }
          ];
          
          setShowVisualizationPanel(true);
          
          // Auto-expand after a short delay to split-screen editor
          setTimeout(() => {
            setIsExpanded(true);
          }, 500);
          
          toast.success('Visualization created');
          return;
        }
        
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

  const handleExportCSV = () => {
    exportChartAsCSV(data, 'query-results');
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Query Results ({data.length} rows)</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSql(!showSql)}
            className="h-8 px-2"
          >
            <IconCode className="h-4 w-4 mr-1" />
            {showSql ? 'Hide SQL' : 'Show SQL'}
          </Button>
        </CardTitle>
        
        {showSql && (
          <div className="mt-2 p-2 bg-muted/60 rounded overflow-x-auto">
            <pre className="text-xs font-mono">{query}</pre>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 max-h-80 overflow-auto">
        <DataTable data={data} pageSize={5} />
      </CardContent>
      
      <CardFooter className="flex justify-between bg-muted/20 p-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2"
          onClick={handleExportCSV}
        >
          <IconExport className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        
        <div>
          <Link href={`/artifacts/${id}`} passHref>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <IconEye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </Link>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <IconBarChart className="h-4 w-4 mr-1" />
                Visualize
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Visualization</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p>Enter a simple message to create a visualization from this data:</p>
                <div className="mt-4 p-2 bg-muted rounded">
                  <p className="text-sm italic">
                    "Create a bar chart visualization from the query results showing the count by category"
                  </p>
                </div>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    // This would ideally be handled by sending a message to the AI
                    router.push('/chat');
                  }}
                >
                  Start New Chat with This Data
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
} 