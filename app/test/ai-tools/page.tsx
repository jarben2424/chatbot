'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { testAIDataTools } from '@/lib/ai/test-tools'
import { toast } from 'sonner'
import { BarChart3, Database, Code, RefreshCw } from 'lucide-react'
import { VisualizationDisplay } from '@/components/visualization-display'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIToolsTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('visualize')
  
  const runTests = async () => {
    setIsLoading(true)
    try {
      const toolResults = await testAIDataTools()
      setResults(toolResults)
      
      // Show toast based on results
      if (toolResults.visualizeTool.success && toolResults.queryTool.success) {
        toast.success('All AI tools are functioning correctly')
      } else if (toolResults.visualizeTool.success || toolResults.queryTool.success) {
        toast.warning('Some AI tools are functioning, but others failed')
      } else {
        toast.error('All AI tools failed testing')
      }
    } catch (error) {
      console.error('Test execution error:', error)
      setResults({ error: error instanceof Error ? error.message : String(error) })
      toast.error('Failed to test AI tools')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">AI Tools Integration Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Data Tools</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runTests} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Verifies integration of AI data visualization and query tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="visualize">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visualization Tool
                </TabsTrigger>
                <TabsTrigger value="query">
                  <Database className="h-4 w-4 mr-2" />
                  Query Tool
                </TabsTrigger>
                <TabsTrigger value="raw">
                  <Code className="h-4 w-4 mr-2" />
                  Raw Results
                </TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <TabsContent value="visualize" asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {results?.visualizeTool?.success ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-4 bg-muted/50 border-b">
                          <h3 className="font-medium">Generated Visualization</h3>
                          <p className="text-sm text-muted-foreground">
                            Created via AI visualization tool
                          </p>
                        </div>
                        
                        <div className="p-4">
                          {results.visualizeTool.result.artifactId && (
                            <VisualizationDisplay 
                              visualization={{
                                id: results.visualizeTool.result.artifactId,
                                title: results.visualizeTool.result.title,
                                type: results.visualizeTool.result.visualization,
                                data: results.visualizeTool.result.data || []
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ) : results?.visualizeTool?.error ? (
                      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                        <p className="font-medium">Visualization Tool Error:</p>
                        <p className="font-mono text-xs mt-1">{results.visualizeTool.error}</p>
                      </div>
                    ) : (
                      <div className="p-8 text-center border rounded-lg">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium text-lg">No Test Results Yet</h3>
                        <p className="text-muted-foreground">
                          Run the test to check visualization tool functionality
                        </p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="query" asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {results?.queryTool?.success ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-4 bg-muted/50 border-b">
                          <h3 className="font-medium">Query Tool Results</h3>
                          <p className="text-sm text-muted-foreground">
                            Executed query: {results.queryTool.result.query || 'Test query'}
                          </p>
                        </div>
                        
                        <div className="p-4 overflow-auto">
                          <pre className="text-xs p-4 bg-muted rounded-lg overflow-auto max-h-[300px]">
                            {JSON.stringify(results.queryTool.result.data || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : results?.queryTool?.error ? (
                      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                        <p className="font-medium">Query Tool Error:</p>
                        <p className="font-mono text-xs mt-1">{results.queryTool.error}</p>
                      </div>
                    ) : (
                      <div className="p-8 text-center border rounded-lg">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium text-lg">No Test Results Yet</h3>
                        <p className="text-muted-foreground">
                          Run the test to check query tool functionality
                        </p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="raw" asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-4 bg-muted/50 border-b">
                        <h3 className="font-medium">Raw Test Results</h3>
                      </div>
                      
                      <div className="p-4">
                        <pre className="text-xs p-4 bg-muted rounded-lg overflow-auto max-h-[400px]">
                          {results ? JSON.stringify(results, null, 2) : 'No test results yet'}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 