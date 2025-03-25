'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignHeader } from '../_components/campaign-header';

export default function CampaignsPage() {
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <CampaignHeader />
        <div className="flex-1 flex flex-col space-y-6 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <Button asChild>
              <Link href="/campaigns/create">New Campaign</Link>
            </Button>
          </div>
          
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">No active campaigns yet</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/campaigns/create">Create your first campaign</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="draft" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">No draft campaigns</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/campaigns/create">Create a draft</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">No completed campaigns</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/campaigns/create">View campaign history</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
