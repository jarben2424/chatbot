'use client';

import { useState, useEffect } from 'react';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';
import { getSystemDashboardMetricsByCategory, DashboardMetric } from '@/lib/dashboard-metrics';
import { ShadcnVisualization } from '../_components/visualizations/shadcn-visualization';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '../_components/dashboard-header';
import { toast } from 'sonner';
import { VisualizationType } from '@/lib/local-storage';
import { DashboardHighlightCard } from '../_components/dashboard-highlight-card';
import { RefreshCw } from 'lucide-react';

export default function SalesDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});
  const [runningQueries, setRunningQueries] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadMetrics() {
      try {
        const salesMetrics = await getSystemDashboardMetricsByCategory('sales');
        setMetrics(salesMetrics);
        
        // Run all metrics queries automatically
        salesMetrics.forEach(metric => {
          runQuery(metric);
        });
      } catch (error) {
        console.error('Error loading sales metrics:', error);
        toast.error('Failed to load sales metrics');
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
    switch (type?.toLowerCase() || 'highlight') {
      case 'highlight':
        return 'highlight';
      case 'chart':
      case 'line':
      case 'line-chart':
        return 'line-chart';
      case 'bar':
      case 'bar-chart':
        return 'bar-chart';
      case 'table':
        return 'table';
      default:
        return 'highlight';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader 
          title="Sales Dashboard" 
          description="Track revenue performance and sales metrics"
          isLoading={true}
        />
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading sales metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader 
        title="Sales Dashboard" 
        description="Track revenue performance and sales metrics"
        onRefresh={refreshAllMetrics}
        isLoading={runningQueries.size > 0}
      />
      
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales Dashboard</h1>
            <p className="text-muted-foreground">Track revenue performance and sales metrics</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="w-full md:w-[calc(33.333%-1rem)]">
              <DashboardHighlightCard
                id={metric.id}
                title={metric.title || 'Sales Metric'}
                description={metric.description || ''}
                visualizationType={mapVisualizationType(metric.visualizationtype)}
                isLoading={runningQueries.has(metric.id)}
                data={results[metric.id]?.results || []}
                onRunQuery={() => runQuery(metric)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
