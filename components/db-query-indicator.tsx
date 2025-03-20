'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

/**
 * Indicator that shows when a database query was executed
 * Displays as a small pill above the message
 */
export function DbQueryIndicator({ 
  query
}: { 
  query?: string 
}) {
  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs gap-1 flex items-center">
            <Database size={12} />
            <span>Database Query</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-semibold mb-1">Executed SQL Query:</p>
            <pre className="text-xs p-2 bg-muted rounded-md overflow-auto max-h-40">
              {query || 'Query information not available'}
            </pre>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
