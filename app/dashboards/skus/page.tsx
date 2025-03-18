'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';
import { getSystemDashboardMetricsByCategory, DashboardMetric } from '@/lib/dashboard-metrics';
import { RefreshCw } from 'lucide-react';
import { ShadcnVisualization } from '../_components/visualizations/shadcn-visualization';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VisualizationType } from '@/lib/local-storage';
import { DashboardHeader } from '../_components/dashboard-header';

export default function SkusDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});
  const [runningQueries, setRunningQueries] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadMetrics() {
      try {
        const skuMetrics = await getSystemDashboardMetricsByCategory('skus');
        setMetrics(skuMetrics);
        
        // Run all metrics queries automatically
        skuMetrics.forEach(metric => {
          runQuery(metric);
        });
      } catch (error) {
        console.error('Error loading SKU metrics:', error);
        toast.error('Failed to load SKU metrics');
      } finally {
        setLoading(false);
      }
    }
    
    loadMetrics();
  }, []);

  const runQuery = async (metric: DashboardMetric) => {
    try {
      setRunningQueries(prev => new Set(prev).add(metric.id));
      
      // Execute query via API
      const response = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sqlQuery: metric.querytemplate }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute query');
      }
      
      const result = await response.json();
      
      setResults(prev => ({
        ...prev,
        [metric.id]: { query: metric.querytemplate, results: result.results }
      }));
    } catch (error) {
      console.error('Failed to run query:', error);
    } finally {
      setRunningQueries(prev => {
        const updated = new Set(prev);
        updated.delete(metric.id);
        return updated;
      });
    }
  };

  const refreshAllMetrics = () => {
    if (metrics.length === 0) return;
    
    metrics.forEach(metric => {
      runQuery(metric);
    });
    toast.success('Refreshing all metrics');
  };

  // Helper function to map database visualization type to VisualizationType enum
  const mapVisualizationType = (type: string): VisualizationType => {
    switch (type) {
      case 'highlight':
        return 'highlight';
      case 'chart':
        return 'line-chart'; // Map 'chart' to line-chart for time series
      case 'line-chart':
        return 'line-chart';
      case 'bar-chart':
        return 'bar-chart';
      case 'table':
        return 'table';
      default:
        return 'table'; // Default to table visualization
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader 
          title="SKUs Dashboard" 
          description="Track product performance and inventory metrics"
          isLoading={true}
        />
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading SKU metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader 
        title="SKUs Dashboard" 
        description="Track product performance and inventory metrics"
        onRefresh={refreshAllMetrics}
        isLoading={runningQueries.size > 0}
      />
      
      <div className="flex-1 p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">SKUs Dashboard</h1>
          <p className="text-muted-foreground">Track product performance and inventory metrics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.length === 0 ? (
            <div className="col-span-full flex items-center justify-center p-6 bg-muted rounded-md">
              <p className="text-muted-foreground">No SKU metrics available. Contact your administrator to add metrics.</p>
            </div>
          ) : (
            metrics.map(metric => (
              <Card key={metric.id} className="overflow-hidden shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <CardDescription>{metric.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {runningQueries.has(metric.id) ? (
                    <div className="flex items-center justify-center h-52">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : results[metric.id] ? (
                    <ShadcnVisualization 
                      data={results[metric.id].results} 
                      type={mapVisualizationType(metric.visualizationtype)}
                      title={metric.title}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-52">
                      <Button size="sm" onClick={() => runQuery(metric)} variant="outline">
                        Run Query
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
