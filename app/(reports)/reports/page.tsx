'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarIcon, ChevronRightIcon, MoreHorizontalIcon, PlusCircleIcon, TagIcon, UserIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportHeader } from '../_components/report-header';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the Report type based on our schema
interface Report {
  id: string;
  title: string;
  description?: string;
  type: string; // 'dashboard_update' | 'anomaly_detection' | 'recommendation'
  schedule: string; // 'daily' | 'weekly' | 'monthly' | 'custom'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSentAt?: string;
  recipientCount?: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }).format(date);
  };

  // Fetch reports function (extracted for reuse after deletion)
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/reports');
      
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Could not load reports. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reports from API
  useEffect(() => {
    fetchReports();
  }, []);

  // Handle report deletion
  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/reports?id=${reportToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      toast.success(`Report "${reportToDelete.title}" deleted successfully`);
      
      // Refresh the reports list
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report. Please try again.');
    } finally {
      setIsDeleting(false);
      setReportToDelete(null);
    }
  };

  // Get a label for the report type
  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'dashboard_update':
        return 'Dashboard';
      case 'anomaly_detection':
        return 'Anomaly';
      case 'recommendation':
        return 'Recommendation';
      default:
        return type;
    }
  };

  // Render status badge with appropriate styling
  const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-500">
          Active
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">Inactive</Badge>
      );
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

  // Display an empty state when no reports are available
  const renderEmptyState = () => (
    <div className="text-center py-10 border rounded-lg bg-card">
      <p className="text-muted-foreground mb-4">No reports yet</p>
      <Link href="/reports/create">
        <Button 
          variant="outline" 
          size="sm"
        >
          Create Report
        </Button>
      </Link>
    </div>
  );

  // Display report table
  const renderReportTable = (filteredReports: Report[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Sent</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No reports found.
              </TableCell>
            </TableRow>
          ) : (
            // Sort reports by status: active first, then inactive
            filteredReports
              .sort((a, b) => {
                const statusOrder = { true: 0, false: 1 };
                return statusOrder[a.isActive.toString() as keyof typeof statusOrder] - statusOrder[b.isActive.toString() as keyof typeof statusOrder];
              })
              .map((report) => (
              <TableRow key={report.id} className="cursor-pointer" onClick={() => window.location.href = `/reports/${report.id}`}>
                <TableCell className="font-medium">
                  <span className="line-clamp-1">{report.title}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal flex items-center gap-1 w-fit">
                    <TagIcon className="h-3 w-3" /> 
                    {getReportTypeLabel(report.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {renderStatusBadge(report.isActive)}
                </TableCell>
                <TableCell>
                  <span className="capitalize">{report.schedule}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" /> 
                    {formatDate(report.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  {report.lastSentAt ? (
                    <div className="flex items-center gap-1 text-sm">
                      {formatDate(report.lastSentAt)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  {report.recipientCount ? (
                    <div className="flex items-center gap-1 text-sm">
                      <UserIcon className="h-3 w-3" /> 
                      {report.recipientCount}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">0</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => window.location.href = `/reports/${report.id}`}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `/reports/edit/${report.id}`}>
                        Edit Report
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setReportToDelete(report)}
                      >
                        Delete Report
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
    <div className="flex flex-col h-full">
      <ReportHeader />
      
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              Manage and schedule automated reports
            </p>
          </div>
          <div className="flex items-center justify-end">
            <Link href="/reports/create">
              <Button 
                variant="default" 
                size="default" 
                className="gap-1"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Create Report
              </Button>
            </Link>
          </div>
        </div>
        
        {isLoading ? (
          renderSkeleton()
        ) : error ? (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md">
            {error}
          </div>
        ) : reports.length === 0 ? (
          renderEmptyState()
        ) : (
          renderReportTable(reports)
        )}
      </div>
      
      <AlertDialog
        open={reportToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setReportToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the report "{reportToDelete?.title}".
              This action cannot be undone.
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
    </div>
  );
}
