'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash, Eye, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmailPreview } from '@/app/dashboards/_components/email-preview';
import { 
  getEmailSubscriptions, 
  updateEmailSubscription, 
  deleteEmailSubscription, 
  saveEmailSubscription, 
  DashboardEmailSubscription, 
  getEmailPreview, 
} from '@/lib/local-storage';
import { EmailSubscriptionForm } from './email-subscription-form';

export function EmailSubscriptionsList({ 
  onSubscriptionChange,
  isAddingSubscription: externalIsAdding,
  setIsAddingSubscription: externalSetIsAdding
}: { 
  onSubscriptionChange?: () => void,
  isAddingSubscription?: boolean,
  setIsAddingSubscription?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [subscriptions, setSubscriptions] = useState<DashboardEmailSubscription[]>([]);
  const [internalIsAddingSubscription, setInternalIsAddingSubscription] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<DashboardEmailSubscription | null>(null);
  const [previewSubscription, setPreviewSubscription] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<string | null>(null);

  // Use either external or internal state for adding subscription
  const isAddingSubscription = externalIsAdding !== undefined ? externalIsAdding : internalIsAddingSubscription;
  const setIsAddingSubscription = externalSetIsAdding || setInternalIsAddingSubscription;

  // Load subscriptions from local storage
  useEffect(() => {
    const loadSubscriptions = () => {
      const subs = getEmailSubscriptions();
      setSubscriptions(subs);
      // Notify parent component about subscription changes
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
    };
    
    loadSubscriptions();
    
    // Set up an interval to refresh the list every minute
    const intervalId = setInterval(loadSubscriptions, 60000);
    
    return () => clearInterval(intervalId);
  }, [onSubscriptionChange]);

  const handleToggleActive = (id: string, currentActive: boolean) => {
    const updatedSubscription = updateEmailSubscription(id, { active: !currentActive });
    if (updatedSubscription) {
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.map(sub => 
          sub.id === id ? updatedSubscription : sub
        )
      );
      // Notify parent component about subscription changes
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
    }
  };

  // Handle subscription deletion
  const handleDeleteSubscription = (id: string) => {
    deleteEmailSubscription(id);
    setSubscriptions(getEmailSubscriptions());
    setDeleteConfirmDialog(null);
    // Notify parent component about subscription changes
    if (onSubscriptionChange) {
      onSubscriptionChange();
    }
  };

  // Handle saving a subscription (create or update)
  const handleSaveSubscription = (subscription: DashboardEmailSubscription) => {
    if (editingSubscription) {
      updateEmailSubscription(subscription.id, {
        name: subscription.name,
        dashboardQueryIds: subscription.dashboardQueryIds,
        recipients: subscription.recipients,
        cadence: subscription.cadence,
        active: subscription.active
      });
    } else {
      saveEmailSubscription({
        name: subscription.name,
        dashboardQueryIds: subscription.dashboardQueryIds,
        recipients: subscription.recipients,
        cadence: subscription.cadence,
        active: subscription.active
      });
    }
    
    setSubscriptions(getEmailSubscriptions());
    setIsAddingSubscription(false);
    setEditingSubscription(null);
    
    // Notify parent component about subscription changes
    if (onSubscriptionChange) {
      onSubscriptionChange();
    }
  };

  const getCadenceLabel = (cadence: string) => {
    switch (cadence) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'monthly':
        return 'Every month';
      default:
        return cadence;
    }
  };

  const formatRecipients = (recipients: string[]) => {
    if (recipients.length === 0) return 'No recipients';
    if (recipients.length === 1) return recipients[0];
    return `${recipients[0]} +${recipients.length - 1} more`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Subscriptions</CardTitle>
              <CardDescription>
                Receive automated email updates for your dashboard metrics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No email subscriptions</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first subscription to receive dashboard updates via email.
              </p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => setIsAddingSubscription(true)}
              >
                Create Subscription
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.name}</TableCell>
                    <TableCell>{formatRecipients(subscription.recipients)}</TableCell>
                    <TableCell>{getCadenceLabel(subscription.cadence)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={subscription.active}
                          onCheckedChange={() => handleToggleActive(subscription.id, subscription.active)}
                        />
                        <Badge variant={subscription.active ? "default" : "outline"}>
                          {subscription.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewSubscription(subscription.id)}
                          title="Preview Email"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSubscription(subscription)}
                          title="Edit Subscription"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmDialog(subscription.id)}
                          title="Delete Subscription"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Subscription Dialog */}
      <Dialog open={isAddingSubscription} onOpenChange={setIsAddingSubscription}>
        <DialogContent className="sm:max-w-[900px]">
          <EmailSubscriptionForm
            onSave={handleSaveSubscription}
            onCancel={() => setIsAddingSubscription(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog 
        open={!!editingSubscription} 
        onOpenChange={(open) => !open && setEditingSubscription(null)}
      >
        <DialogContent className="sm:max-w-[900px]">
          {editingSubscription && (
            <EmailSubscriptionForm
              subscription={editingSubscription}
              onSave={handleSaveSubscription}
              onCancel={() => setEditingSubscription(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Email Dialog */}
      <Dialog 
        open={!!previewSubscription} 
        onOpenChange={(open) => !open && setPreviewSubscription(null)}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how your email will look when sent to recipients
            </DialogDescription>
          </DialogHeader>
          
          {previewSubscription && (
            <EmailPreview subscriptionId={previewSubscription} />
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewSubscription(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteConfirmDialog} 
        onOpenChange={(open) => !open && setDeleteConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this email subscription? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmDialog && handleDeleteSubscription(deleteConfirmDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
