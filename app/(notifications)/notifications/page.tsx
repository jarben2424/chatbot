'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertCircleIcon, 
  BarChartIcon,
  BellIcon,
  CalendarIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  CogIcon,
  LineChartIcon,
  MailIcon,
  MoreHorizontalIcon, 
  PlusCircleIcon, 
  PlusIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  Trash2Icon, 
  UsersIcon,
  ZapIcon,
  InfoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { NotificationHeader } from '@/app/(notifications)/_components/notification-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Define the notification type
enum NotificationType {
  DASHBOARD_UPDATE = 'dashboard_update',
  ANOMALY_DETECTION = 'anomaly_detection',
  RECOMMENDATION = 'recommendation',
  ALERT = 'alert'
}

// Define the Notification interface
interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  schedule: string;
  customSchedule: string | null;
  lastSentAt: string | null;
  recipientCount: number;
  content: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default notification templates
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'insights-notification',
    title: 'Insights Report',
    description: 'Weekly summary of key business metrics and trends',
    type: NotificationType.DASHBOARD_UPDATE,
    schedule: 'weekly',
    customSchedule: null,
    lastSentAt: null,
    recipientCount: 0,
    content: {},
    isActive: false,
    createdAt: new Date(2025, 1, 1).toISOString(),
    updatedAt: new Date(2025, 1, 1).toISOString(),
  },
  {
    id: 'anomalies-notification',
    title: 'Anomalies Report',
    description: 'Automatically detect and report unusual patterns in your data',
    type: NotificationType.ANOMALY_DETECTION,
    schedule: 'weekly',
    customSchedule: null,
    lastSentAt: null,
    recipientCount: 0,
    content: {},
    isActive: false,
    createdAt: new Date(2025, 1, 1).toISOString(),
    updatedAt: new Date(2025, 1, 1).toISOString(),
  }
];

// Default alert templates
const DEFAULT_ALERTS = [
  {
    id: 'sales-threshold',
    title: 'Sales Threshold Alert',
    description: 'Get notified when sales exceed a certain threshold',
    type: NotificationType.ALERT,
    schedule: 'daily',
    customSchedule: null,
    lastSentAt: null,
    recipientCount: 0,
    content: {},
    isActive: false,
    createdAt: new Date(2025, 1, 1).toISOString(),
    updatedAt: new Date(2025, 1, 1).toISOString(),
  },
  {
    id: 'inventory-low',
    title: 'Low Inventory Alert',
    description: 'Get notified when inventory falls below a certain level',
    type: NotificationType.ALERT,
    schedule: 'daily',
    customSchedule: null,
    lastSentAt: null,
    recipientCount: 0,
    content: {},
    isActive: false,
    createdAt: new Date(2025, 1, 1).toISOString(),
    updatedAt: new Date(2025, 1, 1).toISOString(),
  }
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'alerts'>('reports');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [defaultNotifications, setDefaultNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [defaultAlerts, setDefaultAlerts] = useState(DEFAULT_ALERTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [customAlertText, setCustomAlertText] = useState('');
  
  // Recipient management dialog state
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [recipientsList, setRecipientsList] = useState<{ id: string; email: string; name?: string }[]>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [savingRecipients, setSavingRecipients] = useState(false);
  
  const { toast } = useToast();

  // Fetch notifications from the API
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch reports from the Reports table
      const reportsResponse = await fetch('/api/reports');
      
      if (!reportsResponse.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const reportsData = await reportsResponse.json();
      
      // Map the data structure from the Reports table to match our Notification interface
      const reportNotificationsData = reportsData.map((report: any) => ({
        id: report.id,
        title: report.title,
        description: report.description || '',
        type: report.type as NotificationType,
        schedule: report.schedule,
        customSchedule: report.customSchedule,
        lastSentAt: report.lastSentAt,
        recipientCount: report.recipientCount || 0,
        content: report.content || {},
        isActive: report.isActive,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      }));
      
      // Fetch alerts from the Alerts table
      const alertsResponse = await fetch('/api/alerts');
      
      if (!alertsResponse.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const alertsData = await alertsResponse.json();
      
      // Map the data structure from the Alerts table to match our Notification interface
      const alertNotificationsData = alertsData.map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description || '',
        type: NotificationType.ALERT, // All alerts have the same notification type
        schedule: alert.frequency, // Map frequency to schedule
        customSchedule: alert.customFrequency,
        lastSentAt: alert.lastTriggeredAt, // Map lastTriggeredAt to lastSentAt
        recipientCount: alert.recipientCount || 0,
        content: alert.condition || {}, // Map condition to content
        isActive: alert.isActive,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      }));
      
      // Combine reports and alerts
      setNotifications([...reportNotificationsData, ...alertNotificationsData]);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Fallback to mock data if the API call fails
      fallbackToMockData();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fallback function to use mock data when API calls fail
  const fallbackToMockData = () => {
    // Mock data for development and fallback
    const mockData: Notification[] = [
      {
        id: '1',
        title: 'Weekly Sales Summary',
        description: 'Summary of sales performance over the past week',
        type: NotificationType.DASHBOARD_UPDATE,
        schedule: 'weekly',
        lastSentAt: new Date(2025, 2, 20).toISOString(),
        recipientCount: 5,
        content: {},
        isActive: true,
        createdAt: new Date(2025, 1, 1).toISOString(),
        updatedAt: new Date(2025, 2, 20).toISOString(),
        customSchedule: null
      },
      {
        id: '2',
        title: 'Inventory Level Alert',
        description: 'Get notified when inventory falls below threshold',
        type: NotificationType.ALERT,
        schedule: 'daily',
        lastSentAt: new Date(2025, 2, 25).toISOString(),
        recipientCount: 3,
        content: {},
        isActive: true,
        createdAt: new Date(2025, 1, 5).toISOString(),
        updatedAt: new Date(2025, 2, 25).toISOString(),
        customSchedule: null
      },
      {
        id: '3',
        title: 'Customer Engagement Report',
        description: 'Details on customer engagement metrics',
        type: NotificationType.RECOMMENDATION,
        schedule: 'monthly',
        lastSentAt: null,
        recipientCount: 2,
        content: {},
        isActive: false,
        createdAt: new Date(2025, 2, 1).toISOString(),
        updatedAt: new Date(2025, 2, 1).toISOString(),
        customSchedule: null
      }
    ];
    
    setNotifications(mockData);
    console.log('Using mock data as fallback');
  };

  // Filter notifications by type
  const reportNotifications = notifications.filter(
    notification => notification.type === NotificationType.DASHBOARD_UPDATE || 
                    notification.type === NotificationType.ANOMALY_DETECTION ||
                    notification.type === NotificationType.RECOMMENDATION
  );
  
  const alertNotifications = notifications.filter(
    notification => notification.type === NotificationType.ALERT
  );

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle notification deletion
  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    try {
      const response = await fetch(`/api/notifications?id=${notificationToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Remove the deleted notification from the state
      setNotifications(notifications.filter(notification => notification.id !== notificationToDelete.id));
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification. Please try again later.');
    }
  };

  // Toggle default notification or alert
  const handleToggleDefault = async (id: string, type: 'notification' | 'alert') => {
    try {
      if (type === 'notification') {
        // Find the current notification
        const notification = defaultNotifications.find(n => n.id === id);
        if (!notification) return;
        
        const isActivating = !notification.isActive;
        
        if (isActivating) {
          // Create a new record in the database
          const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: notification.title,
              description: notification.description,
              type: notification.type,
              schedule: notification.schedule,
              customSchedule: notification.customSchedule,
              content: notification.content,
              isActive: true
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create report');
          }
          
          const createdReport = await response.json();
          
          // Update the default notification with the new UUID
          setDefaultNotifications(prev => 
            prev.map(item => 
              item.id === id ? 
                { 
                  ...item, 
                  id: createdReport.id, // Use the generated UUID
                  isActive: true
                } : item
            )
          );
          
          toast({
            title: 'Notification activated',
            description: `${notification.title} has been activated successfully.`,
          });
          
          // Refresh notifications list to include the new one
          fetchNotifications();
        } else {
          // Deactivate the notification by setting isActive to false
          const response = await fetch(`/api/reports/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isActive: false
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update report');
          }
          
          setDefaultNotifications(prev => 
            prev.map(item => 
              item.id === id ? { ...item, isActive: false } : item
            )
          );
          
          toast({
            title: 'Notification deactivated',
            description: `${notification.title} has been deactivated.`,
          });
          
          // Refresh notifications list
          fetchNotifications();
        }
      } else {
        // Similar implementation for alerts
        const alert = defaultAlerts.find(a => a.id === id);
        if (!alert) return;
        
        const isActivating = !alert.isActive;
        
        if (isActivating) {
          // Create a new record in the database
          const response = await fetch('/api/alerts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: alert.title,
              description: alert.description,
              type: 'custom', // Map to the alert_type from the schema
              condition: { ...alert.content },
              frequency: alert.schedule,
              customFrequency: alert.customSchedule,
              isActive: true
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create alert');
          }
          
          const createdAlert = await response.json();
          
          // Update the default alert with the new UUID
          setDefaultAlerts(prev => 
            prev.map(item => 
              item.id === id ? 
                { 
                  ...item, 
                  id: createdAlert.id, // Use the generated UUID
                  isActive: true
                } : item
            )
          );
          
          toast({
            title: 'Alert activated',
            description: `${alert.title} has been activated successfully.`,
          });
          
          // Refresh notifications list to include the new one
          fetchNotifications();
        } else {
          // Deactivate the alert
          const response = await fetch(`/api/alerts/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isActive: false
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update alert');
          }
          
          setDefaultAlerts(prev => 
            prev.map(item => 
              item.id === id ? { ...item, isActive: false } : item
            )
          );
          
          toast({
            title: 'Alert deactivated',
            description: `${alert.title} has been deactivated.`,
          });
          
          // Refresh notifications list
          fetchNotifications();
        }
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle notification. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle creating a custom alert with natural language
  const handleCreateCustomAlert = () => {
    if (!customAlertText.trim()) return;
    
    // In a real implementation, this would send the natural language query to an AI endpoint
    console.log('Creating custom alert:', customAlertText);
    // Clear the input after processing
    setCustomAlertText('');
    // Show a success message or redirect to configuration
  };
  
  // Helper to format notification type for display
  const formatNotificationType = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DASHBOARD_UPDATE:
        return 'Dashboard Update';
      case NotificationType.ANOMALY_DETECTION:
        return 'Anomaly Detection';
      case NotificationType.RECOMMENDATION:
        return 'Recommendation';
      case NotificationType.ALERT:
        return 'Alert';
      default:
        return type;
    }
  };

  // Helper to format schedule for display
  const formatSchedule = (schedule: string, customSchedule?: string | null): string => {
    if (schedule === 'custom' && customSchedule) {
      return customSchedule;
    }
    
    return schedule.charAt(0).toUpperCase() + schedule.slice(1);
  };
  
  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  // Display an empty state when no notifications are available
  const renderEmptyState = (type: 'report' | 'alert') => (
    <div className="text-center py-10 border rounded-lg bg-card">
      <p className="text-muted-foreground mb-4">
        {type === 'report' ? 'No custom reports yet' : 'No alerts yet'}
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href={type === 'report' ? "/notifications/create" : "/notifications/alerts/create"}>
          {type === 'report' ? 'Create your first report' : 'Create your first alert'}
        </Link>
      </Button>
    </div>
  );

  // Display default notifications section
  const renderDefaultNotifications = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {defaultNotifications.map(notification => (
        <Card key={notification.id} className={notification.isActive ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-center">
                {notification.type === NotificationType.DASHBOARD_UPDATE && <BarChartIcon className="h-5 w-5 text-primary" />}
                {notification.type === NotificationType.ANOMALY_DETECTION && <AlertCircleIcon className="h-5 w-5 text-primary" />}
                <CardTitle className="text-lg">{notification.title}</CardTitle>
                <div className="flex items-center">
                  <Badge className="ml-2 bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-none">
                    Hang AI
                  </Badge>
                </div>
              </div>
              <Switch 
                checked={notification.isActive} 
                onCheckedChange={() => handleToggleDefault(notification.id, 'notification')}
              />
            </div>
            <CardDescription>{notification.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              <p>Default frequency: Weekly</p>
              <p className="flex items-center mt-1">
                <UsersIcon className="h-3 w-3 mr-1" /> 
                Recipients: {notification.recipientCount}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setCurrentNotification(notification);
                // Set up mock recipients - in a real app, fetch this from API
                setRecipientsList(
                  Array.from({ length: notification.recipientCount }, (_, i) => ({
                    id: `recipient-${i}`,
                    email: `recipient${i}@example.com`,
                    name: i === 0 ? 'Primary Contact' : undefined
                  }))
                );
                setRecipientsDialogOpen(true);
              }}
              // Disable if notification ID is not a UUID (meaning it's not created in the DB yet)
              disabled={notification.id.includes('-notification')}
              className={notification.id.includes('-notification') ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Manage Recipients
              {notification.id.includes('-notification') && 
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Activate this notification first
                  </TooltipContent>
                </Tooltip>
              }
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild={!notification.id.includes('-notification')}
              disabled={notification.id.includes('-notification')}
              className={notification.id.includes('-notification') ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {!notification.id.includes('-notification') ? (
                <Link href={`/notifications/${notification.id}/edit`}>Configure</Link>
              ) : (
                <>
                  Configure
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3 w-3 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Activate this notification first
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Display alert templates section
  const renderAlertTemplates = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {defaultAlerts.map(alert => (
        <Card key={alert.id} className={alert.isActive ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-center">
                <ZapIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{alert.title}</CardTitle>
              </div>
              <Switch 
                checked={alert.isActive} 
                onCheckedChange={() => handleToggleDefault(alert.id, 'alert')}
              />
            </div>
            <CardDescription>{alert.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              <p>Trigger: Instant when conditions are met</p>
              <p className="flex items-center mt-1">
                <UsersIcon className="h-3 w-3 mr-1" /> 
                Recipients: {alert.recipientCount}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setCurrentNotification(alert);
                // Set up mock recipients - in a real app, fetch this from API
                setRecipientsList(
                  Array.from({ length: alert.recipientCount }, (_, i) => ({
                    id: `recipient-${i}`,
                    email: `recipient${i}@example.com`,
                    name: i === 0 ? 'Primary Contact' : undefined
                  }))
                );
                setRecipientsDialogOpen(true);
              }}
              // Disable if notification ID is not a UUID (meaning it's not created in the DB yet)
              disabled={alert.id.includes('-notification')}
              className={alert.id.includes('-notification') ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Manage Recipients
              {alert.id.includes('-notification') && 
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Activate this notification first
                  </TooltipContent>
                </Tooltip>
              }
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild={!alert.id.includes('-notification')}
              disabled={alert.id.includes('-notification')}
              className={alert.id.includes('-notification') ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {!alert.id.includes('-notification') ? (
                <Link href={`/notifications/alerts/${alert.id}/edit`}>Configure</Link>
              ) : (
                <>
                  Configure
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3 w-3 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Activate this notification first
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Display create custom alert section
  const renderCreateCustomAlert = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Custom Alert</CardTitle>
        <CardDescription>
          Describe your alert condition in natural language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Alert me when sales of Product X exceed $100,000"
            value={customAlertText}
            onChange={(e) => setCustomAlertText(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCreateCustomAlert}>
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Display notification table
  const renderNotificationTable = (notifications: Notification[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Last Sent</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link 
                      href={`/notifications/${notification.id}`}
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {notification.title}
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                    {notification.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {notification.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {notification.type === NotificationType.DASHBOARD_UPDATE && <BarChartIcon className="h-3 w-3" />}
                    {notification.type === NotificationType.ANOMALY_DETECTION && <AlertCircleIcon className="h-3 w-3" />}
                    {notification.type === NotificationType.RECOMMENDATION && <LineChartIcon className="h-3 w-3" />}
                    {notification.type === NotificationType.ALERT && <ZapIcon className="h-3 w-3" />}
                    {formatNotificationType(notification.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{formatSchedule(notification.schedule, notification.customSchedule)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {notification.lastSentAt ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(notification.lastSentAt), { addSuffix: true })}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Never sent</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <UsersIcon className="h-3 w-3" />
                    <span>{notification.recipientCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/notifications/${notification.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/notifications/${notification.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentNotification(notification);
                          // Set up mock recipients - in a real app, fetch this from API
                          setRecipientsList(
                            Array.from({ length: notification.recipientCount }, (_, i) => ({
                              id: `recipient-${i}`,
                              email: `recipient${i}@example.com`,
                              name: i === 0 ? 'Primary Contact' : undefined
                            }))
                          );
                          setRecipientsDialogOpen(true);
                        }}
                      >
                        Manage Recipients
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setNotificationToDelete(notification)}
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
        <NotificationHeader />
        <div className="flex-1 flex flex-col space-y-6 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Manage your automated notifications and alerts
              </p>
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/15 text-destructive rounded-md px-4 py-3">
              {error}
            </div>
          )}
          
          <Tabs 
            defaultValue="reports" 
            className="space-y-6" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'reports' | 'alerts')}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="reports">
                <BarChartIcon className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <ZapIcon className="h-4 w-4 mr-2" />
                Alerts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Reports</h2>
                {renderDefaultNotifications()}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Custom Reports</h2>
                </div>
                
                {isLoading ? (
                  renderSkeleton()
                ) : reportNotifications.length === 0 ? (
                  renderEmptyState('report')
                ) : (
                  renderNotificationTable(reportNotifications)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="alerts" className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Alert Templates</h2>
                {renderAlertTemplates()}
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-4">Custom Alert</h2>
                {renderCreateCustomAlert()}
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Custom Alerts</h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/notifications/alerts/create">
                      <PlusCircleIcon className="h-4 w-4 mr-2" />
                      Create Custom Alert
                    </Link>
                  </Button>
                </div>
                
                {isLoading ? (
                  renderSkeleton()
                ) : alertNotifications.length === 0 ? (
                  renderEmptyState('alert')
                ) : (
                  renderNotificationTable(alertNotifications)
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{notificationToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotification} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
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
              {currentNotification?.title && (
                <>Recipients for <span className="font-medium">{currentNotification.title}</span></>
              )}
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
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                />
              </div>
              <div className="col-span-5">
                <label htmlFor="recipient-name" className="text-sm font-medium">
                  Name (Optional)
                </label>
                <Input
                  id="recipient-name"
                  placeholder="John Doe"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (!newRecipientEmail.trim() || !isValidEmail(newRecipientEmail)) {
                      toast({
                        title: "Invalid email",
                        description: "Please enter a valid email address",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    const newRecipient = {
                      id: `temp-${Date.now()}`,
                      email: newRecipientEmail,
                      name: newRecipientName || undefined
                    };
                    
                    setRecipientsList([...recipientsList, newRecipient]);
                    setNewRecipientEmail('');
                    setNewRecipientName('');
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
                <div className="divide-y">
                  {recipientsList.map((recipient) => (
                    <div key={recipient.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MailIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{recipient.email}</p>
                          {recipient.name && <p className="text-sm text-muted-foreground">{recipient.name}</p>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRecipientsList(recipientsList.filter(r => r.id !== recipient.id));
                        }}
                      >
                        <Trash2Icon className="h-4 w-4 text-destructive" />
                      </Button>
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
                // In a real implementation, this would save to the API
                setTimeout(() => {
                  if (currentNotification) {
                    // Create a copy of the notifications array
                    const updatedNotifications = [...notifications];
                    
                    // Find the notification to update
                    const index = updatedNotifications.findIndex(n => n.id === currentNotification.id);
                    
                    if (index !== -1) {
                      // Update the recipientCount in the notification
                      updatedNotifications[index] = {
                        ...updatedNotifications[index],
                        recipientCount: recipientsList.length
                      };
                      
                      // Update state
                      setNotifications(updatedNotifications);
                    }
                  }
                  
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
    </> 
  );
}
