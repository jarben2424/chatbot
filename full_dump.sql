Schema: drizzle

Table: __drizzle_migrations
Columns:
id (integer, NOT NULL, default: nextval of drizzle.__drizzle_migrations_id_seq)
hash (text, NOT NULL)
created_at (bigint)
Schema: public


Table: Chat
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
createdAt (timestamp without time zone, NOT NULL)
title (text, NOT NULL)
userId (uuid, NOT NULL)
visibility (character varying, NOT NULL, default: 'private')


Table: ChatGeneratedMetrics
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
userid (text, NOT NULL)
title (text, NOT NULL)
description (text)
question (text, NOT NULL)
sqlquery (text, NOT NULL)
visualizationtype (text, NOT NULL)
category (text, NOT NULL)
conversationid (text)
createdat (timestamp with time zone, default: now())
updatedat (timestamp with time zone, default: now())


Table: DashboardMetrics
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
title (text, NOT NULL)
description (text)
category (text, NOT NULL)
visualizationtype (text, NOT NULL)
querytemplate (text, NOT NULL)
issystem (boolean, default: true)
createdat (timestamp with time zone, default: now())
updatedat (timestamp with time zone, default: now())


Table: Document
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
createdAt (timestamp without time zone, NOT NULL)
title (text, NOT NULL)
content (text)
kind (character varying, NOT NULL, default: 'text')
userId (uuid, NOT NULL)


-- Campaign table for storing campaign data
Table: Campaign
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
userId (uuid, NOT NULL)
createdAt (timestamp with time zone, NOT NULL, default: now())
updatedAt (timestamp with time zone, NOT NULL, default: now())
name (text, NOT NULL)
campaignType (text, NOT NULL)
status (text, NOT NULL, default: 'draft')
selectedOfferIds (text[], default: '{}')
useAiSegment (boolean, default: false)
selectedSegmentId (uuid)
aiSegmentPrompt (text)
audienceSize (integer)
matchingComplete (boolean, default: false)
matchCount (integer, default: 0)
integrationType (text)
integrationSettings (jsonb, default: '{}')


Table: Message
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
chatId (uuid, NOT NULL)
messageType (text)
role (character varying, NOT NULL)
content (jsonb, NOT NULL)
createdAt (timestamp without time zone, NOT NULL)


Table: Suggestion
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
documentId (uuid, NOT NULL)
documentCreatedAt (timestamp without time zone, NOT NULL)
originalText (text, NOT NULL)
suggestedText (text, NOT NULL)
description (text)
isResolved (boolean, NOT NULL, default: false)
userId (uuid, NOT NULL)
createdAt (timestamp without time zone, NOT NULL)


Table: User
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
email (character varying(64), NOT NULL)
password (character varying(64))


Table: UserDashboardMetrics
Columns:

id (uuid, NOT NULL, default: gen_random_uuid())
userid (text, NOT NULL)
sourcetype (text, NOT NULL)
sourceid (uuid, NOT NULL)
displayorder (integer, NOT NULL, default: 0)
isactive (boolean, NOT NULL, default: true)
customtitle (text)
customdescription (text)
customvisualizationtype (text)
parameters (jsonb, NOT NULL, default: '{}')
createdat (timestamp with time zone, default: now())
updatedat (timestamp with time zone, default: now())


Table: Vote
Columns:

chatId (uuid, NOT NULL)
messageId (uuid, NOT NULL)
isUpvoted (boolean, NOT NULL)


-- Report related tables
CREATE TYPE report_type AS ENUM ('dashboard_update', 'anomaly_detection', 'recommendation');
CREATE TYPE report_schedule AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE report_status AS ENUM ('success', 'failure');

Table: Report
Columns:
id (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
userId (uuid, NOT NULL, references: User.id)
title (text, NOT NULL)
description (text)
type (report_type, NOT NULL)
content (jsonb, NOT NULL)
schedule (report_schedule, NOT NULL)
customSchedule (text)
isActive (boolean, NOT NULL, default: true)
createdAt (timestamp with time zone, NOT NULL, default: now())
updatedAt (timestamp with time zone, NOT NULL, default: now())
lastSentAt (timestamp with time zone)

Table: ReportRecipient
Columns:
id (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
reportId (uuid, NOT NULL, references: Report.id ON DELETE CASCADE)
email (character varying(64), NOT NULL)
name (character varying(64))
createdAt (timestamp with time zone, NOT NULL, default: now())

Table: ReportHistory
Columns:
id (uuid, PRIMARY KEY, NOT NULL, default: gen_random_uuid())
reportId (uuid, NOT NULL, references: Report.id ON DELETE CASCADE)
status (report_status, NOT NULL)
sentAt (timestamp with time zone, NOT NULL, default: now())
recipientCount (integer, NOT NULL)
content (jsonb, NOT NULL)

-- Indexes
CREATE INDEX "report_user_id_idx" ON "Report" ("userId");
CREATE INDEX "report_recipient_report_id_idx" ON "ReportRecipient" ("reportId");
CREATE INDEX "report_history_report_id_idx" ON "ReportHistory" ("reportId");