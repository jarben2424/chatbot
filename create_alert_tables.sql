-- Create Alert table
CREATE TABLE IF NOT EXISTS "Alert" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('threshold', 'anomaly', 'inventory', 'sales', 'custom')),
  "condition" JSONB NOT NULL DEFAULT '{}',
  "frequency" VARCHAR(50) NOT NULL CHECK ("frequency" IN ('instant', 'hourly', 'daily', 'custom')),
  "customFrequency" VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "lastTriggeredAt" TIMESTAMP WITH TIME ZONE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create AlertRecipient table for managing alert notifications
CREATE TABLE IF NOT EXISTS "AlertRecipient" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "alertId" UUID NOT NULL REFERENCES "Alert"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "notifyBy" VARCHAR(50) NOT NULL DEFAULT 'email' CHECK ("notifyBy" IN ('email', 'sms', 'slack', 'app')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create AlertHistory table to track alert triggers
CREATE TABLE IF NOT EXISTS "AlertHistory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "alertId" UUID NOT NULL REFERENCES "Alert"("id") ON DELETE CASCADE,
  "triggeredAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}',
  "status" VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK ("status" IN ('sent', 'failed', 'pending')),
  "recipientCount" INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alert_user_id ON "Alert"("userId");
CREATE INDEX IF NOT EXISTS idx_alert_is_active ON "Alert"("isActive");
CREATE INDEX IF NOT EXISTS idx_alert_recipient_alert_id ON "AlertRecipient"("alertId");
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON "AlertHistory"("alertId");
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON "AlertHistory"("triggeredAt");

-- Sample data for testing (uncomment to use)
/*
-- Insert sample alerts
INSERT INTO "Alert" (
  "title", "description", "type", "condition", "frequency", 
  "isActive", "userId"
) VALUES 
(
  'Low Inventory Alert', 
  'Notify when inventory falls below threshold',
  'inventory',
  '{"productId": "all", "threshold": 10, "comparison": "less_than"}',
  'instant',
  true,
  '00000000-0000-0000-0000-000000000000' -- Replace with an actual user ID
),
(
  'Sales Milestone', 
  'Alert when daily sales exceed target',
  'sales',
  '{"target": 10000, "timeframe": "daily", "comparison": "greater_than"}',
  'daily',
  true,
  '00000000-0000-0000-0000-000000000000' -- Replace with an actual user ID
),
(
  'Customer Engagement Anomaly', 
  'Detect unusual patterns in customer engagement',
  'anomaly',
  '{"metric": "session_duration", "sensitivity": "medium"}',
  'daily',
  true,
  '00000000-0000-0000-0000-000000000000' -- Replace with an actual user ID
);
*/

-- Function to update timestamp on update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_alert_updated_at
BEFORE UPDATE ON "Alert"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_alert_recipient_updated_at
BEFORE UPDATE ON "AlertRecipient"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
