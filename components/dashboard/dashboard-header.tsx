'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { useState } from 'react';
import { IconArrowLeft, IconPlus, IconBarChart } from '@/components/ui/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DashboardHeader() {
  const { collapsed } = useSidebar();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  
  return (
    <div className="flex items-center justify-between py-4 md:py-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Dashboards</h1>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/chat">
            <IconPlus className="mr-2 h-4 w-4" />
            Create with AI
          </Link>
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconBarChart className="mr-2 h-4 w-4" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new dashboard</DialogTitle>
            </DialogHeader>
            {/* Dialog content here */}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function DashboardDetailHeader({ id }: { id: string }) {
  return (
    <div className="flex items-center justify-between py-4 md:py-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/dashboard">
            <IconArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboards
          </Link>
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/chat">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Visualization with AI
          </Link>
        </Button>
      </div>
    </div>
  );
} 