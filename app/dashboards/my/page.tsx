'use client';

import { useState, useEffect } from 'react';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';
import { EmailSubscriptionsList } from '@/app/dashboards/_components/email-subscriptions-list';
import { Button } from '@/components/ui/button';
import { Bell, PlusCircle, BarChart, LineChart, RefreshCw, Trash2, MoreHorizontal } from 'lucide-react';
import { getEmailSubscriptions } from '@/lib/local-storage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { DashboardHeader } from '../_components/dashboard-header';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { 
  getUserDashboardMetrics, 
  updateUserDashboardMetricOrder, 
  deleteUserDashboardMetric
} from '@/lib/user-dashboard-metrics';
import { ShadcnVisualization } from '../_components/visualizations/shadcn-visualization';
import { VisualizationType } from '@/lib/local-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { DashboardHighlightCard } from '../_components/dashboard-highlight-card';

// Interface for user dashboard metrics
interface UserMetric {
  id: string;
  title: string;
  description?: string;
  sqlQuery: string;
  visualizationType: VisualizationType; // Use the imported VisualizationType
  displayOrder: number;
}

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function SortableCard({ id, children, className }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-manipulation",
        isDragging ? "shadow-lg" : "",
        className
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default function MyDashboardPage() {
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);
  const [items, setItems] = useState<UserMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});
  const [runningQueries, setRunningQueries] = useState<Set<string>>(new Set());
  const [deletingMetric, setDeletingMetric] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load the number of active subscriptions and dashboard metrics
  useEffect(() => {
    // Load email subscriptions (from localStorage for now)
    const subscriptions = getEmailSubscriptions();
    const activeCount = subscriptions.filter(sub => sub.active).length;
    setActiveSubscriptionCount(activeCount);
    
    // Load user dashboard metrics from Supabase
    loadUserDashboardMetrics();
  }, []);
  
  async function loadUserDashboardMetrics() {
    try {
      console.log('Loading user dashboard metrics...');
      setLoading(true);
      const userMetrics = await getUserDashboardMetrics();
      console.log(`Loaded ${userMetrics.length} metrics from the dashboard`);
      
      // Convert to local format
      const formattedMetrics = userMetrics.map(metric => ({
        id: metric.id,
        title: metric.title,
        description: metric.description,
        sqlQuery: metric.sqlQuery,
        visualizationType: mapVisualizationType(metric.visualizationType),
        displayOrder: metric.displayOrder
      }));
      
      setItems(formattedMetrics);
      
      // Run all metrics queries automatically
      if (formattedMetrics.length > 0) {
        console.log('Running queries for all metrics...');
        formattedMetrics.forEach(metric => {
          runQuery(metric);
        });
      }
    } catch (error) {
      console.error('Error loading user dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const runQuery = async (metric: UserMetric) => {
    try {
      console.log(`[My Dashboard] Starting query for metric: ${metric.title} (${metric.id})`);
      console.log(`[My Dashboard] SQL query: ${metric.sqlQuery}`);
      setRunningQueries(prev => new Set(prev).add(metric.id));
      
      // Execute query directly via API instead of using the helper function
      console.log(`[My Dashboard] Sending request to API for metric: ${metric.title}`);
      const startTime = performance.now();
      
      const response = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sqlQuery: metric.sqlQuery }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to execute query: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const endTime = performance.now();
      console.log(`[My Dashboard] Query execution time: ${(endTime - startTime).toFixed(2)}ms`);
      
      // Debug the result structure
      console.log(`[My Dashboard] FULL RESULT:`, result);
      console.log(`[My Dashboard] Result keys:`, Object.keys(result));
      
      if (result.results) {
        console.log(`[My Dashboard] Results type:`, typeof result.results);
        console.log(`[My Dashboard] Results structure:`, result.results);
        
        if (typeof result.results === 'object' && result.results.data) {
          console.log(`[My Dashboard] Transformed data detected with ${result.results.data.length} rows`);
        } else if (Array.isArray(result.results)) {
          console.log(`[My Dashboard] Array data detected with ${result.results.length} rows`);
        }
      } else {
        console.log(`[My Dashboard] No results found in response`);
      }
      
      // Store the results - pass the data directly without modification
      setResults(prev => ({
        ...prev,
        [metric.id]: { 
          query: metric.sqlQuery, 
          data: result.results || [],
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log(`[My Dashboard] Query completed and stored for metric: ${metric.title}`, result.results);
    } catch (error) {
      console.error(`[My Dashboard] Failed to run query for metric ${metric.title}:`, error);
    } finally {
      setRunningQueries(prev => {
        const updated = new Set(prev);
        updated.delete(metric.id);
        return updated;
      });
    }
  };
  
  const refreshAllMetrics = () => {
    if (items.length === 0) return;
    
    console.log('Refreshing all metrics...');
    items.forEach(metric => {
      runQuery(metric);
    });
  };
  
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update display orders
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          displayOrder: index
        }));
        
        // Update the database with new order
        updateMetricOrders(updatedItems);
        
        return updatedItems;
      });
    }
  }
  
  async function updateMetricOrders(metrics: UserMetric[]) {
    // Update each metric's order in the database
    for (const metric of metrics) {
      try {
        console.log(`Updating order for metric ${metric.id} to ${metric.displayOrder}`);
        await updateUserDashboardMetricOrder(metric.id, metric.displayOrder);
      } catch (error) {
        console.error(`Failed to update order for metric ${metric.id}:`, error);
      }
    }
  }
  
  async function handleDeleteMetric(id: string, title: string) {
    try {
      setDeletingMetric(id);
      console.log(`Deleting metric: ${id} (${title})`);
      
      const success = await deleteUserDashboardMetric(id);
      
      if (success) {
        // Remove the metric from the UI
        setItems(items.filter(item => item.id !== id));
        toast.success(`"${title}" has been removed from your dashboard`);
      } else {
        toast.error("Failed to remove metric. Please try again.");
      }
    } catch (error) {
      console.error(`Error deleting metric ${id}:`, error);
      toast.error("Failed to remove metric. Please try again.");
    } finally {
      setDeletingMetric(null);
    }
  }
  
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

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="My Dashboard"
        description="Customize your personal dashboard with metrics that matter to you"
        onRefresh={refreshAllMetrics}
        isLoading={runningQueries.size > 0}
        customActions={
          <Sheet>
            <SheetTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    className="md:px-2 md:h-fit relative" 
                    aria-label="Email Subscriptions"
                  >
                    <Bell className="h-4 w-4" />
                    {activeSubscriptionCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        {activeSubscriptionCount}
                      </span>
                    )}
                    <span className="sr-only">Email Subscriptions ({activeSubscriptionCount})</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">Email Subscriptions</TooltipContent>
              </Tooltip>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[400px] md:max-w-[450px] overflow-y-auto">
              <SheetHeader className="flex flex-row items-center justify-between">
                <div>
                  <SheetTitle>Email Subscriptions</SheetTitle>
                  <SheetDescription>
                    Manage your automated email notifications for dashboard metrics
                  </SheetDescription>
                </div>
              </SheetHeader>
              
              <div className="flex justify-end my-4">
                <Button size="sm" onClick={() => setIsAddingSubscription(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Subscription
                </Button>
              </div>
              
              <div className="mt-2">
                <EmailSubscriptionsList 
                  onSubscriptionChange={() => {
                    // Update the count when subscriptions are modified
                    const subscriptions = getEmailSubscriptions();
                    const activeCount = subscriptions.filter(sub => sub.active).length;
                    setActiveSubscriptionCount(activeCount);
                  }}
                  isAddingSubscription={isAddingSubscription}
                  setIsAddingSubscription={setIsAddingSubscription}
                />
              </div>
            </SheetContent>
          </Sheet>
        }
      />
      
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
            <p className="text-muted-foreground">
              View your custom metrics and personalized insights.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Loading dashboard metrics...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex justify-center items-center w-full h-[400px]">
            <div className="border-2 border-dashed border-muted rounded-lg p-12 max-w-2xl w-full flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-6">
                Create metrics to visualize your business data. You can add metrics directly or by asking in the chat.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/chat'}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Metric from Chat
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(item => item.id)}>
              <div className="grid grid-cols-3 gap-4" style={{ gridAutoRows: '200px' }}>
                {items.map((item, index) => {
                  const isChart = item.visualizationType === 'line-chart' || 
                                item.visualizationType === 'bar-chart' || 
                                item.visualizationType === 'table';
                  
                  return (
                    <div 
                      key={item.id} 
                      style={{
                        gridColumn: isChart ? 'span 2' : 'span 1',
                        gridRow: isChart ? 'span 2' : 'span 1',
                      }}
                    >
                      <SortableCard 
                        id={item.id}
                        className="h-full"
                      >
                        <DashboardHighlightCard 
                          id={item.id}
                          title={item.title || 'Custom Metric'}
                          description={item.description || ''}
                          visualizationType={item.visualizationType}
                          isLoading={loading || runningQueries.has(item.id)}
                          data={results[item.id]?.data || []}
                          onRunQuery={() => runQuery(item)}
                          showActions={true}
                          onDelete={() => handleDeleteMetric(item.id, item.title)}
                        />
                      </SortableCard>
                    </div>
                  );
                })}
                
                <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
                  <Card 
                    className="border-2 border-dashed border-muted bg-transparent flex flex-col items-center justify-center p-6 hover:border-primary/40 transition-colors cursor-pointer h-full"
                    onClick={() => window.location.href = '/chat'}
                  >
                    <div className="flex flex-col items-center text-muted-foreground">
                      <h3 className="text-lg font-medium">Add Metric</h3>
                      <p className="text-center text-sm">
                        Create metrics to visualize your business data
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
