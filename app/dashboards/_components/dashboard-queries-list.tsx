'use client';

import { LocalDashboardQuery, deleteLocalDashboardQuery, updateLocalDashboardQueryTimestamp, updateLocalDashboardQuery, VisualizationType } from '@/lib/local-storage';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Trash2, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { Visualization } from './visualizations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function DashboardQueriesList() {
  const [queries, setQueries] = useState<LocalDashboardQuery[]>([]);
  const [runningQueries, setRunningQueries] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, any>>({});
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  const runQuery = async (query: LocalDashboardQuery) => {
    try {
      setRunningQueries(prev => new Set(prev).add(query.id));
      
      // Execute query via API
      const response = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sqlQuery: query.sqlQuery }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute query');
      }
      
      const result = await response.json();
      
      setResults(prev => ({
        ...prev,
        [query.id]: { query: query.sqlQuery, results: result.results }
      }));
      
      // Update query timestamp
      updateLocalDashboardQueryTimestamp(query.id);
      setQueries(prev => prev.map(q => q.id === query.id ? {...q, updatedAt: new Date().toISOString()} : q));
      
      toast.success('Query executed successfully');
    } catch (error) {
      toast.error('Failed to run query');
      console.error(error);
    } finally {
      setRunningQueries(prev => {
        const updated = new Set(prev);
        updated.delete(query.id);
        return updated;
      });
    }
  };
  
  // Load queries from localStorage on component mount
  useEffect(() => {
    // Import is dynamic to avoid SSR issues with localStorage
    import('@/lib/local-storage').then(({ getLocalDashboardQueries }) => {
      const savedQueries = getLocalDashboardQueries();
      setQueries(savedQueries);
      setIsLoading(false);
      
      // Auto-run all queries
      savedQueries.forEach(query => {
        runQuery(query);
      });
    });
  }, []);
  
  const toggleExpand = (id: string) => {
    setExpandedQueries(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }
  
  if (queries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-2">No saved queries yet</p>
        <p className="text-sm text-muted-foreground">
          Add business database queries from chats to see them here
        </p>
      </div>
    );
  }
  
  const deleteQuery = (id: string) => {
    try {
      deleteLocalDashboardQuery(id);
      
      // Update local state
      setQueries(prev => prev.filter(query => query.id !== id));
      setResults(prev => {
        const updated = {...prev};
        delete updated[id];
        return updated;
      });
      
      toast.success('Query removed from dashboard');
    } catch (error) {
      toast.error('Failed to remove query');
      console.error(error);
    }
  };
  
  const updateVisualizationType = (id: string, visualizationType: VisualizationType) => {
    try {
      const updatedQuery = updateLocalDashboardQuery(id, { visualizationType });
      if (updatedQuery) {
        setQueries(prev => prev.map(q => q.id === id ? updatedQuery : q));
        toast.success('Visualization updated');
      }
    } catch (error) {
      toast.error('Failed to update visualization');
      console.error(error);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {queries.map((query) => (
        <Card key={query.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="truncate">{query.title}</span>
              <div className="flex items-center space-x-1">
                <EditVisualizationDialog 
                  query={query} 
                  onUpdateVisualization={(type) => updateVisualizationType(query.id, type)} 
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteQuery(query.id)}
                  aria-label="Remove query"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              <span 
                className="cursor-pointer flex items-center text-sm" 
                onClick={() => toggleExpand(query.id)}
              >
                {expandedQueries.has(query.id) ? (
                  <>Query details <ChevronUp className="h-3 w-3 ml-1" /></>
                ) : (
                  <>Query details <ChevronDown className="h-3 w-3 ml-1" /></>
                )}
              </span>
            </CardDescription>
          </CardHeader>
          
          {expandedQueries.has(query.id) && (
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium">Question:</p>
                  <p className="text-xs text-muted-foreground">{query.question}</p>
                </div>
                <div>
                  <p className="text-xs font-medium">SQL Query:</p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                    {query.sqlQuery}
                  </pre>
                </div>
              </div>
            </CardContent>
          )}
          
          <CardContent>
            {results[query.id] ? (
              <Visualization 
                data={results[query.id].results} 
                type={query.visualizationType}
                title={query.title}
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                {runningQueries.has(query.id) ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Running query...
                  </>
                ) : (
                  'No results yet'
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={() => runQuery(query)} 
              disabled={runningQueries.has(query.id)}
              className="w-full"
            >
              {runningQueries.has(query.id) ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Refresh Query'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

interface EditVisualizationDialogProps {
  query: LocalDashboardQuery;
  onUpdateVisualization: (type: VisualizationType) => void;
}

function EditVisualizationDialog({ query, onUpdateVisualization }: EditVisualizationDialogProps) {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(query.visualizationType);
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PenLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Visualization</DialogTitle>
          <DialogDescription>
            Choose the best visualization for your query results
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup 
            value={visualizationType} 
            onValueChange={(value: string) => setVisualizationType(value as VisualizationType)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="highlight" id="viz-highlight" />
              <Label htmlFor="viz-highlight" className="flex items-center">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Highlight (for single values)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="line-chart" id="viz-line" />
              <Label htmlFor="viz-line" className="flex items-center">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Line Chart (for time series data)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bar-chart" id="viz-bar" />
              <Label htmlFor="viz-bar" className="flex items-center">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="12" width="4" height="9" />
                  <rect x="10" y="8" width="4" height="13" />
                  <rect x="18" y="4" width="4" height="17" />
                </svg>
                Bar Chart (for categorical data)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="table" id="viz-table" />
              <Label htmlFor="viz-table" className="flex items-center">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                Table View
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          
          <Button
            onClick={() => {
              onUpdateVisualization(visualizationType);
              setOpen(false);
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
