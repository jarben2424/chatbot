import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Reusable components for your applications.',
};

export default function ComponentsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold md:text-2xl">Components</h1>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">UI Components</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Reusable components to build interfaces quickly and consistently.
          </p>
          
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Buttons</h4>
              <p className="text-sm text-muted-foreground mt-1">Standard button components</p>
            </div>
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Forms</h4>
              <p className="text-sm text-muted-foreground mt-1">Input and form components</p>
            </div>
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Cards</h4>
              <p className="text-sm text-muted-foreground mt-1">Card layout components</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 