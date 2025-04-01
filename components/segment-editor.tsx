'use client';

import React, { memo, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { LoaderIcon, PlusIcon, XCircleIcon, InfoIcon, SettingsIcon } from './icons';

type SegmentEditorProps = {
  content: string;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  status: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
};

// Define the shape of a customer segment
interface CustomerSegment {
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  createdAt?: string;
  lastModified?: string;
  estimatedSize?: number;
}

interface SegmentCriteria {
  field: string;
  operator: string;
  value: string | number;
  id: string; // Unique identifier for each criteria
  logic?: 'and' | 'or'; // Logic operator to connect with next criteria
}

const availableFields = [
  { id: 'purchase_amount', name: 'Purchase Amount', type: 'number' },
  { id: 'purchase_frequency', name: 'Purchase Frequency', type: 'number' },
  { id: 'last_purchase_date', name: 'Last Purchase Date', type: 'date' },
  { id: 'customer_since', name: 'Customer Since', type: 'date' },
  { id: 'location', name: 'Location', type: 'string' },
  { id: 'age', name: 'Age', type: 'number' },
  { id: 'gender', name: 'Gender', type: 'string' },
  { id: 'product_category', name: 'Product Category', type: 'string' }
];

const operatorsByType = {
  number: ['equals', 'greater_than', 'less_than', 'between'],
  string: ['equals', 'contains', 'starts_with', 'ends_with'],
  date: ['before', 'after', 'between']
};

const PureSegmentEditor = ({
  content,
  saveContent,
  status,
  isCurrentVersion,
}: SegmentEditorProps) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('builder');
  
  // Generate a unique ID for criteria
  const generateId = () => Math.random().toString(36).substring(2, 9);
  
  // Parse existing segment from content or create a new one
  const [segment, setSegment] = useState<CustomerSegment>(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content);
        // Ensure each criteria has an ID (for backward compatibility)
        if (parsed.criteria && Array.isArray(parsed.criteria)) {
          parsed.criteria = parsed.criteria.map((c: any) => ({
            ...c,
            id: c.id || generateId(),
            logic: c.logic || 'and' as 'and'
          }));
        }
        // Add timestamp if not present
        if (!parsed.createdAt) {
          parsed.createdAt = new Date().toISOString();
        }
        parsed.lastModified = new Date().toISOString();
        return parsed;
      } catch (e) {
        console.error('Error parsing segment content:', e);
      }
    }
    const now = new Date().toISOString();
    return {
      name: 'New Segment',
      description: 'Define criteria for this customer segment',
      criteria: [
        { field: 'purchase_amount', operator: 'greater_than', value: 100, id: generateId(), logic: 'and' }
      ],
      createdAt: now,
      lastModified: now,
      estimatedSize: 0
    };
  });

  // Save segment changes
  useEffect(() => {
    if (isCurrentVersion) {
      const stringified = JSON.stringify(segment, null, 2);
      saveContent(stringified, true);
    }
  }, [segment, saveContent, isCurrentVersion]);

  // Handle changes to the segment name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSegment(prev => ({ ...prev, name: e.target.value }));
  };

  // Handle changes to the segment description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSegment(prev => ({ ...prev, description: e.target.value }));
  };

  // Calculate estimated audience size based on criteria complexity
  const calculateEstimatedSize = (criteria: SegmentCriteria[]) => {
    // This is a mock algorithm - in a real app this would call an API
    const basePotential = 50000;
    let estimatedSize = basePotential;
    
    // Reduce audience size with each criteria
    criteria.forEach((c, index) => {
      const fieldFactor = index === 0 ? 0.8 : 0.6; // First criteria has less impact
      const operatorFactor = c.operator.includes('equal') ? 0.5 : 
                            c.operator.includes('greater') ? 0.7 : 
                            c.operator.includes('less') ? 0.65 : 0.8;
      
      estimatedSize *= (fieldFactor * operatorFactor);
    });
    
    // Return an integer with some randomization for realism
    return Math.floor(estimatedSize * (0.9 + Math.random() * 0.2));
  };
  
  // Add a new criteria to the segment
  const addCriteria = () => {
    setSegment(prev => {
      const newCriteria = [
        ...prev.criteria,
        { 
          field: 'purchase_amount', 
          operator: 'greater_than', 
          value: 0, 
          id: generateId(),
          logic: 'and' as 'and'
        }
      ];
      
      return {
        ...prev,
        criteria: newCriteria,
        lastModified: new Date().toISOString(),
        estimatedSize: calculateEstimatedSize(newCriteria)
      };
    });
  };

  // Remove a criteria from the segment
  const removeCriteria = (criteriaId: string) => {
    setSegment(prev => {
      const newCriteria = prev.criteria.filter(c => c.id !== criteriaId);
      return {
        ...prev,
        criteria: newCriteria,
        lastModified: new Date().toISOString(),
        estimatedSize: calculateEstimatedSize(newCriteria)
      };
    });
  };

  // Update a specific criteria field
  const updateCriteria = (criteriaId: string, field: string, value: any) => {
    setSegment(prev => {
      const newCriteria = [...prev.criteria];
      const criteriaIndex = newCriteria.findIndex(c => c.id === criteriaId);
      
      if (criteriaIndex === -1) return prev;
      
      newCriteria[criteriaIndex] = { ...newCriteria[criteriaIndex], [field]: value };
      
      // If field type changed, set a default operator for that type
      if (field === 'field') {
        const fieldDef = availableFields.find(f => f.id === value);
        if (fieldDef) {
          const type = fieldDef.type as keyof typeof operatorsByType;
          newCriteria[criteriaIndex].operator = operatorsByType[type][0];
          
          // Set default value based on type
          newCriteria[criteriaIndex].value = type === 'number' ? 0 : 
                                    type === 'date' ? new Date().toISOString().split('T')[0] : '';
        }
      }
      
      return { 
        ...prev, 
        criteria: newCriteria,
        lastModified: new Date().toISOString(),
        estimatedSize: calculateEstimatedSize(newCriteria)
      };
    });
  };
  
  // Update the logic operator between criteria
  const updateLogicOperator = (criteriaId: string, logic: 'and' | 'or') => {
    setSegment(prev => {
      const newCriteria = prev.criteria.map(c => 
        c.id === criteriaId ? { ...c, logic } : c
      );
      
      return { 
        ...prev, 
        criteria: newCriteria,
        lastModified: new Date().toISOString()
      };
    });
  };
  
  // Move a criteria up or down in the list
  const reorderCriteria = (criteriaId: string, direction: 'up' | 'down') => {
    setSegment(prev => {
      const index = prev.criteria.findIndex(c => c.id === criteriaId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(prev.criteria.length - 1, index + 1);
      if (newIndex === index) return prev;
      
      const newCriteria = [...prev.criteria];
      const [movedItem] = newCriteria.splice(index, 1);
      newCriteria.splice(newIndex, 0, movedItem);
      
      return { 
        ...prev, 
        criteria: newCriteria,
        lastModified: new Date().toISOString()
      };
    });
  };

  // Get available operators for a field
  const getOperatorsForField = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (!field) return operatorsByType.string;
    return operatorsByType[field.type as keyof typeof operatorsByType];
  };

  // Generate a human-readable preview of the segment
  const generatePreview = () => {
    return `Customers who match the following criteria:
${segment.criteria.map((c, i) => {
  const field = availableFields.find(f => f.id === c.field)?.name || c.field;
  const operator = c.operator.replace(/_/g, ' ');
  return `${i+1}. ${field} ${operator} ${c.value}`;
}).join('\n')}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1 flex items-center">
              <Badge variant="outline" className="mr-2 px-2 py-0 h-6 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                <span className="mr-1">✨</span> Builder
              </Badge>
              Customer Segment Builder
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define criteria to target specific customer groups
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {segment.lastModified && (
              <div className="text-right">
                <div>Last modified: {new Date(segment.lastModified).toLocaleString()}</div>
                {segment.createdAt && <div>Created: {new Date(segment.createdAt).toLocaleString()}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="builder" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-2">
            <TabsList className="mb-2">
              <TabsTrigger value="builder" className="relative px-4 py-2">
                Builder
                {segment.criteria.length > 0 && (
                  <Badge className="ml-2 bg-blue-500 text-white hover:bg-blue-500 absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {segment.criteria.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preview" className="px-4 py-2">Preview</TabsTrigger>
            </TabsList>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="max-w-xs">Build segments by adding criteria to filter your customer base. Add multiple criteria to narrow down your target audience.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TabsContent value="builder" className="space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-md font-medium">Segment Details</CardTitle>
                <CardDescription>Name and describe your customer segment</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="segmentName" className="text-xs font-medium mb-1.5 block">Segment Name</Label>
                    <Input 
                      id="segmentName" 
                      value={segment.name} 
                      onChange={handleNameChange} 
                      placeholder="High-Value Customers"
                      className="h-9 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="segmentDescription" className="text-xs font-medium mb-1.5 block">Description</Label>
                    <Input 
                      id="segmentDescription" 
                      value={segment.description} 
                      onChange={handleDescriptionChange} 
                      placeholder="Customers who spent over $1000 last year"
                      className="h-9 border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-md font-medium">Segment Criteria</CardTitle>
                  <CardDescription>Define rules to filter your customer base</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={addCriteria} 
                        size="sm" 
                        className="h-9 px-3 bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />Add Criteria
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Add another criteria to refine your segment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {segment.criteria.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-md">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">No criteria defined yet</p>
                    <Button 
                      onClick={addCriteria} 
                      size="sm" 
                      variant="outline" 
                      className="h-9"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />Add Your First Criteria
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {segment.criteria.map((criteria, index) => (
                      <div key={criteria.id} className="relative">
                        {index > 0 && (
                          <div className="absolute -top-3 left-6 bg-white dark:bg-slate-950 px-2 z-10">
                            <Select 
                              value={criteria.logic || 'and'} 
                              onValueChange={(value) => updateLogicOperator(criteria.id, value as 'and' | 'or')}
                            >
                              <SelectTrigger className="h-6 w-20 text-xs bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="and">AND</SelectItem>
                                <SelectItem value="or">OR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center">
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2 bg-slate-100 dark:bg-slate-800 text-xs font-normal">
                                #{index + 1}
                              </Badge>
                              <h4 className="text-sm font-medium">Criteria</h4>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => reorderCriteria(criteria.id, 'up')}
                                      disabled={index === 0}
                                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                                    >
                                      ↑
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>Move criteria up</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => reorderCriteria(criteria.id, 'down')}
                                      disabled={index === segment.criteria.length - 1}
                                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                                    >
                                      ↓
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>Move criteria down</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => removeCriteria(criteria.id)}
                                      disabled={segment.criteria.length === 1}
                                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                                    >
                                      <XCircleIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>Remove criteria</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          
                          <div className="p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Field</Label>
                                <Select 
                                  value={criteria.field} 
                                  onValueChange={(value) => updateCriteria(criteria.id, 'field', value)}
                                >
                                  <SelectTrigger className="h-9 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableFields.map(field => (
                                      <SelectItem key={field.id} value={field.id}>
                                        {field.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Operator</Label>
                                <Select 
                                  value={criteria.operator} 
                                  onValueChange={(value) => updateCriteria(criteria.id, 'operator', value)}
                                >
                                  <SelectTrigger className="h-9 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select operator" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getOperatorsForField(criteria.field).map(op => (
                                      <SelectItem key={op} value={op}>
                                        {op.replace(/_/g, ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label className="text-xs font-medium mb-1 block">Value</Label>
                                <Input 
                                  type={availableFields.find(f => f.id === criteria.field)?.type === 'number' ? 'number' : 'text'}
                                  value={criteria.value} 
                                  onChange={(e) => updateCriteria(criteria.id, 'value', e.target.value)}
                                  className="h-9 border-slate-200 dark:border-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-md font-medium">{segment.name}</CardTitle>
                <CardDescription>{segment.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-medium mb-3">Segment Definition</h4>
                  <div className="space-y-2">
                    {segment.criteria.map((criteria, index) => {
                      const field = availableFields.find(f => f.id === criteria.field)?.name || criteria.field;
                      const operator = criteria.operator.replace(/_/g, ' ');
                      const fieldType = availableFields.find(f => f.id === criteria.field)?.type || 'string';
                      
                      let badgeColor = '';
                      if (fieldType === 'number') badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                      if (fieldType === 'string') badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
                      if (fieldType === 'date') badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
                      
                      return (
                        <div key={criteria.id} className="flex items-center">
                          {index > 0 && (
                            <div className="text-xs font-bold mr-2 text-slate-500 w-8">
                              {criteria.logic?.toUpperCase() || 'AND'}
                            </div>
                          )}
                          {index === 0 && <div className="w-8"></div>}
                          <div className="flex-1 flex items-center bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                            <Badge variant="outline" className={`mr-2 ${badgeColor}`}>{field}</Badge>
                            <span className="text-sm font-medium mr-2">{operator}</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {criteria.value}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-md font-medium">Estimated Audience Size</CardTitle>
                  <CardDescription>Based on your current segment criteria</CardDescription>
                </CardHeader>
                <CardContent className="p-4 text-center">
                  <div className="mb-4">
                    <Progress value={Math.min(100, (segment.estimatedSize || 0) / 500)} className="h-2 mb-1" />
                    <p className="text-3xl font-bold my-2 text-blue-600 dark:text-blue-400">
                      {segment.estimatedSize ? segment.estimatedSize.toLocaleString() : "0"} customers
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {segment.criteria.length > 0 
                        ? `Based on ${segment.criteria.length} criteria applied to your customer base`
                        : "Add criteria to estimate your audience size"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-md font-medium">Segment Details</CardTitle>
                  <CardDescription>Technical information about your segment</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Name:</span>
                      <span className="font-medium">{segment.name}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Criteria count:</span>
                      <span className="font-medium">{segment.criteria.length}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Created:</span>
                      <span>{segment.createdAt ? new Date(segment.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Last modified:</span>
                      <span>{segment.lastModified ? new Date(segment.lastModified).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Memoization optimization
function areEqual(prevProps: SegmentEditorProps, nextProps: SegmentEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

const SegmentEditorWithMemo = memo(PureSegmentEditor, areEqual);

// Dynamically import the component to prevent hydration issues
export const SegmentEditor = dynamic(() => Promise.resolve(SegmentEditorWithMemo), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="flex flex-col items-center gap-2">
        <LoaderIcon size={24} />
        <span className="text-sm text-gray-500">Loading segment editor...</span>
      </div>
    </div>
  ),
});
