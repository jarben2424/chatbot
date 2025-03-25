'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { XIcon } from 'lucide-react';

export function CampaignHeader() {
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const router = useRouter();
  
  const handleExit = () => {
    // In a real app, this would redirect without saving
    router.push('/campaigns');
  };
  
  const handleSaveAndExit = () => {
    // In a real app, this would save the current progress
    // before redirecting
    router.push('/campaigns');
  };
  
  return (
    <>
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setExitDialogOpen(true)}
          className="h-9 w-9"
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </header>

      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exit Campaign Creation?</DialogTitle>
            <DialogDescription>
              Your progress in creating this campaign hasn't been saved. Would you like to save your progress before exiting?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleExit}>
              Exit without saving
            </Button>
            <Button onClick={handleSaveAndExit} className="gap-1 bg-[#5640E8] hover:bg-[#5640E8]/90 text-white">
              Save & Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
