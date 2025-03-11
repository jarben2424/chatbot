import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Manage your external connections and integrations.',
};

export default function ConnectionsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold md:text-2xl">Connections</h1>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Manage Your Connections</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your application to external services and data sources.
          </p>
          
          {/* Connection list would go here */}
          <div className="mt-6">
            <p className="text-muted-foreground">No connections configured yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 