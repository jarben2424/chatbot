'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { testAIVisualization } from '@/lib/testing/ai-visualization-test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestVisualizationPage() {
  const [query, setQuery] = useState('Create a bar chart showing revenue by month');
  const [testResults, setTestResults] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('visualization');
  
  const handleRunTest = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      const AI = await testAIVisualization(query);
      const response = await AI.submitUserMessage(query);
      setTestResults(response.ui);
    } catch (error) {
      setTestResults(
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="font-medium">❌ Test Failed with Error</p>
          <p className="text-red-600">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const exampleQueries = {
    visualization: [
      'Create a bar chart showing revenue by month',
      'Generate a line graph of profit trends',
      'Make a pie chart showing revenue distribution by category',
      'Visualize quarterly sales with appropriate chart type'
    ],
    query: [
      'Query the top 10 customers by revenue',
      'Execute SQL to find product sales by category',
      'Get data on monthly profits for the last year',
      'Run a query to analyze customer segments'
    ]
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI Visualization Testing Tool</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="visualization">Visualization Tests</TabsTrigger>
          <TabsTrigger value="query">Query Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Visualization Generation</CardTitle>
              <CardDescription>
                Test the AI's ability to generate visualizations from data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="visualization-query">Test Query</Label>
                  <Input 
                    id="visualization-query"
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Enter a visualization request" 
                  />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Example queries:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.visualization.map((example, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm"
                        onClick={() => setQuery(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRunTest} disabled={isLoading}>
                {isLoading ? 'Running Test...' : 'Run Test'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="query" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Data Queries</CardTitle>
              <CardDescription>
                Test the AI's ability to query and process data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="query-input">Test Query</Label>
                  <Input 
                    id="query-input"
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Enter a data query request" 
                  />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Example queries:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.query.map((example, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm"
                        onClick={() => setQuery(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRunTest} disabled={isLoading}>
                {isLoading ? 'Running Test...' : 'Run Test'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {testResults && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="border rounded-lg overflow-hidden">
            {testResults}
          </div>
        </div>
      )}
    </div>
  );
} 