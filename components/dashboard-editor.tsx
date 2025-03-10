'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PlusIcon, ShareIcon, MailIcon, GripVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Metric {
  id: string;
  name: string;
  value: string | number;
  change?: string;
  type: 'number' | 'currency' | 'percentage';
  size: 'small' | 'medium' | 'large';
}

interface DashboardData {
  id: string;
  title: string;
  description: string;
  metrics: Metric[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    time: string;
  };
}

export function DashboardEditor({ 
  initialData,
  onSave,
  readOnly = false 
}: { 
  initialData: DashboardData;
  onSave: (data: DashboardData) => void;
  readOnly?: boolean;
}) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const metrics = Array.from(data.metrics);
    const [reorderedItem] = metrics.splice(result.source.index, 1);
    metrics.splice(result.destination.index, 0, reorderedItem);

    setData({ ...data, metrics });
  };

  const addMetric = (metric: Metric) => {
    setData({
      ...data,
      metrics: [...data.metrics, metric]
    });
    setIsAddingMetric(false);
  };

  const updateMetric = (id: string, updates: Partial<Metric>) => {
    setData({
      ...data,
      metrics: data.metrics.map(m => 
        m.id === id ? { ...m, ...updates } : m
      )
    });
  };

  const deleteMetric = (id: string) => {
    setData({
      ...data,
      metrics: data.metrics.filter(m => m.id !== id)
    });
  };

  const updateSchedule = (schedule: DashboardData['schedule']) => {
    setData({
      ...data,
      schedule
    });
    setIsScheduling(false);
  };

  return (
    <div className="w-full max-w-4xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Input
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="text-2xl font-bold mb-2"
            readOnly={readOnly}
          />
          <Input
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="text-gray-500"
            readOnly={readOnly}
          />
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Sheet open={isScheduling} onOpenChange={setIsScheduling}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <MailIcon className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </SheetTrigger>
              <SheetContent>
                <ScheduleEditor
                  schedule={data.schedule}
                  onSave={updateSchedule}
                />
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm">
              <ShareIcon className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={() => onSave(data)}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="metrics">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {data.metrics.map((metric, index) => (
                <Draggable
                  key={metric.id}
                  draggableId={metric.id}
                  index={index}
                  isDragDisabled={readOnly}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <MetricCard
                        metric={metric}
                        onUpdate={(updates) => updateMetric(metric.id, updates)}
                        onDelete={() => deleteMetric(metric.id)}
                        dragHandle={provided.dragHandleProps}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!readOnly && (
        <Sheet open={isAddingMetric} onOpenChange={setIsAddingMetric}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
          </SheetTrigger>
          <SheetContent>
            <MetricEditor onSave={addMetric} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// Continue with MetricCard, MetricEditor, and ScheduleEditor components... 