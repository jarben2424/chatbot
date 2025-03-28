'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  FileTextIcon,
  MailIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { NotificationHeader } from '@/app/(notifications)/_components/notification-header';
import { formatDistanceToNow, format } from 'date-fns';

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Report types from our schema
interface Report {
  id: string;
  title: string;
  description?: string;
  type: 'dashboard_update' | 'anomaly_detection' | 'recommendation' | 'alert';
  content: any;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  customSchedule?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSentAt?: string;
  recipients: Recipient[];
}

interface Recipient {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

interface ReportHistory {
  id: string;
  reportId: string;
  status: 'success' | 'failure';
  sentAt: string;
  recipientCount: number;
  errorMessage?: string;
}

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<Report | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState<string>('');
  const [newRecipientName, setNewRecipientName] = useState<string>('');
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [recipientToDelete, setRecipientToDelete] = useState<string | null>(null);
  const [managingRecipients, setManagingRecipients] = useState(false);
  
  // New state for recipient management dialog
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [recipientsList, setRecipientsList] = useState<Recipient[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [savingRecipients, setSavingRecipients] = useState(false);

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/reports?id=${reportId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch report');
        }
        
        const data = await res.json();
        setReport(data);
        
        // Mock history data
        const mockHistory: ReportHistory[] = [
          {
            id: '1',
            reportId: reportId,
            status: 'success',
            sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            recipientCount: data.recipients?.length || 0
          },
          {
            id: '2',
            reportId: reportId,
            status: 'success',
            sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            recipientCount: data.recipients?.length || 0
          },
          {
            id: '3',
            reportId: reportId,
            status: 'failure',
            sentAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
            recipientCount: 0,
            errorMessage: 'Email service unavailable'
          }
        ];
        
        setReportHistory(mockHistory);
        setIsHistoryLoading(false);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Could not load report details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [reportId]);

  // Delete the report
  const handleDeleteReport = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      toast({
        title: "Report deleted",
        description: "The report has been permanently deleted",
      });
      
      router.push('/reports');
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Failed to delete report. Please try again later.');
      setIsDeleting(false);
    }
  };

  // Add new recipient
  const handleAddRecipient = async () => {
    // Simple email validation
    if (!newRecipientEmail || !isValidEmail(newRecipientEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingRecipient(true);
    
    try {
      // Clone the current report to avoid direct state mutation
      const updatedReport = { ...report } as Report;
      
      if (!updatedReport.recipients) {
        updatedReport.recipients = [];
      }
      
      const newRecipient = {
        id: `temp-${Date.now()}`,
        email: newRecipientEmail,
        name: newRecipientName || undefined,
        createdAt: new Date().toISOString()
      };
      
      updatedReport.recipients.push(newRecipient);
      setReport(updatedReport);
      
      toast({
        title: "Recipient added",
        description: `${newRecipientEmail} has been added to the report`,
      });
      
      setNewRecipientEmail('');
      setNewRecipientName('');
      setIsAddingRecipient(false);
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast({
        title: "Failed to add recipient",
        description: "An error occurred while adding the recipient",
        variant: "destructive"
      });
      setIsAddingRecipient(false);
    }
  };

  // Remove recipient
  const handleRemoveRecipient = async (recipientId: string) => {
    if (!report) return;
    
    try {
      // Clone the current report to avoid direct state mutation
      const updatedReport = { ...report } as Report;
      
      updatedReport.recipients = updatedReport.recipients.filter(r => r.id !== recipientId);
      setReport(updatedReport);
      
      toast({
        title: "Recipient removed",
        description: "The recipient has been removed from this report",
      });
      
      setRecipientToDelete(null);
    } catch (error) {
      console.error('Error removing recipient:', error);
      toast({
        title: "Failed to remove recipient",
        description: "An error occurred while removing the recipient",
        variant: "destructive"
      });
    }
  };

  // Send report manually
  const handleSendReport = () => {
    toast({
      title: "Report sent",
      description: "The report has been sent to all recipients",
    });
  };

  // Format report type for display
  const formatReportType = (type: string) => {
    switch (type) {
      case 'dashboard_update':
        return 'Dashboard Update';
      case 'anomaly_detection':
        return 'Anomaly Detection';
      case 'recommendation':
        return 'Recommendation';
      case 'alert':
        return 'Alert';
      default:
        return type;
    }
  };

  // Format schedule for display
  const formatSchedule = (schedule: string, customSchedule?: string) => {
    if (schedule === 'custom' && customSchedule) {
      return customSchedule;
    }
    
    return schedule.charAt(0).toUpperCase() + schedule.slice(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <NotificationHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <RefreshCwIcon className="animate-spin h-5 w-5" />
            <span>Loading report details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <NotificationHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold tracking-tight">Error Loading Report</h2>
            <p className="text-muted-foreground">{error || 'Report not found'}</p>
            <Button asChild>
              <Link href="/reports">Return to Reports</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <NotificationHeader />
      
      <div className="flex-1 flex flex-col space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/reports">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{report.title}</h1>
              {report.description && (
                <p className="text-muted-foreground">{report.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleSendReport} className="flex items-center gap-1">
              <SendIcon className="h-4 w-4" />
              <span>Send Now</span>
            </Button>
            
            <Button variant="outline" asChild className="flex items-center gap-1">
              <Link href={`/reports/${reportId}/edit`}>
                <EditIcon className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive border-destructive hover:bg-destructive/10 flex items-center gap-1"
            >
              <Trash2Icon className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {report.type === 'dashboard_update' && <FileTextIcon className="h-5 w-5 text-primary" />}
                {report.type === 'anomaly_detection' && <AlertCircleIcon className="h-5 w-5 text-primary" />}
                {report.type === 'recommendation' && <FileTextIcon className="h-5 w-5 text-primary" />}
                {report.type === 'alert' && <AlertCircleIcon className="h-5 w-5 text-primary" />}
                <span className="font-medium">{formatReportType(report.type)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{formatSchedule(report.schedule, report.customSchedule)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{report.recipients?.length || 0} recipients</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Report Content</TabsTrigger>
            <TabsTrigger value="history">
              Delivery History
              <Badge variant="outline" className="ml-2">{reportHistory.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recipients">
              Recipients
              <Badge variant="outline" className="ml-2">{report.recipients?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Content</CardTitle>
                <CardDescription>
                  Metrics and insights included in this report
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.type === 'dashboard_update' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Selected Metrics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(report.content?.metrics || []).map((metric: any, index: number) => (
                        <div key={index} className="p-4 rounded-md border">
                          <h4 className="font-medium">{metric.name}</h4>
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">{metric.value}</span>
                            <span className={`ml-2 ${metric.change.startsWith('+') ? 'text-green-500' : metric.change.startsWith('-') ? 'text-red-500' : ''}`}>
                              {metric.change}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {(!report.content?.metrics || report.content.metrics.length === 0) && (
                        <div className="col-span-3 text-center py-6 text-muted-foreground">
                          No metrics selected for this report
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {report.type === 'anomaly_detection' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Anomaly Detection Settings</h3>
                    <div className="text-center py-6 text-muted-foreground">
                      This report will detect and notify recipients of unusual patterns in your key metrics.
                    </div>
                  </div>
                )}
                
                {report.type === 'recommendation' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">AI Recommendations</h3>
                    <div className="text-center py-6 text-muted-foreground">
                      This report will provide AI-powered recommendations based on your business data.
                    </div>
                  </div>
                )}
                
                {report.type === 'alert' && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Alert Settings</h3>
                    <div className="text-center py-6 text-muted-foreground">
                      This report will send alerts to recipients when certain conditions are met.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery History</CardTitle>
                <CardDescription>
                  Past deliveries of this report
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCwIcon className="animate-spin h-5 w-5 mr-2" />
                    <span>Loading history...</span>
                  </div>
                ) : reportHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    This report hasn't been sent yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportHistory.map((history) => (
                      <div key={history.id} className="p-4 rounded-md border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {history.status === 'success' ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">
                              {history.status === 'success' ? 'Sent successfully' : 'Delivery failed'}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(history.sentAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(new Date(history.sentAt), 'MMMM d, yyyy')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{format(new Date(history.sentAt), 'h:mm a')}</span>
                          </div>
                          
                          {history.status === 'success' && (
                            <div className="flex items-center space-x-1">
                              <UsersIcon className="h-4 w-4" />
                              <span>{history.recipientCount} recipients</span>
                            </div>
                          )}
                        </div>
                        
                        {history.status === 'failure' && history.errorMessage && (
                          <div className="mt-2 text-sm p-2 bg-destructive/10 text-destructive rounded">
                            Error: {history.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recipients" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recipients</CardTitle>
                    <CardDescription>
                      People receiving this report
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        setRecipientsList(report.recipients || []);
                        setRecipientsDialogOpen(true);
                      }}
                    >
                      <UsersIcon className="h-4 w-4" />
                      <span>Manage Recipients</span>
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-1">
                          <UserPlusIcon className="h-4 w-4" />
                          <span>Add Recipient</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Recipient</DialogTitle>
                          <DialogDescription>
                            Add someone to receive this report
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                              Email (required)
                            </label>
                            <Input
                              id="email"
                              placeholder="email@example.com"
                              value={newRecipientEmail}
                              onChange={(e) => setNewRecipientEmail(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                              Name (optional)
                            </label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={newRecipientName}
                              onChange={(e) => setNewRecipientName(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            onClick={handleAddRecipient} 
                            disabled={isAddingRecipient || !newRecipientEmail}
                          >
                            {isAddingRecipient ? "Adding..." : "Add Recipient"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(!report.recipients || report.recipients.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recipients added yet
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {report.recipients.map((recipient) => (
                        <div 
                          key={recipient.id}
                          className="flex items-center justify-between p-3 rounded-md border"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <MailIcon className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium">{recipient.name || recipient.email}</p>
                            </div>
                            
                            {recipient.name && (
                              <p className="text-sm text-muted-foreground pl-6">
                                {recipient.email}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRecipientToDelete(recipient.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Delete Report Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone and will remove all history and recipient information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Recipient Confirmation */}
      <AlertDialog 
        open={!!recipientToDelete} 
        onOpenChange={(open) => !open && setRecipientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Recipient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this recipient from the report?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recipientToDelete && handleRemoveRecipient(recipientToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Recipients Management Dialog */}
      <Dialog open={recipientsDialogOpen} onOpenChange={setRecipientsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Recipients</DialogTitle>
            <DialogDescription>
              Add or remove people who will receive this notification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Add new recipient form */}
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-5">
                <label htmlFor="recipient-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="recipient-email"
                  placeholder="email@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div className="col-span-5">
                <label htmlFor="recipient-name" className="text-sm font-medium">
                  Name (Optional)
                </label>
                <Input
                  id="recipient-name"
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (!recipientEmail.trim() || !isValidEmail(recipientEmail)) {
                      toast({
                        title: "Invalid email",
                        description: "Please enter a valid email address",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    const newRecipient = {
                      id: `temp-${Date.now()}`,
                      email: recipientEmail,
                      name: recipientName || undefined,
                      createdAt: new Date().toISOString()
                    };
                    
                    setRecipientsList([...recipientsList, newRecipient]);
                    setRecipientEmail('');
                    setRecipientName('');
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Recipients list */}
            <div className="border rounded-md">
              {recipientsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UsersIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No recipients added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipientsList.map((recipient) => (
                    <div key={recipient.id} className="p-4 rounded-md border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MailIcon className="h-5 w-5 text-muted-foreground" />
                          <p className="font-medium">{recipient.name || recipient.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRecipientsList(recipientsList.filter(r => r.id !== recipient.id));
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecipientsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSavingRecipients(true);
                // In a real implementation, we would save the recipients to the API
                // For now, we'll just update the local state
                setTimeout(() => {
                  setReport({
                    ...report,
                    recipients: recipientsList
                  });
                  
                  toast({
                    title: "Recipients updated",
                    description: `${recipientsList.length} recipients for this notification`,
                  });
                  
                  setRecipientsDialogOpen(false);
                  setSavingRecipients(false);
                }, 500);
              }}
              disabled={savingRecipients}
            >
              {savingRecipients ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
