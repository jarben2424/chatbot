'use client';

import { useState, useEffect } from 'react';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';
import { getSystemDashboardMetricsByCategory, DashboardMetric } from '@/lib/dashboard-metrics';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '../_components/dashboard-header';
import { toast } from 'sonner';
import { DashboardHighlightCard } from '../_components/dashboard-highlight-card';
import { RefreshCw } from 'lucide-react';
import { VisualizationType } from '@/lib/local-storage';

export default function CustomersDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});
  const [runningQueries, setRunningQueries] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadMetrics() {
      try {
        const customerMetrics = await getSystemDashboardMetricsByCategory('customers');
        setMetrics(customerMetrics);
        
        // Run all metrics queries automatically
        customerMetrics.forEach(metric => {
          runQuery(metric);
        });
      } catch (error) {
        console.error('Error loading customer metrics:', error);
        toast.error('Failed to load customer metrics');
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

  const refreshAllMetrics = () => {
    if (metrics.length === 0) return;
    
    metrics.forEach(metric => {
      runQuery(metric);
    });
    toast.success('Refreshing all metrics');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader 
          title="Customers Dashboard" 
          description="View customer metrics and performance data"
          isLoading={true}
        />
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading customer metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader 
        title="Customers Dashboard" 
        description="View customer metrics and performance data"
        onRefresh={refreshAllMetrics}
        isLoading={runningQueries.size > 0}
      />
      
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader 
          title="Customers Dashboard" 
          description="Track customer engagement and retention metrics"
          isLoading={runningQueries.size > 0}
        />
        
        <div className="flex flex-wrap gap-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="w-full md:w-[calc(33.333%-1rem)]">
              <DashboardHighlightCard
                id={metric.id}
                title={metric.title || 'Customer Metric'}
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
