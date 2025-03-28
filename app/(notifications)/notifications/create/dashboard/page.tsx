'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NotificationProvider, useNotificationContext } from '../../../_context/notification-context';

// Define types for metrics
interface Metric {
  id: string;
  title: string;
  description: string;
  category: string;
  visualizationType: string;
}

interface CategorizedMetrics {
  sales: Metric[];
  customers: Metric[];
  products: Metric[];
  [key: string]: Metric[];
}

// Service function to fetch metrics from the database
async function fetchMetrics(): Promise<CategorizedMetrics> {
  try {
    // Fetch system metrics
    const systemMetricsRes = await fetch('/api/metrics');
    const systemMetrics = await systemMetricsRes.json();
    
    // Fetch user metrics
    const userMetricsRes = await fetch('/api/user-dashboard-metrics');
    const userMetrics = await userMetricsRes.json();
    
    // Categorize metrics
    const categorizedMetrics: CategorizedMetrics = {
      sales: [],
      customers: [],
      products: []
    };
    
    // Process system metrics
    systemMetrics.forEach((metric: any) => {
      const category = metric.category.toLowerCase();
      if (categorizedMetrics[category]) {
        categorizedMetrics[category].push({
          id: metric.id,
          title: metric.title,
          description: metric.description,
          category,
          visualizationType: metric.visualizationtype
        });
      }
    });
    
    // Process user metrics
    userMetrics.forEach((metric: any) => {
      // Get original metric details from system metrics if it's based on a system metric
      const baseMetric = systemMetrics.find((m: any) => m.id === metric.sourceid);
      if (baseMetric && metric.sourcetype === 'system') {
        const category = baseMetric.category.toLowerCase();
        if (categorizedMetrics[category]) {
          categorizedMetrics[category].push({
            id: metric.id,
            title: metric.customtitle || baseMetric.title,
            description: metric.customdescription || baseMetric.description,
            category,
            visualizationType: metric.customvisualizationtype || baseMetric.visualizationtype
          });
        }
      }
    });
    
    return categorizedMetrics;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Return mock data if API fails
    return MOCK_METRICS;
  }
}

// Mock metrics as fallback
const MOCK_METRICS: CategorizedMetrics = {
  sales: [
    { id: 's1', title: 'Monthly Revenue', description: 'Total revenue for the current month', category: 'sales', visualizationType: 'bar' },
    { id: 's2', title: 'Sales Growth', description: 'Month-over-month sales growth percentage', category: 'sales', visualizationType: 'line' },
    { id: 's3', title: 'Average Order Value', description: 'Average value of orders placed', category: 'sales', visualizationType: 'number' },
    { id: 's4', title: 'Revenue by Product Category', description: 'Revenue breakdown by product category', category: 'sales', visualizationType: 'pie' },
  ],
  customers: [
    { id: 'c1', title: 'New Customers', description: 'Number of new customers this month', category: 'customers', visualizationType: 'number' },
    { id: 'c2', title: 'Customer Retention Rate', description: 'Percentage of customers who return', category: 'customers', visualizationType: 'percentage' },
    { id: 'c3', title: 'Customer Lifetime Value', description: 'Average revenue generated per customer', category: 'customers', visualizationType: 'currency' },
    { id: 'c4', title: 'Customer Satisfaction Score', description: 'Average satisfaction rating', category: 'customers', visualizationType: 'gauge' },
  ],
  products: [
    { id: 'p1', title: 'Top Selling Products', description: 'Products with the highest sales volume', category: 'products', visualizationType: 'table' },
    { id: 'p2', title: 'Inventory Levels', description: 'Current inventory levels by product', category: 'products', visualizationType: 'bar' },
    { id: 'p3', title: 'Product Return Rate', description: 'Percentage of products returned', category: 'products', visualizationType: 'percentage' },
    { id: 'p4', title: 'Product Margin Analysis', description: 'Profit margins by product category', category: 'products', visualizationType: 'bar' },
  ],
};

// Wrapper component with NotificationProvider
export default function DashboardSelectPageWrapper() {
  return (
    <NotificationProvider>
      <DashboardSelectPage />
    </NotificationProvider>
  );
}

// Main component that uses the NotificationContext
function DashboardSelectPage() {
  const router = useRouter();
  const { notification, updateNotificationField } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<'sales' | 'customers' | 'products'>('sales');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    notification.content?.metrics || []
  );
  const [metrics, setMetrics] = useState<CategorizedMetrics>(MOCK_METRICS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch metrics on component mount
  useEffect(() => {
    const getMetrics = async () => {
      setIsLoading(true);
      const data = await fetchMetrics();
      setMetrics(data);
      setIsLoading(false);
    };
    
    getMetrics();
  }, []);

  // Update notification context when metrics change
  useEffect(() => {
    // Prevent infinite loop by not including notification.content in dependencies
    const updatedContent = {
      ...notification.content,
      metrics: selectedMetrics
    };
    
    // Only update if the metrics have actually changed
    const currentMetrics = notification.content?.metrics || [];
    if (JSON.stringify(currentMetrics) !== JSON.stringify(selectedMetrics)) {
      updateNotificationField('content', updatedContent);
    }
  }, [selectedMetrics, updateNotificationField, notification.content?.metrics]);

  // Toggle selection of a metric
  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) 
        ? prev.filter(metricId => metricId !== id) 
        : [...prev, id]
    );
  };

  // Count selected metrics by category
  const selectedCounts = {
    sales: selectedMetrics.filter(id => metrics.sales.some(m => m.id === id)).length,
    customers: selectedMetrics.filter(id => metrics.customers.some(m => m.id === id)).length,
    products: selectedMetrics.filter(id => metrics.products.some(m => m.id === id)).length,
  };

  // Type-safe category array
  const categories: Array<keyof CategorizedMetrics> = ['sales', 'customers', 'products'];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Select Dashboard Metrics</h1>
        <p className="text-muted-foreground">
          Choose which metrics to include in your report
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Dashboard Metrics</span>
            <Badge variant="outline" className="ml-2">
              {selectedMetrics.length} selected
            </Badge>
          </CardTitle>
          <CardDescription>
            Select metrics from the categories below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="sales" value={activeTab} onValueChange={(value) => setActiveTab(value as 'sales' | 'customers' | 'products')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales" className="relative">
                  Sales
                  {selectedCounts.sales > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCounts.sales}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="customers" className="relative">
                  Customers
                  {selectedCounts.customers > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCounts.customers}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="products" className="relative">
                  Products
                  {selectedCounts.products > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCounts.products}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              {/* Render metrics for each category */}
              {categories.map(category => (
                <TabsContent key={category} value={category as string} className="border-none p-0 pt-4">
                  <div className="h-[400px] pr-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {metrics[category].map((metric: Metric) => (
                        <Card 
                          key={metric.id}
                          className={`cursor-pointer transition-colors ${
                            selectedMetrics.includes(metric.id) 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => toggleMetric(metric.id)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-start justify-between">
                              <span>{metric.title}</span>
                              {selectedMetrics.includes(metric.id) && (
                                <CheckIcon className="h-4 w-4 text-primary" />
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">{metric.description}</p>
                            <Badge variant="outline" className="mt-2">
                              {metric.visualizationType}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Selected metrics summary */}
      {selectedMetrics.length > 0 && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Selected Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(metrics).flatMap(category => 
                metrics[category as keyof CategorizedMetrics]
                  .filter(metric => selectedMetrics.includes(metric.id))
                  .map(metric => (
                    <Badge 
                      key={metric.id} 
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5 pl-3 pr-1.5"
                    >
                      {metric.title}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 rounded-full hover:bg-primary/20" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMetric(metric.id);
                        }}
                      >
                        <span className="sr-only">Remove</span>
                        <span className="text-xs">×</span>
                      </Button>
                    </Badge>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fixed navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-background border-t flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/notifications/create">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button 
          onClick={() => router.push('/notifications/create/recipients')}
          disabled={selectedMetrics.length === 0}
        >
          Next: Add Recipients
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
