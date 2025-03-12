'use client';

import { Card, CardContent } from '@/components/ui/card';
import { RocketIcon } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-12 pb-12">
          <div className="flex justify-center mb-4">
            <RocketIcon className="h-16 w-16 text-primary opacity-80" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Campaigns</h1>
          <p className="text-xl text-muted-foreground">Coming Soon</p>
          <p className="mt-4 text-muted-foreground">
            We're working on powerful campaign management tools to help you engage with your customers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
