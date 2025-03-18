-- Create the UserDashboardMetrics table
CREATE TABLE IF NOT EXISTS "UserDashboardMetrics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  question TEXT,
  "sqlQuery" TEXT NOT NULL,
  "visualizationType" TEXT NOT NULL DEFAULT 'highlight',
  "dashboardType" TEXT NOT NULL DEFAULT 'general',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_user_dashboard_metrics_user_id ON "UserDashboardMetrics" ("userId");
CREATE INDEX IF NOT EXISTS idx_user_dashboard_metrics_is_active ON "UserDashboardMetrics" ("isActive");
CREATE INDEX IF NOT EXISTS idx_user_dashboard_metrics_dashboard_type ON "UserDashboardMetrics" ("dashboardType");

-- Create RLS policies to protect access to the metrics
ALTER TABLE "UserDashboardMetrics" ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own metrics
CREATE POLICY "Users can view their own metrics"
  ON "UserDashboardMetrics"
  FOR SELECT
  USING ("userId" = auth.uid()::TEXT);

-- Policy to allow users to insert their own metrics
CREATE POLICY "Users can insert their own metrics"
  ON "UserDashboardMetrics"
  FOR INSERT
  WITH CHECK ("userId" = auth.uid()::TEXT);

-- Policy to allow users to update their own metrics
CREATE POLICY "Users can update their own metrics"
  ON "UserDashboardMetrics"
  FOR UPDATE
  USING ("userId" = auth.uid()::TEXT);

-- Policy to allow users to delete their own metrics
CREATE POLICY "Users can delete their own metrics"
  ON "UserDashboardMetrics"
  FOR DELETE
  USING ("userId" = auth.uid()::TEXT);
