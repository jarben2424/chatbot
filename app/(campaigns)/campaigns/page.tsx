'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarIcon, ChevronRightIcon, MoreHorizontalIcon, PlusCircleIcon, TagIcon, UserIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignHeader } from '../_components/campaign-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Campaign type definition from our schema
type Campaign = {
  id: string;
  name: string;
  campaignType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  audienceSize?: number;
  matchCount?: number;
  integrationType?: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }).format(date);
  };

  // Fetch campaigns function (extracted for reuse after deletion)
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/campaigns');
      
      if (!res.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Could not load campaigns. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch campaigns from API
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Handle campaign deletion
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/campaigns?id=${campaignToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
      
      // Show success message
      toast.success('Campaign deleted successfully');
      
      // Remove the deleted campaign from state
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignToDelete.id));
      
      // Close the dialog
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get the appropriate UI for campaign type
  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case 'personalized-segment':
        return 'Personalized Offers';
      case 'recurring-engagement':
        return 'Recurring Engagement';
      case 'welcome-series':
        return 'Welcome Series';
      case 'win-back':
        return 'Win-back Campaign';
      default:
        return type;
    }
  };

  // Status badge with appropriate styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-[#5640E8]">
            Active
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="default" className="bg-green-500">
            Ready
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">Draft</Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary">Completed</Badge>
        );
      default:
        return null;
    }
  };

  // Display a loading skeleton while loading
  const renderSkeleton = () => (
    <div className="w-full">
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );

  // Display an empty state when no campaigns are available
  const renderEmptyState = () => (
    <div className="text-center py-10 border rounded-lg bg-card">
      <p className="text-muted-foreground mb-4">No campaigns yet</p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/campaigns/create">Create your first campaign</Link>
      </Button>
    </div>
  );

  // Display campaign table
  const renderCampaignTable = (filteredCampaigns: Campaign[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Integration</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCampaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No campaigns found.
              </TableCell>
            </TableRow>
          ) : (
            // Sort campaigns by status: ready first, then active, then draft, then completed
            filteredCampaigns
              .sort((a, b) => {
                const statusOrder = { ready: 0, active: 1, draft: 2, completed: 3 };
                return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
              })
              .map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">
                  <span className="line-clamp-1">{campaign.name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal flex items-center gap-1 w-fit">
                    <TagIcon className="h-3 w-3" /> 
                    {getCampaignTypeLabel(campaign.campaignType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {renderStatusBadge(campaign.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" /> 
                    {formatDate(campaign.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  {campaign.audienceSize ? (
                    <div className="flex items-center gap-1 text-sm">
                      <UserIcon className="h-3 w-3" /> 
                      {campaign.audienceSize.toLocaleString()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {campaign.integrationType ? (
                    <span className="text-sm">{campaign.integrationType === 'klaviyo' ? 'Klaviyo' : 'Export'}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/campaigns/${campaign.id}`}>
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setCampaignToDelete(campaign)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <CampaignHeader />
        <div className="flex-1 flex flex-col space-y-6 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <Button asChild className="bg-[#5640E8] hover:bg-[#5640E8]/90 text-white gap-1">
              <Link href="/campaigns/create">
                <PlusCircleIcon className="h-4 w-4" /> New Campaign
              </Link>
            </Button>
          </div>
          
          <div className="space-y-8">
            {isLoading ? (
              renderSkeleton()
            ) : error ? (
              <div className="p-6 border rounded-lg bg-card">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-destructive mb-2">Error loading campaigns</p>
                  <p className="text-muted-foreground mb-4 text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              renderEmptyState()
            ) : (
              renderCampaignTable(campaigns)
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaignToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCampaign();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
