'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { testDatabaseConnections } from '@/lib/db/test-connection'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react'

export default function DataIntegrationTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  
  const runTests = async () => {
    setIsLoading(true)
    try {
      const connectionResults = await testDatabaseConnections()
      setResults(connectionResults)
    } catch (error) {
      console.error('Test execution error:', error)
      setResults({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    runTests()
  }, [])
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Data Integration Tests</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Database Connections</CardTitle>
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
              Verifies connections to PostgreSQL and Snowflake databases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">PostgreSQL Connection</p>
                      <p className="text-sm text-muted-foreground">Vercel Postgres</p>
                    </div>
                  </div>
                  {results.postgres?.success ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">Snowflake Connection</p>
                      <p className="text-sm text-muted-foreground">Data Warehouse</p>
                    </div>
                  </div>
                  {results.snowflake?.success ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">Running tests...</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {results?.postgres?.error && (
              <div className="w-full px-3 py-2 text-xs bg-destructive/10 text-destructive rounded">
                <p className="font-medium">PostgreSQL Error:</p>
                <p className="font-mono">{results.postgres.error}</p>
              </div>
            )}
            {results?.snowflake?.error && (
              <div className="w-full mt-2 px-3 py-2 text-xs bg-destructive/10 text-destructive rounded">
                <p className="font-medium">Snowflake Error:</p>
                <p className="font-mono">{results.snowflake.error}</p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 