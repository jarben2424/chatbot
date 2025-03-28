-- Create Report table
CREATE TABLE IF NOT EXISTS "Report" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('dashboard_update', 'anomaly_detection', 'recommendation')),
  "content" JSONB NOT NULL DEFAULT '{}',
  "schedule" VARCHAR(50) NOT NULL CHECK ("schedule" IN ('daily', 'weekly', 'monthly', 'custom')),
  "customSchedule" VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "lastSentAt" TIMESTAMP WITH TIME ZONE,
  "userId" UUID NOT NULL REFERENCES "User"("id")
);

-- Create ReportRecipient table for managing report distribution
CREATE TABLE IF NOT EXISTS "ReportRecipient" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reportId" UUID NOT NULL REFERENCES "Report"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create Alert table - separate from reports
CREATE TABLE IF NOT EXISTS "Alert" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "condition" TEXT NOT NULL, -- Natural language condition or JSON structure for programmatic conditions
  "conditionType" VARCHAR(50) NOT NULL DEFAULT 'natural_language' CHECK ("conditionType" IN ('natural_language', 'programmatic')), 
  "parameters" JSONB NOT NULL DEFAULT '{}', -- For threshold values, metrics, etc.
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "lastTriggeredAt" TIMESTAMP WITH TIME ZONE,
  "userId" UUID NOT NULL REFERENCES "User"("id")
);

-- Create AlertRecipient table for managing alert distribution
CREATE TABLE IF NOT EXISTS "AlertRecipient" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "alertId" UUID NOT NULL REFERENCES "Alert"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ReportMetrics junction table to connect reports with dashboard metrics
CREATE TABLE IF NOT EXISTS "ReportMetrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reportId" UUID NOT NULL REFERENCES "Report"("id") ON DELETE CASCADE,
  "metricId" UUID NOT NULL,
  "sourceType" VARCHAR(50) NOT NULL CHECK ("sourceType" IN ('dashboard', 'sales', 'customers', 'skus')),
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create default reports
INSERT INTO "Report" ("title", "description", "type", "content", "schedule", "isActive", "userId")
SELECT 
  'Insights Report', 
  'Weekly summary of key business metrics and trends', 
  'dashboard_update', 
  '{}', 
  'weekly', 
  false, 
  id 
FROM "User" 
LIMIT 1;

INSERT INTO "Report" ("title", "description", "type", "content", "schedule", "isActive", "userId")
SELECT 
  'Anomalies Report', 
  'Automatically detect and report unusual patterns in your data', 
  'anomaly_detection', 
  '{}', 
  'weekly', 
  false, 
  id 
FROM "User" 
LIMIT 1;

-- Create default alerts
INSERT INTO "Alert" ("title", "description", "condition", "parameters", "isActive", "userId")
SELECT 
  'Sales Threshold Alert', 
  'Get notified when sales exceed a certain threshold', 
  'Sales exceed threshold', 
  '{"threshold": 100000, "metric": "total_sales"}', 
  false, 
  id 
FROM "User" 
LIMIT 1;

INSERT INTO "Alert" ("title", "description", "condition", "parameters", "isActive", "userId")
SELECT 
  'Low Inventory Alert', 
  'Get notified when inventory falls below a certain level', 
  'Inventory below threshold', 
  '{"threshold": 10, "metric": "inventory_level"}', 
  false, 
  id 
FROM "User" 
LIMIT 1;
