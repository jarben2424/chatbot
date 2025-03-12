'use client';

import { useState, useEffect } from 'react';
import { DashboardQueriesList } from '@/app/dashboards/_components/dashboard-queries-list';
import { EmailSubscriptionsList } from '@/app/dashboards/_components/email-subscriptions-list';
import { Button } from '@/components/ui/button';
import { Bell, PlusCircle, BarChart, LineChart } from 'lucide-react';
import { getEmailSubscriptions, LocalDashboardQuery, getLocalDashboardQueries } from '@/lib/local-storage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        "rounded-lg cursor-grab touch-manipulation",
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
  const [items, setItems] = useState<LocalDashboardQuery[]>([]);
  const [orderMap, setOrderMap] = useState<Record<string, number>>({});
  
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

  // Load the number of active subscriptions and dashboard queries
  useEffect(() => {
    const subscriptions = getEmailSubscriptions();
    const activeCount = subscriptions.filter(sub => sub.active).length;
    setActiveSubscriptionCount(activeCount);
    
    const dashboardQueries = getLocalDashboardQueries();
    setItems(dashboardQueries);
    
    // Initialize order map from localStorage or create a new one
    const savedOrderMap = localStorage.getItem('dashboard_order');
    if (savedOrderMap) {
      try {
        setOrderMap(JSON.parse(savedOrderMap));
      } catch (e) {
        console.error("Failed to parse saved dashboard order", e);
        createInitialOrderMap(dashboardQueries);
      }
    } else {
      createInitialOrderMap(dashboardQueries);
    }
  }, []);
  
  function createInitialOrderMap(queries: LocalDashboardQuery[]) {
    const newOrderMap: Record<string, number> = {};
    queries.forEach((query, index) => {
      newOrderMap[query.id] = index;
    });
    setOrderMap(newOrderMap);
    localStorage.setItem('dashboard_order', JSON.stringify(newOrderMap));
  }
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order map
        const newOrderMap: Record<string, number> = {};
        newItems.forEach((item, index) => {
          newOrderMap[item.id] = index;
        });
        
        setOrderMap(newOrderMap);
        localStorage.setItem('dashboard_order', JSON.stringify(newOrderMap));
        
        return newItems;
      });
    }
  }
  
  // Sort items based on the order map
  const sortedItems = [...items].sort((a, b) => {
    const orderA = orderMap[a.id] !== undefined ? orderMap[a.id] : 999;
    const orderB = orderMap[b.id] !== undefined ? orderMap[b.id] : 999;
    return orderA - orderB;
  });

  return (
    <div className="flex flex-col p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Email Subscriptions">
              <Bell className="h-5 w-5" />
              {activeSubscriptionCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {activeSubscriptionCount}
                </span>
              )}
              <span className="sr-only">Email Subscriptions ({activeSubscriptionCount})</span>
            </Button>
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
      </div>
      
      {items.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AddMetricCard />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedItems.map(item => item.id)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {sortedItems.map((item) => (
                <SortableCard key={item.id} id={item.id}>
                  <div className="h-full">
                    <Card className="h-full">
                      <CardHeader className="handle cursor-grab bg-accent/30 pb-2">
                        <CardTitle className="text-sm font-medium truncate">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* This content will be populated by DashboardQueriesList */}
                      </CardContent>
                    </Card>
                  </div>
                </SortableCard>
              ))}
              <AddMetricCard />
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      <div className="hidden">
        <DashboardQueriesList />
      </div>
    </div>
  );
}

function AddMetricCard() {
  return (
    <Card className="border-2 border-dashed border-primary/20 bg-transparent h-64 flex flex-col items-center justify-center p-6 hover:border-primary/40 transition-colors cursor-pointer">
      <div className="flex flex-col items-center text-muted-foreground">
        <div className="flex space-x-2 mb-3">
          <BarChart className="h-10 w-10 opacity-80" />
          <LineChart className="h-10 w-10 opacity-80" />
        </div>
        <h3 className="text-lg font-medium mb-2">Add Metric</h3>
        <p className="text-center text-sm">
          Drag and drop metrics from your business data queries to build your dashboard
        </p>
        <Button variant="outline" className="mt-4" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Metric
        </Button>
      </div>
    </Card>
  );
}
