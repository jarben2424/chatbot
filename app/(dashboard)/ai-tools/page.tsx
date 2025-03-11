import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tools',
  description: 'Explore and use AI tools and capabilities.',
};

export default function AIToolsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold md:text-2xl">AI Tools</h1>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Available AI Tools</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Use these AI-powered tools to enhance your workflow and insights.
          </p>
          
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Data Insights</h4>
              <p className="text-sm text-muted-foreground mt-1">Analyze your data with AI</p>
            </div>
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Content Generator</h4>
              <p className="text-sm text-muted-foreground mt-1">Create content with AI assistance</p>
            </div>
            <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <h4 className="font-medium">Summarization</h4>
              <p className="text-sm text-muted-foreground mt-1">Get summaries of large documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 