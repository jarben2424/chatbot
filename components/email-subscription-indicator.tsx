'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

/**
 * Indicator that shows when an email subscription action was performed
 * Displays as a small pill above the message
 */
export function EmailSubscriptionIndicator({ 
  action
}: { 
  action?: string 
}) {
  return (
    <div className="flex items-center mb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs gap-1 flex items-center">
            <Bell size={12} />
            <span>Email Subscription</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-semibold mb-1">Email Subscription Action:</p>
            <p className="text-xs">
              {action || 'Subscription information not available'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
