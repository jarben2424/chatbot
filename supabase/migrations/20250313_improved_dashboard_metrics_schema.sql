-- Drop existing tables if they exist
DROP TABLE IF EXISTS "UserDashboardMetrics";
DROP TABLE IF EXISTS "ChatGeneratedMetrics";

-- 2. Create ChatGeneratedMetrics table (metrics created via AI chat)
CREATE TABLE "ChatGeneratedMetrics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL, -- Changed from TEXT to UUID for consistency
  title TEXT NOT NULL,
  description TEXT,
  question TEXT NOT NULL, -- The original question that generated this metric
  sqlQuery TEXT NOT NULL, -- The actual SQL query
  visualizationType TEXT NOT NULL CHECK (visualizationType IN ('highlight', 'chart', 'table')),
  category TEXT NOT NULL CHECK (category IN ('sales', 'customers', 'skus', 'general')),
  conversationId TEXT, -- Reference to the chat conversation
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_chat_generated_metrics_user_id ON "ChatGeneratedMetrics" (userId);
CREATE INDEX idx_chat_generated_metrics_category ON "ChatGeneratedMetrics" (category);

-- 3. Create UserDashboardMetrics table (dashboard configuration)
CREATE TABLE "UserDashboardMetrics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL, -- Changed from TEXT to UUID for consistency
  sourceType TEXT NOT NULL CHECK (sourceType IN ('dashboard_metric', 'chat_generated_metric')),
  sourceId UUID NOT NULL, -- ID from either DashboardMetrics or ChatGeneratedMetrics
  displayOrder INTEGER NOT NULL DEFAULT 0,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  customTitle TEXT, -- Optional user-provided custom title (overrides source)
  customDescription TEXT, -- Optional user-provided description
  customVisualizationType TEXT CHECK (customVisualizationType IN ('highlight', 'chart', 'table')),
  parameters JSONB DEFAULT '{}', -- Any parameters needed for the query template
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_user_dashboard_metrics_user_id ON "UserDashboardMetrics" (userId);
CREATE INDEX idx_user_dashboard_metrics_source ON "UserDashboardMetrics" (sourceType, sourceId);
CREATE INDEX idx_user_dashboard_metrics_is_active ON "UserDashboardMetrics" (isActive);

-- Create a trigger function to validate sourceId references
CREATE OR REPLACE FUNCTION validate_metric_source_reference()
RETURNS TRIGGER AS $$
DECLARE
  source_exists BOOLEAN;
BEGIN
  IF NEW.sourceType = 'dashboard_metric' THEN
    SELECT EXISTS(SELECT 1 FROM "DashboardMetrics" WHERE id = NEW.sourceId) INTO source_exists;
  ELSIF NEW.sourceType = 'chat_generated_metric' THEN
    SELECT EXISTS(SELECT 1 FROM "ChatGeneratedMetrics" WHERE id = NEW.sourceId) INTO source_exists;
  ELSE
    RAISE EXCEPTION 'Invalid sourceType: %', NEW.sourceType;
  END IF;
  
  IF NOT source_exists THEN
    RAISE EXCEPTION 'Referenced source ID % does not exist in % table', NEW.sourceId, NEW.sourceType;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the UserDashboardMetrics table
CREATE TRIGGER check_metric_source_reference
BEFORE INSERT OR UPDATE ON "UserDashboardMetrics"
FOR EACH ROW
EXECUTE FUNCTION validate_metric_source_reference();

-- Setup Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE "DashboardMetrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatGeneratedMetrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserDashboardMetrics" ENABLE ROW LEVEL SECURITY;

-- DashboardMetrics policies
-- Anyone can view DashboardMetrics
CREATE POLICY "Anyone can view DashboardMetrics"
  ON "DashboardMetrics"
  FOR SELECT
  USING (true);

-- For now, allow any authenticated user to manage DashboardMetrics
-- In a production environment, you'd want to implement proper admin checks
CREATE POLICY "Authenticated users can manage DashboardMetrics"
  ON "DashboardMetrics"
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ChatGeneratedMetrics policies
-- Users can view their own chat-generated metrics
CREATE POLICY "Users can view their own ChatGeneratedMetrics"
  ON "ChatGeneratedMetrics"
  FOR SELECT
  USING (userId = auth.uid());

-- Users can insert their own chat-generated metrics
CREATE POLICY "Users can insert their own ChatGeneratedMetrics"
  ON "ChatGeneratedMetrics"
  FOR INSERT
  WITH CHECK (userId = auth.uid());

-- Users can update their own chat-generated metrics
CREATE POLICY "Users can update their own ChatGeneratedMetrics"
  ON "ChatGeneratedMetrics"
  FOR UPDATE
  USING (userId = auth.uid());

-- Users can delete their own chat-generated metrics
CREATE POLICY "Users can delete their own ChatGeneratedMetrics"
  ON "ChatGeneratedMetrics"
  FOR DELETE
  USING (userId = auth.uid());

-- UserDashboardMetrics policies
-- Users can view their own dashboard metrics
CREATE POLICY "Users can view their own UserDashboardMetrics"
  ON "UserDashboardMetrics"
  FOR SELECT
  USING (userId = auth.uid());

-- Users can insert their own dashboard metrics
CREATE POLICY "Users can insert their own UserDashboardMetrics"
  ON "UserDashboardMetrics"
  FOR INSERT
  WITH CHECK (userId = auth.uid());

-- Users can update their own dashboard metrics
CREATE POLICY "Users can update their own UserDashboardMetrics"
  ON "UserDashboardMetrics"
  FOR UPDATE
  USING (userId = auth.uid());

-- Users can delete their own dashboard metrics
CREATE POLICY "Users can delete their own UserDashboardMetrics"
  ON "UserDashboardMetrics"
  FOR DELETE
  USING (userId = auth.uid());