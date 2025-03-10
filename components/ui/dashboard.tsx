import { Card } from "@/components/ui/card";

type DashboardProps = {
  message?: { content: any };  // Add this for backward compatibility
  title?: string;
  description?: string;
  metrics?: Array<{
    name: string;
    value: string | number;
    change?: string;
  }>;
};

export const Dashboard = ({ message, title, description, metrics }: DashboardProps) => {
  // Handle both direct props and message format
  const dashboardData = message?.content || {
    title,
    description,
    metrics
  };

  return (
    <div className="w-full max-w-4xl p-4 rounded-lg border bg-background">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">{dashboardData.title}</h2>
        <p className="text-muted-foreground">{dashboardData.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboardData.metrics?.map((metric, index) => (
          <Card key={index} className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {metric.name}
            </h3>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.change && (
              <div className={`text-sm ${metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}; 