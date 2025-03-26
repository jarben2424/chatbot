'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  TagIcon, 
  UserIcon,
  CheckCircleIcon,
  PencilIcon,
  BarChart3Icon,
  ExternalLinkIcon,
  SendIcon,
  Trash2Icon,
  ArrowDownIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignHeader } from '../../_components/campaign-header';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Campaign type definition
type Campaign = {
  id: string;
  userId: string;
  name: string;
  campaignType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  selectedOfferIds: string[];
  useAiSegment: boolean;
  selectedSegmentId?: string;
  aiSegmentPrompt?: string;
  audienceSize?: number;
  matchCount?: number;
  integrationType?: string;
  integrationSettings?: any;
  matchingComplete?: boolean;
  // Added from API formatting
  segments?: Array<{
    id: string;
    name: string;
    customerCount: number;
  }>;
  offers?: Array<{
    id: string;
    name: string;
    description: string;
    discount?: string;
  }>;
};

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
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

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/campaigns?id=${campaignId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch campaign details');
        }
        
        const data = await res.json();
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign details:', err);
        setError('Could not load campaign details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCampaignDetails();
  }, [campaignId]);

  // Handle campaign deletion
  const handleDeleteCampaign = async () => {
    if (!campaign) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/campaigns?id=${campaign.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
      
      // Show success message and redirect
      toast.success('Campaign deleted successfully');
      router.push('/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
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

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-[300px] w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[150px]" />
        <Skeleton className="h-[150px]" />
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
      <p className="text-destructive mb-2">Error loading campaign</p>
      <p className="text-muted-foreground mb-4 text-sm">{error}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Try again
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <CampaignHeader />
        <div className="flex-1 flex flex-col p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1" 
              asChild
            >
              <Link href="/campaigns">
                <ArrowLeftIcon className="h-4 w-4" /> Back to campaigns
              </Link>
            </Button>
            
            <div className="flex gap-2">
              {campaign?.status === 'ready' && (
                <>
                  <Button 
                    className="gap-1 bg-[#5640E8] hover:bg-[#5640E8]/90 text-white"
                    onClick={() => toast.info("Klaviyo integration coming soon")}
                  >
                    <ExternalLinkIcon className="h-4 w-4" /> Sync to Klaviyo
                  </Button>
                  <Button 
                    variant="outline"
                    className="gap-1"
                    onClick={() => toast.info("Export functionality coming soon")}
                  >
                    <ArrowDownIcon className="h-4 w-4" /> Export
                  </Button>
                </>
              )}
              <Button 
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            renderSkeleton()
          ) : error ? (
            renderError()
          ) : campaign ? (
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">{campaign.name}</h1>
                  {renderStatusBadge(campaign.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    <span>{getCampaignTypeLabel(campaign.campaignType)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Created {formatDate(campaign.createdAt)}</span>
                  </div>
                  {campaign.updatedAt && campaign.updatedAt !== campaign.createdAt && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>Updated {formatDate(campaign.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="audience">Audience</TabsTrigger>
                  <TabsTrigger value="offers">Offers</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Audience</CardTitle>
                        <CardDescription>Targeted customers for this campaign</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 font-medium">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{campaign.audienceSize?.toLocaleString() || 0} customers</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {campaign.segments?.length 
                                ? `${campaign.segments.length} segments`
                                : 'No segments defined'
                              }
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link href={`/campaigns/${campaign.id}/audience`}>
                              View <ChevronRightIcon className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Offers</CardTitle>
                        <CardDescription>Personalized offers in this campaign</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 font-medium">
                              <TagIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{campaign.offers?.length || 0} offers</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {campaign.offers?.length 
                                ? `${campaign.matchCount || 0} customer-offer matches`
                                : 'No offers defined'
                              }
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link href={`/campaigns/${campaign.id}/offers`}>
                              View <ChevronRightIcon className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Status</CardTitle>
                        <CardDescription>Current campaign status</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{campaign.status === 'draft' ? 'Setup progress' : 'Campaign progress'}</span>
                            <span>
                              {campaign.status === 'draft' ? '75%' : 
                               campaign.status === 'active' ? '45%' : '100%'}
                            </span>
                          </div>
                          <Progress 
                            value={campaign.status === 'draft' ? 75 : 
                                  campaign.status === 'active' ? 45 : 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="space-y-2 pt-2">
                          {campaign.status === 'draft' || campaign.status === 'ready' ? (
                            <>
                              <div className="flex items-start gap-3">
                                <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-primary text-white">
                                  <CheckCircleIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Campaign setup</p>
                                  <p className="text-xs text-muted-foreground">Basic campaign information completed</p>
                                </div>
                              </div>

                              {campaign.offers?.length ? (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-primary text-white">
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Offers defined</p>
                                    <p className="text-xs text-muted-foreground">{campaign.offers.length} offers ready for customers</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-muted">
                                    <span className="text-xs">2</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Define offers</p>
                                    <p className="text-xs text-muted-foreground">Add offers to include in your campaign</p>
                                  </div>
                                </div>
                              )}

                              {campaign.segments?.length || campaign.audienceSize ? (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-primary text-white">
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Audience defined</p>
                                    <p className="text-xs text-muted-foreground">{campaign.audienceSize?.toLocaleString() || 0} customers in your target audience</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-muted">
                                    <span className="text-xs">3</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Define audience</p>
                                    <p className="text-xs text-muted-foreground">Select which customer segments to target</p>
                                  </div>
                                </div>
                              )}

                              {campaign.status === 'draft' ? (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-muted">
                                    <span className="text-xs">4</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Complete matching</p>
                                    <p className="text-xs text-muted-foreground">
                                      {campaign.matchingComplete ? 'Matching complete' : 'Match customers with offers'}
                                    </p>
                                  </div>
                                </div>
                              ) : campaign.status === 'ready' && (
                                <div className="flex items-start gap-3">
                                  <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-primary text-white">
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Matching complete</p>
                                    <p className="text-xs text-muted-foreground">
                                      {campaign.matchCount?.toLocaleString() || 0} customer-offer matches created
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : campaign.status === 'active' && (
                            <div className="flex items-start gap-3">
                              <div className="rounded-full flex items-center justify-center h-5 w-5 flex-shrink-0 mt-0.5 bg-primary text-white">
                                <CheckCircleIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Campaign active</p>
                                <p className="text-xs text-muted-foreground">Running since {formatDate(campaign.updatedAt)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {campaign.status === 'ready' && (
                        <CardFooter className="flex justify-end pt-0">
                          <div className="flex gap-2">
                            <Button 
                              className="gap-1 bg-[#5640E8] hover:bg-[#5640E8]/90 text-white"
                              onClick={() => toast.info("Klaviyo integration coming soon")}
                            >
                              <ExternalLinkIcon className="h-4 w-4" /> Sync to Klaviyo
                            </Button>
                            <Button 
                              variant="outline"
                              className="gap-1"
                              onClick={() => toast.info("Export functionality coming soon")}
                            >
                              <ArrowDownIcon className="h-4 w-4" /> Export
                            </Button>
                          </div>
                        </CardFooter>
                      )}
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="audience" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Target Audience</CardTitle>
                      <CardDescription>
                        Customer segments included in this campaign
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {campaign.segments && campaign.segments.length > 0 ? (
                        <div className="space-y-4">
                          {campaign.segments.map((segment) => (
                            <div key={segment.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div>
                                <p className="font-medium">{segment.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {segment.customerCount.toLocaleString()} customers
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" className="gap-1" asChild>
                                <Link href={`/customers/segments/${segment.id}`}>
                                  View segment <ChevronRightIcon className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-2">No segments defined</p>
                          {campaign.status === 'draft' && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/campaigns/${campaign.id}/edit/audience`}>
                                <PencilIcon className="h-4 w-4 mr-1" /> Edit audience
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="offers" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Offers</CardTitle>
                      <CardDescription>
                        Offers included in this campaign
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {campaign.offers && campaign.offers.length > 0 ? (
                        <div className="space-y-4">
                          {campaign.offers.map((offer) => (
                            <div key={offer.id} className="flex items-start justify-between p-3 border rounded-md">
                              <div>
                                <p className="font-medium">{offer.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {offer.description || 'No description'}
                                </p>
                                {offer.discount && (
                                  <Badge variant="outline" className="mt-2">
                                    {offer.discount}
                                  </Badge>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" className="gap-1" asChild>
                                <Link href={`/campaigns/${campaign.id}/offers/${offer.id}`}>
                                  View details <ChevronRightIcon className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-2">No offers defined</p>
                          {campaign.status === 'draft' && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/campaigns/${campaign.id}/edit/offers`}>
                                <PencilIcon className="h-4 w-4 mr-1" /> Edit offers
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="results" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Results</CardTitle>
                      <CardDescription>
                        Performance metrics for this campaign
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {campaign.status === 'active' || campaign.status === 'completed' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground">Audience reached</p>
                              <p className="text-2xl font-bold">
                                {Math.floor((campaign.audienceSize || 0) * 0.85).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {campaign.audienceSize 
                                  ? `${Math.round(85)}% of ${campaign.audienceSize?.toLocaleString()}`
                                  : '0%'
                                }
                              </p>
                            </div>
                            
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground">Offer acceptance</p>
                              <p className="text-2xl font-bold">
                                {Math.floor((campaign.audienceSize || 0) * 0.23).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {campaign.audienceSize 
                                  ? `${Math.round(23)}% of audience`
                                  : '0%'
                                }
                              </p>
                            </div>
                            
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground">Conversion rate</p>
                              <p className="text-2xl font-bold">12.8%</p>
                              <p className="text-xs text-muted-foreground">+2.3% from previous</p>
                            </div>
                          </div>
                          
                          <div className="aspect-[16/9] bg-muted/50 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <BarChart3Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">Detailed analytics available soon</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground mb-2">
                            Campaign hasn't been launched yet
                          </p>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Results will be available once you launch the campaign and data starts coming in
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaign?.name}"? This action cannot be undone.
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
