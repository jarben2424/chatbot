'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { XIcon } from 'lucide-react';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { useReportState } from '../_context/report-context';
import { toast } from 'sonner';

// Check if report context is available
function useOptionalReportState() {
  try {
    return {
      hasContext: true,
      ...useReportState()
    };
  } catch (error) {
    // Return default values if context isn't available
    return {
      hasContext: false,
      reportState: {},
      saveReport: async () => {},
      isDirty: false,
      setIsDirty: () => {}
    };
  }
}

// Directly define the toast interface we need
interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simplified toast hook for our needs
function useToast() {
  return {
    toast: (props: ToastProps) => {
      console.log('Toast:', props);
      // In a real implementation, this would show a toast notification
    }
  };
}

// Temporary report context interface
interface ReportState {
  id?: string;
  title: string;
  type: string;
  isActive: boolean;
  // Other fields omitted for brevity
}

export function ReportHeader() {
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { hasContext, reportState, saveReport, isDirty } = useOptionalReportState();
  const { toast } = useToast();
  
  const isCreationFlow = pathname?.includes('/reports/create') || pathname?.includes('/reports/edit');
  
  const handleExit = () => {
    // Exit without saving
    router.push('/reports');
  };
  
  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      await saveReport();
      toast({
        title: "Report saved",
        description: "Your progress has been saved successfully.",
      });
      router.push('/reports');
    } catch (error) {
      toast({
        title: "Error saving report",
        description: "There was a problem saving your report progress.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <>
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        {isCreationFlow ? (
          // X button for report creation flow
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setExitDialogOpen(true)}
            className="h-9 w-9 border border-border rounded-md"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        ) : (
          // Sidebar toggle for regular reports page, using the same component as chat header
          <SidebarToggle />
        )}
      </header>

      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exit Report Creation?</DialogTitle>
            <DialogDescription>
              Your progress in creating this report hasn't been saved. Would you like to save your progress before exiting?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleExit}>
              Exit without saving
            </Button>
            <Button 
              onClick={handleSaveAndExit} 
              className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save & Exit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
