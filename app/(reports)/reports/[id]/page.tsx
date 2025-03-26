'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit2, 
  Mail, 
  MoreHorizontal, 
  PlusCircle, 
  Save, 
  Trash2, 
  X 
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger, 
  DialogClose 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

interface ReportHistory {
  id: string;
  status: 'success' | 'failure';
  sentAt: Date;
  recipientCount: number;
}

// Mock data for initial UI development
const MOCK_REPORT = {
  id: '1',
  title: 'Weekly Dashboard Update',
  description: 'A summary of key performance metrics for the week',
  type: 'dashboard_update',
  content: {
    dashboardId: 'sales-1',
    metrics: ['revenue', 'conversion_rate', 'customer_acquisition_cost']
  },
  schedule: 'weekly',
  lastSentAt: new Date('2025-03-20T10:00:00'),
  createdAt: new Date('2025-01-15T14:30:00'),
  isActive: true,
};

const MOCK_RECIPIENTS: Recipient[] = [
  { id: '1', email: 'john.doe@example.com', name: 'John Doe' },
  { id: '2', email: 'jane.smith@example.com', name: 'Jane Smith' },
  { id: '3', email: 'marketing@example.com' },
  { id: '4', email: 'sales.team@example.com', name: 'Sales Team' },
  { id: '5', email: 'executive@example.com', name: 'Executive Team' },
];

const MOCK_HISTORY: ReportHistory[] = [
  { id: '1', status: 'success', sentAt: new Date('2025-03-20T10:00:00'), recipientCount: 5 },
  { id: '2', status: 'success', sentAt: new Date('2025-03-13T10:00:00'), recipientCount: 5 },
  { id: '3', status: 'failure', sentAt: new Date('2025-03-06T10:00:00'), recipientCount: 0 },
  { id: '4', status: 'success', sentAt: new Date('2025-02-28T10:00:00'), recipientCount: 4 },
  { id: '5', status: 'success', sentAt: new Date('2025-02-21T10:00:00'), recipientCount: 4 },
];

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState(MOCK_REPORT);
  const [recipients, setRecipients] = useState(MOCK_RECIPIENTS);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [isActive, setIsActive] = useState(report.isActive);
  
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dashboard_update':
        return '📊';
      case 'anomaly_detection':
        return '🔍';
      case 'recommendation':
        return '💡';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dashboard_update':
        return 'Dashboard Update';
      case 'anomaly_detection':
        return 'Anomaly Detection';
      case 'recommendation':
        return 'Recommendation Report';
      default:
        return 'Report';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getScheduleText = (schedule: string) => {
    switch (schedule) {
      case 'daily':
        return 'Daily at 8:00 AM';
      case 'weekly':
        return 'Every Monday at 10:00 AM';
      case 'monthly':
        return 'First day of month at 9:00 AM';
      default:
        return schedule;
    }
  };

  const handleAddRecipient = () => {
    if (!newEmail) return;
    
    const newRecipient: Recipient = {
      id: `new-${Date.now()}`,
      email: newEmail,
      name: newName || undefined
    };
    
    setRecipients([...recipients, newRecipient]);
    setNewEmail('');
    setNewName('');
    setIsAddingRecipient(false);
    toast.success('Recipient added successfully');
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
    toast.success('Recipient removed');
  };

  const handleToggleActive = () => {
    setIsActive(!isActive);
    setReport({...report, isActive: !isActive});
    toast.success(`Report ${!isActive ? 'activated' : 'deactivated'}`);
  };

  const handleDeleteReport = () => {
    router.push('/reports');
    toast.success('Report deleted');
  };

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => router.push('/reports')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Reports
      </Button>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getTypeIcon(report.type)}</span>
          <div>
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground">
              {report.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch 
              checked={isActive} 
              onCheckedChange={handleToggleActive} 
              id="report-status" 
            />
            <Label htmlFor="report-status">
              {isActive ? 'Active' : 'Inactive'}
            </Label>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/reports/edit/${params.id}`)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Report sent manually')}>
                <Mail className="mr-2 h-4 w-4" />
                Send Now
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Report
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to delete this report?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the report
                      and remove all recipients and history.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteReport}>
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="recipients">
            <TabsList className="mb-4">
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recipients">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Distribution List</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingRecipient(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Recipient
                    </Button>
                  </div>
                  <CardDescription>
                    These contacts will receive the automated report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAddingRecipient ? (
                    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Add New Recipient</h4>
                        <Button variant="ghost" size="sm" onClick={() => setIsAddingRecipient(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            placeholder="Enter recipient email" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="name">Name (Optional)</Label>
                          <Input 
                            id="name" 
                            placeholder="Enter recipient name" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddingRecipient(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddRecipient}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="space-y-2">
                    {recipients.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6">
                        No recipients yet. Add a recipient to get started.
                      </div>
                    ) : (
                      recipients.map((recipient) => (
                        <div 
                          key={recipient.id} 
                          className="flex items-center justify-between p-3 rounded-lg border group hover:bg-accent/5"
                        >
                          <div>
                            <p className="font-medium">{recipient.email}</p>
                            {recipient.name && (
                              <p className="text-sm text-muted-foreground">{recipient.name}</p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveRecipient(recipient.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>
                    Recent report delivery history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {history.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6">
                        No history yet. This report hasn't been sent.
                      </div>
                    ) : (
                      history.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={item.status === 'success' ? 'default' : 'destructive'}
                              className="capitalize"
                            >
                              {item.status}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">
                                {formatDateTime(item.sentAt)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.status === 'success' 
                                  ? `Sent to ${item.recipientCount} recipients` 
                                  : 'Delivery failed'
                                }
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Report Type</h4>
                  <p>{getTypeLabel(report.type)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Schedule</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{getScheduleText(report.schedule)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Sent</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDateTime(report.lastSentAt)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p>{formatDate(report.createdAt)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Recipients</h4>
                  <p>{recipients.length} email{recipients.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
