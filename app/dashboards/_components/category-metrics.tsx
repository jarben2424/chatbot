'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HighlightCard } from './visualizations/highlight-card';
import { ChartCard } from './visualizations/chart-card';
import { TableCard } from './visualizations/table-card';
import { 
  getUserDashboardMetricsByCategory, 
  getSystemDashboardMetricsByCategory, 
  type UserDashboardMetric,
  type DashboardMetric 
} from '@/lib/dashboard-metrics';
import { executeMetricQuery } from '@/lib/snowflake-query';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import Masonry from 'react-masonry-css';

interface CategoryMetricsProps {
  category: 'sales' | 'customers' | 'skus' | 'general';
  isPersonalDashboard?: boolean;
}

export function CategoryMetrics({ category, isPersonalDashboard = false }: CategoryMetricsProps) {
  // This component can work with either UserDashboardMetric or DashboardMetric
  // since they both have the essential properties we need
  const [metrics, setMetrics] = useState<(UserDashboardMetric | DashboardMetric)[]>([]);
  const [metricData, setMetricData] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch metrics for this category
  useEffect(() => {
    async function loadMetrics() {
      setIsLoading(true);
      setMetrics([]); // Clear previous metrics to avoid stale data
      
      try {
        console.log(`Loading ${isPersonalDashboard ? 'user' : 'system'} metrics for category:`, category);
        let categoryMetrics;
        
        // For personal dashboard, get user's custom metrics
        // For category dashboards, get system metrics
        if (isPersonalDashboard) {
          try {
            categoryMetrics = await getUserDashboardMetricsByCategory(category);
          } catch (authError) {
            console.error('Authentication error loading user metrics:', authError);
            if (String(authError).includes('authentication') || String(authError).includes('auth')) {
              setError(new Error('Authentication required. Please sign in to view your dashboard.'));
            } else {
              setError(authError instanceof Error ? authError : new Error(String(authError)));
            }
            setIsLoading(false);
            return;
          }
        } else {
          // System metrics don't require auth
          categoryMetrics = await getSystemDashboardMetricsByCategory(category);
        }
        
        console.log(`Loaded ${categoryMetrics.length} metrics for ${category} category`);
        setMetrics(categoryMetrics || []);
        
        // Load data for the metrics
        if (categoryMetrics && categoryMetrics.length > 0) {
          await loadMetricData(categoryMetrics);
        } else {
          console.log(`No metrics found for category: ${category}`);
          setMetricData(new Map()); // Empty the metric data
        }
      } catch (err) {
        console.error('Error loading metrics:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setMetrics([]); // Set empty array to avoid partial data
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMetrics();
  }, [category, isPersonalDashboard]);

  async function loadMetricData(metrics: (UserDashboardMetric | DashboardMetric)[]) {
    setIsLoadingData(true);
    const dataMap = new Map();
    
    try {
      console.log(`Loading data for ${metrics.length} metrics`);
      
      // Load data for each metric in parallel
      const promises = metrics.map(async (metric) => {
        try {
          const metricId = metric.id;
          const metricTitle = (metric as any).title || (metric as any).customTitle || 'Untitled Metric';
          
          console.log(`Executing query for metric: ${metricTitle} (${metricId})`);
          
          // Execute the query via the API
          const result = await executeMetricQuery(metricId);
          
          if (result.success && result.data) {
            console.log(`Query succeeded for metric: ${metricTitle}`);
            dataMap.set(metricId, result.data);
          } else {
            console.error(`Query failed for metric ${metricTitle} (${metricId}):`, result.error);
            dataMap.set(metricId, { error: result.error || 'Query failed' });
          }
        } catch (error) {
          console.error(`Error loading data for metric ${(metric as any).title || metric.id}:`, error);
          dataMap.set(metric.id, { error: 'Failed to execute query' });
        }
      });
      
      // Wait for all promises to resolve, even if some fail
      await Promise.allSettled(promises);
      console.log(`Finished loading data for all metrics`);
    } catch (error) {
      console.error('Error loading metric data:', error);
    } finally {
      setMetricData(dataMap);
      setIsLoadingData(false);
    }
  }
  
  // Define the breakpoints for the masonry layout
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  // If there's an error, show error message
  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md max-w-lg">
          <h3 className="font-semibold mb-2">Error loading metrics</h3>
          <p>{error.message}</p>
          {/* Add retry button */}
          <button 
            className="mt-4 px-4 py-2 bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
          ))}
        </Masonry>
      </div>
    );
  }

  // If no metrics, show empty state
  if (!metrics || metrics.length === 0) {
    return (
      <EmptyPlaceholder className="mx-auto max-w-4xl">
        <EmptyPlaceholder.Icon name="bar-chart">
          <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
            📊
          </div>
        </EmptyPlaceholder.Icon>
        <EmptyPlaceholder.Title>No {category} metrics yet</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {isPersonalDashboard
            ? `You haven't added any ${category} metrics to your dashboard yet.`
            : `There are no system metrics configured for the ${category} category yet.`}
        </EmptyPlaceholder.Description>
        {isPersonalDashboard && (
          <div className="mt-4">
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow transition-colors hover:bg-primary/90"
              onClick={() => {/* Browse metrics or add from chat */}}
            >
              Browse Metrics
            </button>
          </div>
        )}
      </EmptyPlaceholder>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-transparent"
    >
      {metrics.map((metric, index) => {
        const data = metricData.get(metric.id);
        
        // Handle different property structures between UserDashboardMetric and DashboardMetric
        const title = 'customTitle' in metric 
          ? (metric.customTitle || metric.title || '') 
          : (metric.title || '');
          
        const description = 'customDescription' in metric
          ? (metric.customDescription || metric.description || '')
          : (metric.description || '');
        
        // Determine the visualization type
        const vizType = 'customVisualizationType' in metric
          ? (metric.customVisualizationType || metric.visualizationtype || '')
          : (metric.visualizationtype || '');
          
        const lowerVizType = typeof vizType === 'string' ? vizType.toLowerCase() : '';
        
        console.log(`Rendering metric: ${title}, type: ${lowerVizType}`, data);
        
        switch (lowerVizType) {
          case 'highlight':
            return (
              <div key={metric.id} style={{ marginBottom: '1rem' }}>
                <HighlightCard
                  title={title}
                  description={description}
                  value={data?.value || 0}
                  trend={data?.trend}
                />
              </div>
            );
          case 'chart':
          case 'barchart':
            return (
              <div key={metric.id} style={{ marginBottom: '1rem' }}>
                <ChartCard
                  title={title}
                  description={description}
                  data={data?.data || []}
                  categories={data?.categories || ['value']}
                  index={data?.index || 'date'}
                  chartType="bar"
                />
              </div>
            );
          case 'linechart':
            return (
              <div key={metric.id} style={{ marginBottom: '1rem' }}>
                <ChartCard
                  title={title}
                  description={description}
                  data={data?.data || []}
                  categories={data?.categories || ['value']}
                  index={data?.index || 'date'}
                  chartType="line"
                />
              </div>
            );
          case 'areachart':
            return (
              <div key={metric.id} style={{ marginBottom: '1rem' }}>
                <ChartCard
                  title={title}
                  description={description}
                  data={data?.data || []}
                  categories={data?.categories || ['value']}
                  index={data?.index || 'date'}
                  chartType="area"
                />
              </div>
            );
          case 'table':
            return (
              <div key={metric.id} style={{ marginBottom: '1rem' }}>
                <TableCard
                  title={title}
                  description={description}
                  data={data?.data || []}
                  columns={data?.columns || []}
                />
              </div>
            );
          default:
            return (
              <div key={metric.id} style={{ marginBottom: '1rem' }}>
                <Card className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm text-muted-foreground">
                      Unknown visualization type: {vizType}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
        }
      })}
    </Masonry>
  );
}
