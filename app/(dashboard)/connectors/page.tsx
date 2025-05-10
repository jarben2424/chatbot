import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connectors',
  description: 'Manage your data connectors and integrations.',
};

export default function ConnectorsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold md:text-2xl">Connectors</h1>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Available Connectors</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Connect to various data sources and third-party services.
          </p>
          
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Database</h4>
              <p className="text-sm text-muted-foreground mt-1">Connect to SQL databases</p>
            </div>
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">API</h4>
              <p className="text-sm text-muted-foreground mt-1">Connect to external APIs</p>
            </div>
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">File Storage</h4>
              <p className="text-sm text-muted-foreground mt-1">Connect to cloud storage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 