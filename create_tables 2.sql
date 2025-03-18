-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" VARCHAR(64) NOT NULL,
  "password" VARCHAR(64)
);

-- Create Chat table
CREATE TABLE IF NOT EXISTS "Chat" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "title" TEXT NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "visibility" VARCHAR NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('public', 'private'))
);

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" UUID NOT NULL REFERENCES "Chat"("id"),
  "role" VARCHAR NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

-- Create Vote table
CREATE TABLE IF NOT EXISTS "Vote" (
  "chatId" UUID NOT NULL REFERENCES "Chat"("id"),
  "messageId" UUID NOT NULL REFERENCES "Message"("id"),
  "isUpvoted" BOOLEAN NOT NULL,
  PRIMARY KEY ("chatId", "messageId")
);

-- Create Document table
CREATE TABLE IF NOT EXISTS "Document" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "kind" VARCHAR NOT NULL DEFAULT 'text' CHECK ("kind" IN ('text', 'code', 'image', 'sheet')),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  PRIMARY KEY ("id", "createdAt")
);

-- Create Suggestion table
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "documentId" UUID NOT NULL,
  "documentCreatedAt" TIMESTAMP NOT NULL,
  "originalText" TEXT NOT NULL,
  "suggestedText" TEXT NOT NULL,
  "description" TEXT,
  "isResolved" BOOLEAN NOT NULL DEFAULT false,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "Document"("id", "createdAt")
);

-- Create DashboardQuery table
CREATE TABLE IF NOT EXISTS "DashboardQuery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "title" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "sqlQuery" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "visualizationType" VARCHAR NOT NULL DEFAULT 'table' CHECK ("visualizationType" IN ('table', 'bar-chart', 'line-chart', 'highlight'))
);
