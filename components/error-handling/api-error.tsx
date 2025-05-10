'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-ui/motion';

interface ApiErrorProps {
  error: Error | unknown;
  retry?: () => Promise<void>;
  message?: string;
  statusCode?: number;
}

export function ApiError({ error, retry, message, statusCode }: ApiErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const handleRetry = async () => {
    if (!retry) return;
    
    setIsRetrying(true);
    try {
      await retry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };
  
  const getErrorInfo = () => {
    if (statusCode === 401 || statusCode === 403) {
      return {
        title: 'Authentication Error',
        description: 'You don\'t have permission to access this resource.',
        icon: <ServerCrash className="h-6 w-6" />
      };
    } else if (statusCode === 404) {
      return {
        title: 'Not Found',
        description: 'The requested resource could not be found.',
        icon: <FileQuestion className="h-6 w-6" />
      };
    } else if (statusCode && statusCode >= 500) {
      return {
        title: 'Server Error',
        description: 'There was a problem with the server. Please try again later.',
        icon: <ServerCrash className="h-6 w-6" />
      };
    } else if (message?.includes('network') || message?.includes('connection')) {
      return {
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your internet connection.',
        icon: <WifiOff className="h-6 w-6" />
      };
    }
    
    return {
      title: 'Request Failed',
      description: message || 'An unexpected error occurred while processing your request.',
      icon: <AlertTriangle className="h-6 w-6" />
    };
  };
  
  const errorInfo = getErrorInfo();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            {errorInfo.icon}
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{errorInfo.description}</p>
          
          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            className="mt-4"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                {detailsOpen ? 'Hide details' : 'Show details'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 p-2 bg-background border rounded-md overflow-auto text-xs">
                {error instanceof Error 
                  ? error.stack || error.message 
                  : JSON.stringify(error, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
        {retry && (
          <CardFooter>
            <Button 
              variant="outline" 
              className="gap-1.5" 
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
} 