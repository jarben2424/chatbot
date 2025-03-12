import { AlertTriangle, BarChart, RefreshCw, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface VisualizationErrorProps {
  error: Error;
  reset: () => void;
  type?: 'chart' | 'query' | 'dashboard';
}

export function VisualizationErrorFallback({ error, reset, type = 'chart' }: VisualizationErrorProps) {
  const getErrorDetails = () => {
    if (error.message.includes('data') || error.message.includes('format')) {
      return {
        title: 'Data Format Error',
        description: 'The data format is invalid or incompatible with this visualization type.',
        helpText: 'Try using a different visualization type or restructuring your data.'
      };
    } else if (error.message.includes('render') || error.message.includes('display')) {
      return {
        title: 'Rendering Error',
        description: 'There was an error rendering the visualization.',
        helpText: 'Try refreshing the page or using a different browser.'
      };
    } else if (error.message.includes('load') || error.message.includes('fetch')) {
      return {
        title: 'Data Loading Error',
        description: 'Failed to load the required data for this visualization.',
        helpText: 'Check your network connection and try again.'
      };
    }
    
    return {
      title: 'Visualization Error',
      description: 'An unexpected error occurred while processing this visualization.',
      helpText: 'Please try again or report this issue.'
    };
  };
  
  const details = getErrorDetails();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {details.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {type === 'chart' && <BarChart className="h-16 w-16 text-muted-foreground/50" />}
            {type === 'query' && <FileQuestion className="h-16 w-16 text-muted-foreground/50" />}
            
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">{details.description}</p>
              <p className="text-xs text-muted-foreground">{details.helpText}</p>
            </div>
            
            <div className="text-xs text-muted-foreground/70 bg-background/50 p-2 rounded-md border max-w-full overflow-auto">
              <pre className="whitespace-pre-wrap break-words">
                {error.message}
              </pre>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5" 
            onClick={reset}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
          
          <Link href="/test/visualization" passHref>
            <Button variant="secondary" size="sm">
              Run Diagnostics
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 